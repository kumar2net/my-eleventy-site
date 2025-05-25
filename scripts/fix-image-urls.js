const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const postsDir = path.join(__dirname, '../src/posts');
const imagesDir = path.join(__dirname, '../src/assets/images');

// Function to try different URL variations
async function tryDownloadImage(originalUrl, filename) {
  const urls = [
    originalUrl,
    originalUrl.replace('http://', 'https://'),
  ];

  for (const url of urls) {
    try {
      await downloadImage(url, filename);
      console.log(`Successfully downloaded from ${url}`);
      return true;
    } catch (error) {
      console.log(`Failed to download from ${url}: ${error.message}`);
    }
  }
  return false;
}

// Function to download an image using either HTTP or HTTPS
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, response => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        downloadImage(response.headers.location, filename)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const contentType = response.headers['content-type'] || '';
      if (!contentType.startsWith('image/')) {
        reject(new Error('URL does not point to an image'));
        return;
      }

      const fileStream = fs.createWriteStream(filename);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', err => {
        fs.unlink(filename, () => reject(err));
      });
    }).on('error', reject);
  });
}

// Function to extract image URLs and their context from markdown content
function extractImageUrls(content) {
  const images = [];
  let match;

  // Regex for reference-style image links, capturing optional surrounding HTML comments
  // Example: <!-- ![alt text][ref] -->
  //          <!-- [ref]: url "title" -->
  const refStyleRegex = /(?:<!--\s*)?!\[([^\]]*)\]\[([^\]]+)\](?:\s*-->)?\s*\n\s*(?:<!--\s*)?\[\2\]:\s*([^\s]+)(?:\s+"([^"]+)")?(?:\s*-->)?\n?/g;
  while ((match = refStyleRegex.exec(content)) !== null) {
    const [fullMatch, alt, id, url, title] = match;
    if (url.startsWith('http:') || url.startsWith('https:')) {
      images.push({
        fullMatch,
        alt: alt || '',
        url,
        title: title || '',
        type: 'reference',
        isCommented: fullMatch.startsWith('<!--')
      });
    }
  }

  // Regex for inline image links, capturing optional surrounding HTML comments
  // Example: <!-- ![alt text](url "title") -->
  const inlineRegex = /(?:<!--\s*)?!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]+)")?\)(?:\s*-->)?/g;
  while ((match = inlineRegex.exec(content)) !== null) {
    const [fullMatch, alt, url, title] = match;
    if (url.startsWith('http:') || url.startsWith('https:')) {
      images.push({
        fullMatch,
        alt: alt || '',
        url,
        title: title || '',
        type: 'inline',
        isCommented: fullMatch.startsWith('<!--')
      });
    }
  }

  return images;
}

// Function to create a clean filename
function createImageFilename(url, postSlug) {
  const urlHash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
  const urlParts = url.split('/');
  const originalFilename = urlParts[urlParts.length - 1].split('?')[0];
  const ext = path.extname(originalFilename) || '.jpg';
  return `${postSlug}-${urlHash}${ext}`;
}

// Function to create a note about removed image
function createImageRemovalNote(image) {
  const title = image.title ? ` - "${image.title}"` : '';
  const alt = image.alt ? ` (${image.alt})` : '';
  return `> *Note: An image that was originally here${alt}${title} is no longer available.*\n\n`;
}

// Main function to process all posts
async function fixImageUrls() {
  try {
    const files = await readdir(postsDir);
    let totalImages = 0;
    let successfulDownloads = 0;
    let failedDownloads = 0;
    let localRelinks = 0;
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(postsDir, file);
      const content = await readFile(filePath, 'utf8');
      
      // Extract post slug from filename
      const postSlug = path.basename(file, '.md').split('-').slice(3).join('-');
      
      // Find HTTP image URLs
      const images = extractImageUrls(content);
      if (images.length === 0) continue;

      totalImages += images.length;
      console.log(`\nProcessing ${file}...`);
      let updatedContent = content;

      for (const image of images) {
        const originalFilenameFromUrl = path.basename(image.url.split('?')[0]);
        const localImagePath = path.join(imagesDir, originalFilenameFromUrl);

        if (fs.existsSync(localImagePath)) {
          console.log(`Found local image for ${image.url}: ${originalFilenameFromUrl}`);
          const newImageMarkdown = `![${image.alt || ''}](${'/assets/images/' + originalFilenameFromUrl})`;
          updatedContent = updatedContent.replace(image.fullMatch, newImageMarkdown);
          localRelinks++;
        } else {
          const imageFilenameForDownload = createImageFilename(image.url, postSlug);
          const imagePathToDownloadTo = path.join(imagesDir, imageFilenameForDownload);
          const success = await tryDownloadImage(image.url, imagePathToDownloadTo);

          if (success) {
            const newImageMarkdown = `![${image.alt || ''}](${'/assets/images/' + imageFilenameForDownload})`;
            updatedContent = updatedContent.replace(image.fullMatch, newImageMarkdown);
            console.log(`Updated image: ${image.url} -> ${'/assets/images/' + imageFilenameForDownload}`);
            successfulDownloads++;
          } else {
            updatedContent = updatedContent.replace(image.fullMatch, createImageRemovalNote(image));
            console.log(`Removed broken image: ${image.url}`);
            failedDownloads++;
          }
        }
      }

      // Save the updated content if changes were made
      if (updatedContent !== content) {
        await writeFile(filePath, updatedContent);
        console.log(`Updated ${file}`);
      }
    }

    console.log('\nSummary:');
    console.log(`Total images processed: ${totalImages}`);
    console.log(`Successfully relinked local: ${localRelinks}`);
    console.log(`Successfully downloaded: ${successfulDownloads}`);
    console.log(`Removed broken images: ${failedDownloads}`);
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

// Run the script
fixImageUrls().then(() => {
  console.log('\nDone processing all files.');
}); 