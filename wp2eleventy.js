/**
 * Script to convert WordPress export.xml to Eleventy-compatible Markdown/HTML posts.
 * Usage: node wp2eleventy.js export.xml output_dir/
 *
 * Requirements:
 *   - Node.js
 *   - npm install xml2js
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Utility to slugify strings for filenames
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Convert WP date to YYYY-MM-DD
function formatDate(dateStr) {
  // dateStr: e.g. "2007-06-11 11:37:59"
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

// Convert one item to Eleventy frontmatter and content
function convertItemToMarkdown(item) {
  // Get title (may be array or string)
  const title = (item['title'] && item['title'][0]) || 'Untitled';
  const date = (item['wp:post_date'] && item['wp:post_date'][0]) || '';
  const slug =
    (item['wp:post_name'] && item['wp:post_name'][0]) ||
    slugify(title) ||
    'untitled';
  const categories =
    (item['category'] || [])
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

  // Prefer content:encoded, fallback to description
  let content =
    (item['content:encoded'] && item['content:encoded'][0]) ||
    (item['description'] && item['description'][0]) ||
    '';

  // Attachments (images) as frontmatter if present
  let attachment_url =
    (item['wp:attachment_url'] && item['wp:attachment_url'][0]) || null;

  // Compose frontmatter
  let frontmatter = {
    title: title.replace(/\n/g, ' '),
    date: formatDate(date),
    tags: tags.length ? tags : undefined,
    categories: categories.length ? categories : undefined,
    ...(attachment_url && { image: attachment_url }),
  };
  // Remove undefined
  Object.keys(frontmatter).forEach(
    (key) => frontmatter[key] === undefined && delete frontmatter[key]
  );

  // YAML frontmatter as string
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

  return {
    filename: `${formatDate(date)}-${slug}.md`,
    content: yaml + content.trim() + '\n',
  };
}

// Main script
async function main() {
  const [,, xmlPath, outputDir] = process.argv;
  if (!xmlPath || !outputDir) {
    console.error('Usage: node wp2eleventy.js export.xml output_dir/');
    process.exit(1);
  }

  // Read XML
  const xml = fs.readFileSync(xmlPath, 'utf-8');

  // Parse XML
  const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: true });
  const result = await parser.parseStringPromise(xml);

  // WordPress items are in rss.channel[0].item
  const items = result.rss.channel[0].item || [];
  if (!items.length) {
    console.error('No items found in export.xml');
    process.exit(1);
  }

  // Filter for posts/pages/attachments (skip nav_menu, etc.)
  const validTypes = ['post', 'page', 'attachment'];
  const posts = items.filter(
    (item) =>
      item['wp:post_type'] &&
      validTypes.includes(item['wp:post_type'][0]) &&
      (item['wp:status'][0] === 'publish' ||
        item['wp:post_type'][0] === 'attachment')
  );

  // Ensure output dir exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Convert posts
  posts.forEach((item) => {
    const md = convertItemToMarkdown(item);
    fs.writeFileSync(path.join(outputDir, md.filename), md.content, 'utf8');
    console.log(`Converted: ${md.filename}`);
  });

  console.log(`Done! Converted ${posts.length} items to ${outputDir}`);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});