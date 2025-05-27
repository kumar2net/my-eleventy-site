const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');

const POSTS_DIR = path.join(__dirname, '../src/posts');

function extractDateFromFilename(filename) {
    // Try to extract date from filename pattern YYYY-MM-DD
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-/);
    if (dateMatch) {
        return DateTime.fromISO(dateMatch[1]);
    }
    return null;
}

function standardizeFilename(filename, content) {
    // Extract front matter
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontMatterMatch) return null;

    const frontMatter = frontMatterMatch[1];
    const dateMatch = frontMatter.match(/date:\s*(.+)/);
    const titleMatch = frontMatter.match(/title:\s*(.+)/);

    if (!dateMatch || !titleMatch) return null;

    const date = DateTime.fromISO(dateMatch[1].trim());
    const title = titleMatch[1].trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return `${date.toFormat('yyyy-MM-dd')}-${title}.md`;
}

function processPosts() {
    const files = fs.readdirSync(POSTS_DIR);
    const processedFiles = new Map(); // Map to track processed content

    files.forEach(file => {
        if (!file.endsWith('.md')) return;

        const filePath = path.join(POSTS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const newFilename = standardizeFilename(file, content);

        if (!newFilename) {
            console.log(`Skipping ${file}: Missing required front matter`);
            return;
        }

        const newFilePath = path.join(POSTS_DIR, newFilename);

        // Check for duplicates
        if (processedFiles.has(content)) {
            console.log(`Removing duplicate: ${file}`);
            fs.unlinkSync(filePath);
            return;
        }

        // If file needs to be renamed
        if (file !== newFilename) {
            console.log(`Renaming ${file} to ${newFilename}`);
            fs.renameSync(filePath, newFilePath);
        }

        processedFiles.set(content, newFilename);
    });
}

// Run the script
try {
    processPosts();
    console.log('Post standardization complete!');
} catch (error) {
    console.error('Error processing posts:', error);
}