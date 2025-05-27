/**
 * Recursively updates all image URLs in Markdown files to point to local /assets/images/ folder
 * Only rewrites URLs if the local image exists.
 *
 * Usage: node fix-all-markdown-images.js content_dir/ src/assets/images/
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = process.argv[2] || "_posts";
const LOCAL_IMAGES_DIR = process.argv[3] || "src/assets/images";
const PUBLIC_IMAGE_PATH = "/assets/images/";

function getAllFiles(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      getAllFiles(full, files);
    } else if (file.endsWith('.md')) {
      files.push(full);
    }
  });
  return files;
}

// Make a Set of all local image filenames (case-insensitive)
function getLocalImageFiles(dir) {
  const files = fs.readdirSync(dir);
  return new Set(files.map(f => f.toLowerCase()));
}

// Replace image URLs in markdown and html if local file exists
function fixImageLinks(markdown, localImagesSet) {
  // Markdown: ![alt](url)
  markdown = markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    const filename = url.split('/').pop();
    if (localImagesSet.has(filename.toLowerCase())) {
      console.log(`MATCH: ${filename}`);
      return `![${alt}](${PUBLIC_IMAGE_PATH}${filename})`;
    } else {
      console.log(`NO MATCH: ${filename}`);
    }
    return match;
  });
  // HTML: <img ... src="url" ...>
  markdown = markdown.replace(/<img([^>]+)src=['"]([^'"]+)['"]/gi, (match, before, url) => {
    const filename = url.split('/').pop();
    if (localImagesSet.has(filename.toLowerCase())) {
      console.log(`MATCH: ${filename}`);
      return `<img${before}src="${PUBLIC_IMAGE_PATH}${filename}"`;
    } else {
      console.log(`NO MATCH: ${filename}`);
    }
    return match;
  });
  return markdown;
}
}

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content directory "${CONTENT_DIR}" does not exist.`);
    process.exit(1);
  }
  if (!fs.existsSync(LOCAL_IMAGES_DIR)) {
    console.error(`Local images directory "${LOCAL_IMAGES_DIR}" does not exist.`);
    process.exit(1);
  }

  const files = getAllFiles(CONTENT_DIR);
  const localImagesSet = getLocalImageFiles(LOCAL_IMAGES_DIR);

  let changedCount = 0;

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const newContent = fixImageLinks(content, localImagesSet);
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated: ${file}`);
      changedCount++;
    }
  });

  console.log(`Done. Updated image links in ${changedCount} file(s).`);
}

main();
