/**
 * Insert or fix local image links in Markdown files based on date-slug.jpg convention.
 * Usage: node insert-date-slug-images.js /path/to/posts/ /path/to/images/
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = process.argv[2] || "./src/posts";
const IMAGES_DIR = process.argv[3] || "./src/assets/images";
const PUBLIC_IMAGE_PATH = "/assets/images/";

function getAllMarkdownFiles(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      getAllMarkdownFiles(full, files);
    } else if (file.endsWith('.md')) {
      files.push(full);
    }
  });
  return files;
}

// Extract date and slug from frontmatter
function extractDateSlug(md) {
  const dateMatch = md.match(/date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/);
  const titleMatch = md.match(/title:\s*["']?([^"\n']+)["']?/);
  let slug;
  if (titleMatch) {
    slug = titleMatch[1]
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }
  return dateMatch && slug ? { date: dateMatch[1], slug } : null;
}

function processMarkdownFile(file, imagesSet) {
  let md = fs.readFileSync(file, "utf8");
  const info = extractDateSlug(md);
  if (!info) return false;

  const { date, slug } = info;
  const imageName = `${date}-${slug}.jpg`;
  if (!imagesSet.has(imageName)) return false;

  const imageMarkdown = `![${slug}](${PUBLIC_IMAGE_PATH}${imageName})`;

  // If the first non-empty line after frontmatter is an empty image, replace it
  const fmEnd = md.indexOf('---', 4); // skip first ---
  if (fmEnd === -1) return false;

  const afterFM = md.slice(fmEnd + 3).trimStart();
  const lines = afterFM.split('\n');
  let changed = false;

  // Replace first empty image or insert at top if none
  for (let i = 0; i < lines.length; i++) {
    if (/^!\[[^\]]*\]\s*$/.test(lines[i])) {
      lines[i] = imageMarkdown;
      changed = true;
      break;
    }
  }
  if (!changed) {
    // Insert after frontmatter
    lines.unshift(imageMarkdown, "");
    changed = true;
  }

  if (changed) {
    const newContent = md.slice(0, fmEnd + 3) + '\n\n' + lines.join('\n');
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Inserted image for: ${file}`);
    return true;
  }
  return false;
}

function main() {
  if (!fs.existsSync(POSTS_DIR) || !fs.existsSync(IMAGES_DIR)) {
    console.error("Check that both posts and images directories exist.");
    process.exit(1);
  }

  const imagesSet = new Set(fs.readdirSync(IMAGES_DIR));
  const files = getAllMarkdownFiles(POSTS_DIR);
  let updated = 0;

  files.forEach(file => {
    if (processMarkdownFile(file, imagesSet)) updated++;
  });

  console.log(`Done. Updated ${updated} file(s).`);
}

main();