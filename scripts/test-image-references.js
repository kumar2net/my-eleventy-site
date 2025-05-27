const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const postsDir = path.join(__dirname, '../src/posts');
const imagesDir = path.join(__dirname, '../src/assets/images');

// Regular expression to match image references in markdown
const imageRegex = /!\[.*?\]\((.*?)\)/g;

async function checkImageReferences() {
  try {
    // Get all markdown files
    const files = await readdir(postsDir);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    console.log(`Found ${markdownFiles.length} markdown files to check\n`);
    
    let totalImages = 0;
    let brokenImages = 0;
    let invalidImages = 0;
    
    // Check each markdown file
    for (const file of markdownFiles) {
      const filePath = path.join(postsDir, file);
      const content = await readFile(filePath, 'utf8');
      
      // Find all image references
      const matches = [...content.matchAll(imageRegex)];
      totalImages += matches.length;
      
      if (matches.length > 0) {
        console.log(`\nChecking images in ${file}:`);
        
        for (const match of matches) {
          const imagePath = match[1];
          
          // Skip external URLs
          if (imagePath.startsWith('http')) {
            console.log(`  ⚠️  External image URL: ${imagePath}`);
            continue;
          }
          
          // Get absolute path of the image
          const absoluteImagePath = path.join(__dirname, '..', imagePath);
          
          try {
            // Check if file exists
            const stats = await stat(absoluteImagePath);
            
            // Check if it's a valid image file
            const ext = path.extname(absoluteImagePath).toLowerCase();
            if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
              console.log(`  ❌ Invalid image format: ${imagePath} (${ext})`);
              invalidImages++;
            } else {
              console.log(`  ✅ Valid image: ${imagePath}`);
            }
          } catch (err) {
            console.log(`  ❌ Broken image reference: ${imagePath}`);
            brokenImages++;
          }
        }
      }
    }
    
    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Total markdown files: ${markdownFiles.length}`);
    console.log(`Total image references: ${totalImages}`);
    console.log(`Broken image references: ${brokenImages}`);
    console.log(`Invalid image formats: ${invalidImages}`);
    
  } catch (err) {
    console.error('Error checking image references:', err);
    process.exit(1);
  }
}

// Run the check
checkImageReferences(); 