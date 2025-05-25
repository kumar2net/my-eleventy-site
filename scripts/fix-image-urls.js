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
  // First, look for reference-style image links
  const refStyleRegex = /!\[([^\]]*)\]\[([^\]]+)\]\n\n\[([^\]]+)\]: ([^\s]+)(?:\s+"([^"]+)")?\n?/g;
  const images = [];
  let match;

  while ((match = refStyleRegex.exec(content)) !== null) {
    const [fullMatch, alt, id, _, url, title] = match;
    if (url.startsWith('http:') || url.startsWith('https:')) {
      images.push({ fullMatch, alt, url, title, type: 'reference' });
    }
  }

  // Then look for inline image links
  const inlineRegex = /!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]+)")?\)/g;
  while ((match = inlineRegex.exec(content)) !== null) {
    const [fullMatch, alt, url, title] = match;
    if (url.startsWith('http:') || url.startsWith('https:')) {
      images.push({ fullMatch, alt, url, title, type: 'inline' });
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
        const imageFilename = createImageFilename(image.url, postSlug);
        const imagePath = path.join(imagesDir, imageFilename);
        const relativeImagePath = `/assets/images/${imageFilename}`;

        // Try to download the image
        const success = await tryDownloadImage(image.url, imagePath);
        
        if (success) {
          // Replace the image URL in the content
          updatedContent = updatedContent.replace(
            image.fullMatch,
            `![${image.alt}](${relativeImagePath})`
          );
          console.log(`Updated image: ${image.url} -> ${relativeImagePath}`);
          successfulDownloads++;
        } else {
          // Replace the broken image with a note
          updatedContent = updatedContent.replace(
            image.fullMatch,
            createImageRemovalNote(image)
          );
          console.log(`Removed broken image: ${image.url}`);
          failedDownloads++;
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