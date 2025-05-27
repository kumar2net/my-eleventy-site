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

function generateTitleFromFilename(filename) {
    // Remove date prefix and .md extension
    const title = filename
        .replace(/^\d{4}-\d{2}-\d{2}-/, '')
        .replace(/\.md$/, '')
        // Replace hyphens with spaces and capitalize words
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        // Fix common abbreviations
        .replace(/\bAmp\b/g, '&')
        .replace(/\bS\b/g, "'s");
    
    return title;
}

function fixFrontMatter(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);
    
    // Check if file already has front matter
    if (content.startsWith('---')) {
        console.log(`Skipping ${filename}: Already has front matter`);
        return;
    }

    const date = extractDateFromFilename(filename);
    if (!date) {
        console.log(`Skipping ${filename}: Could not extract date`);
        return;
    }

    const title = generateTitleFromFilename(filename);
    
    // Create new front matter
    const frontMatter = `---
layout: post.njk
title: ${title}
date: ${date.toISO()}
tags: post
---

`;
    
    // Write updated content
    fs.writeFileSync(filePath, frontMatter + content);
    console.log(`Fixed front matter for ${filename}`);
}

function processPosts() {
    const files = fs.readdirSync(POSTS_DIR);
    
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        
        const filePath = path.join(POSTS_DIR, file);
        fixFrontMatter(filePath);
    });
}

// Run the script
try {
    processPosts();
    console.log('Front matter fix complete!');
} catch (error) {
    console.error('Error processing posts:', error);
} 