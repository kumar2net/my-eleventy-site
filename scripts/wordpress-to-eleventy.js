const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const TurndownService = require('turndown');
const sanitize = require('sanitize-filename');
const mkdirp = require('mkdirp');
const he = require('he');
const https = require('https');
const crypto = require('crypto');
const { promisify } = require('util');

// Promisify fs functions
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Initialize HTML to Markdown converter
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// Custom rules for TurndownService
turndownService.addRule('removeEmptyParagraphs', {
  filter: node => {
    return node.nodeName === 'P' && node.textContent.trim() === '';
  },
  replacement: () => ''
});

// Custom rule for images
turndownService.addRule('images', {
  filter: 'img',
  replacement: (content, node) => {
    const alt = node.getAttribute('alt') || '';
    const title = node.getAttribute('title') || '';
    let url = node.getAttribute('src') || '';
    
    // Clean up WordPress.com image URLs
    url = url.split('?')[0]; // Remove query parameters
    
    // Return placeholder that we'll replace after downloading
    const imageId = crypto.createHash('md5').update(url).digest('hex');
    return `![${alt}][${imageId}]\n\n[${imageId}]: ${url}`;
  }
});

// Create necessary directories
const postsDir = path.join(__dirname, '../src/posts');
const imagesDir = path.join(__dirname, '../src/assets/images');
mkdirp.sync(postsDir);
mkdirp.sync(imagesDir);

// Function to format date safely
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // If date is invalid, use current date
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (e) {
    // If there's any error, use current date
    return new Date().toISOString();
  }
}

// Function to escape YAML special characters
function escapeYaml(str) {
  if (typeof str !== 'string') return '';
  str = he.decode(str); // Decode HTML entities
  // If string contains special characters, wrap in quotes
  if (str.match(/[:|>@\[\]{}?*&!%#`]/)) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}

// Function to clean and format tags
function formatTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => {
    // Clean the tag: lowercase, remove special chars, replace spaces with hyphens
    return tag.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }).filter(tag => tag); // Remove empty tags
}

// Function to create a clean slug
function createSlug(str) {
  return str.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Function to download an image
async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, response => {
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

// Function to extract and download images from markdown
async function processImages(markdown, postSlug) {
  const imageRegex = /!\[(.*?)\]\[(.*?)\]\n\n\[(.*?)\]: (.*?)(?=\n|$)/g;
  const images = [];
  let match;
  let processedMarkdown = markdown;

  // Extract all images
  while ((match = imageRegex.exec(markdown)) !== null) {
    const [fullMatch, alt, id, _, url] = match;
    images.push({ fullMatch, alt, id, url });
  }

  // Download and replace images
  for (const image of images) {
    try {
      // Generate filename from URL
      const urlParts = image.url.split('/');
      const originalFilename = urlParts[urlParts.length - 1].split('?')[0];
      const ext = path.extname(originalFilename) || '.jpg';
      const imageFilename = `${postSlug}-${image.id.substring(0, 8)}${ext}`;
      const imagePath = path.join(imagesDir, imageFilename);
      const relativeImagePath = `/assets/images/${imageFilename}`;

      // Download image
      await downloadImage(image.url, imagePath);
      console.log(`Downloaded image: ${imageFilename}`);

      // Replace in markdown
      processedMarkdown = processedMarkdown.replace(
        image.fullMatch,
        `![${image.alt}](${relativeImagePath})`
      );
    } catch (error) {
      console.error(`Failed to process image ${image.url}:`, error.message);
      // Keep original URL if download fails
      processedMarkdown = processedMarkdown.replace(
        image.fullMatch,
        `![${image.alt}](${image.url})`
      );
    }
  }

  return processedMarkdown;
}

// Read WordPress export XML file
const wpXml = process.argv[2] || 'export.xml';
if (!fs.existsSync(wpXml)) {
  console.error('WordPress export XML file not found:', wpXml);
  process.exit(1);
}

const parser = new xml2js.Parser();

fs.readFile(wpXml, async (err, data) => {
  if (err) {
    console.error('Error reading WordPress export file:', err);
    process.exit(1);
  }

  try {
    const result = await promisify(parser.parseString)(data);
    const channel = result.rss.channel[0];
    const items = channel.item;

    for (const item of items) {
      // Get post data
      const title = he.decode(item.title[0]);
      const content = item['content:encoded'] ? item['content:encoded'][0] : '';
      const pubDate = item['wp:post_date'] ? item['wp:post_date'][0] : item.pubDate[0];
      const status = item['wp:status'] ? item['wp:status'][0] : 'publish';
      const postType = item['wp:post_type'] ? item['wp:post_type'][0] : 'post';
      
      // Only process published posts
      if (status !== 'publish' || postType !== 'post') {
        continue;
      }

      // Convert date to YYYY-MM-DD format for filename
      const date = new Date(pubDate);
      const dateStr = date.toISOString().split('T')[0];
      
      // Create clean slug for filename
      const slug = createSlug(title);
      const filename = `${dateStr}-${slug}.md`;

      // Get categories and tags
      const categories = item.category ? item.category
        .filter(cat => cat.$.domain === 'category')
        .map(cat => he.decode(cat._)) : [];
      
      const tags = item.category ? item.category
        .filter(cat => cat.$.domain === 'post_tag')
        .map(cat => he.decode(cat._)) : [];

      // Format all terms
      const allTerms = formatTags(['post', ...categories, ...tags]);

      // Convert content from HTML to Markdown
      let markdown = turndownService.turndown(content);
      
      // Process and download images
      markdown = await processImages(markdown, slug);
      
      // Clean up markdown
      markdown = markdown
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
        .trim();

      // Create frontmatter
      const frontmatter = [
        '---',
        `layout: post.njk`,
        `title: ${escapeYaml(title)}`,
        `date: ${formatDate(pubDate)}`,
        `tags: ${JSON.stringify(allTerms)}`,
        `categories: ${JSON.stringify(formatTags(categories))}`,
        '---',
        '',
        markdown
      ].join('\n');

      // Write the file
      const filepath = path.join(postsDir, filename);
      await writeFile(filepath, frontmatter);
      console.log(`Created ${filename}`);
    }
  } catch (error) {
    console.error('Error processing WordPress export:', error);
    process.exit(1);
  }
}); 