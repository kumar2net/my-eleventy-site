/**
 * Convert WordPress export.xml to Eleventy Markdown files.
 * - Deletes existing posts and images folders at start!
 * - Strips date-slug from image filenames/references.
 * - Downloads first image from each post (if present) as imageN.jpg (no date-slug).
 * - Inserts Markdown image link at top of each post (if image found).
 * 
 * Usage:
 *   node wp-xml-to-eleventy-md-clean.js export.xml src/posts src/assets/images
 * 
 * Prerequisites:
 *   npm install xml2js node-fetch@2
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const fetch = require('node-fetch'); // v2

// Helper
function rimraf(dir_path) {
  if (fs.existsSync(dir_path)) {
    fs.readdirSync(dir_path).forEach(function(entry) {
      const entry_path = path.join(dir_path, entry);
      if (fs.lstatSync(entry_path).isDirectory()) {
        rimraf(entry_path);
      } else {
        fs.unlinkSync(entry_path);
      }
    });
    fs.rmdirSync(dir_path);
  }
}

const [,, xmlPath, postsDir, imagesDir] = process.argv;

if (!xmlPath || !postsDir || !imagesDir) {
  console.error('Usage: node wp-xml-to-eleventy-md-clean.js export.xml postsDir imagesDir');
  process.exit(1);
}

const PUBLIC_IMAGE_PATH = "/assets/images/";

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

function getPermalink(item) {
  let link = (item['link'] && item['link'][0]) || '';
  if (!link) return undefined;
  try {
    const url = new URL(link);
    let pathname = url.pathname.replace(/\/$/, '');
    if (!pathname) pathname = '/';
    return decodeURI(pathname) + '/';
  } catch (e) {
    return undefined;
  }
}

// Download image to the imagesDir, returns the filename or null
async function downloadImage(url, destFile) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.buffer();
    fs.writeFileSync(destFile, buffer);
    return path.basename(destFile);
  } catch (e) {
    return null;
  }
}

function extractFirstImageUrl(html) {
  const match = html && html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function removeImagesFromContent(content) {
  return content.replace(/<img[^>]+>/gi, '');
}

function extractExtension(url) {
  const match = url.match(/\.(jpg|jpeg|png|gif|webp)(?=($|\?|#))/i);
  return match ? match[1].toLowerCase() : "jpg";
}

async function convertItemToMarkdown(item, imageIndex) {
  const title = (item['title'] && item['title'][0]) || 'Untitled';
  const date = (item['wp:post_date'] && item['wp:post_date'][0]) || '';
  const slug =
    (item['wp:post_name'] && item['wp:post_name'][0]) ||
    slugify(title) ||
    'untitled';

  const categories =
    (item['category'] || [])
      .filter((cat) => !cat.$ || cat.$.domain !== 'post_tag')
      .map((cat) =>
        typeof cat === 'string'
          ? cat
          : cat._ || (cat.$ && cat.$.nicename) || ''
      )
      .filter(Boolean);

  const tags =
    (item['category'] || [])
      .filter((cat) => cat.$ && cat.$.domain === 'post_tag')
      .map((cat) => cat._ || cat.$.nicename)
      .filter(Boolean);

  let content =
    (item['content:encoded'] && item['content:encoded'][0]) ||
    (item['description'] && item['description'][0]) ||
    '';

  const permalink = getPermalink(item);

  let frontmatter = {
    layout: "post.njk",
    title: title.replace(/\n/g, ' '),
    date: date,
    ...(permalink && { permalink }),
    tags: tags.length ? tags : undefined,
    categories: categories.length ? categories : undefined,
  };
  Object.keys(frontmatter).forEach(
    (key) => frontmatter[key] === undefined && delete frontmatter[key]
  );

  const yaml =
    '---\n' +
    Object.entries(frontmatter)
      .map(([k, v]) =>
        Array.isArray(v)
          ? `${k}: [${v.map((i) => `"${i}"`).join(', ')}]`
          : `${k}: "${v}"`
      )
      .join('\n') +
    '\n---\n\n';

  // IMAGE HANDLING
  let firstImageUrl = extractFirstImageUrl(content);
  let imageMarkdown = '';
  let imageFilename = '';
  if (firstImageUrl) {
    let ext = extractExtension(firstImageUrl);
    imageFilename = `image${imageIndex}.${ext}`;
    const destFile = path.join(imagesDir, imageFilename);
    await downloadImage(firstImageUrl, destFile); // ignore errors
    imageMarkdown = `![${slug}](${PUBLIC_IMAGE_PATH}${imageFilename})\n\n`;
    // Remove all <img> tags from content
    content = removeImagesFromContent(content);
  }

  // Output filename (slug.md)
  const filename = `${slug}.md`;

  return {
    filename,
    content: yaml + imageMarkdown + content.trim() + '\n',
  };
}

// MAIN
(async function main() {
  // Remove old content
  if (fs.existsSync(postsDir)) rimraf(postsDir);
  if (fs.existsSync(imagesDir)) rimraf(imagesDir);
  fs.mkdirSync(postsDir, { recursive: true });
  fs.mkdirSync(imagesDir, { recursive: true });

  // Read and parse XML
  const xml = fs.readFileSync(xmlPath, 'utf-8');
  const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: true });
  const result = await parser.parseStringPromise(xml);

  const items = result.rss.channel[0].item || [];
  const validTypes = ['post', 'page'];
  const posts = items.filter(
    (item) =>
      item['wp:post_type'] &&
      validTypes.includes(item['wp:post_type'][0]) &&
      item['wp:status'][0] === 'publish'
  );

  let count = 0;
  for (let i = 0; i < posts.length; i++) {
    const md = await convertItemToMarkdown(posts[i], i + 1);
    fs.writeFileSync(path.join(postsDir, md.filename), md.content, 'utf8');
    console.log(`Wrote: ${md.filename}`);
    count++;
  }

  console.log(`Done! Converted ${count} items to ${postsDir} (images in ${imagesDir})`);
})();