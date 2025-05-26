const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to generate alt text from filename
function generateAltText(filename) {
    // Remove file extension and hash
    const name = filename.replace(/\.[^/.]+$/, '').replace(/-\w+$/, '');
    // Convert kebab-case to Title Case with spaces
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Function to fix image references in markdown content
function fixImageReferences(content) {
    // Fix image references with extra spaces and line breaks
    let fixed = content.replace(
        /!\[\s*\]\s*\(\s*([^)]+?)\s*\)/g,
        (match, imagePath) => {
            // Clean up the image path
            const cleanPath = imagePath
                .replace(/\s+/g, '')  // Remove all spaces
                .replace(/\n/g, '')   // Remove newlines
                .replace(/\.\s+([a-z]+)$/i, '.$1'); // Fix spaces before extension

            // Generate alt text from the filename
            const filename = path.basename(cleanPath);
            const altText = generateAltText(filename);

            return `![${altText}](${cleanPath})`;
        }
    );

    // Add proper spacing around images
    fixed = fixed.replace(/([^\n])\n*!\[/g, '$1\n\n![');
    fixed = fixed.replace(/\]\([^)]+\)\n*([^\n])/g, ']\n\n$1');

    return fixed;
}

// Main function to process all markdown files
async function processMarkdownFiles() {
    const postsDir = path.join(__dirname, '../src/posts');
    
    // Get all markdown files
    const files = glob.sync('*.md', { cwd: postsDir });
    
    console.log(`Found ${files.length} markdown files to process`);
    
    for (const file of files) {
        const filePath = path.join(postsDir, file);
        console.log(`Processing ${file}...`);
        
        try {
            // Read file content
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Fix image references
            const fixedContent = fixImageReferences(content);
            
            // Write back to file if changes were made
            if (content !== fixedContent) {
                fs.writeFileSync(filePath, fixedContent);
                console.log(`✓ Fixed image references in ${file}`);
            } else {
                console.log(`- No changes needed in ${file}`);
            }
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }
    
    console.log('\nDone!');
}

// Run the script
processMarkdownFiles().catch(console.error); 