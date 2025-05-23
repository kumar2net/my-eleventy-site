const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const postsDir = path.join(__dirname, '../src/posts');

// Function to clean up markdown content
function cleanupMarkdown(content) {
  // Split content into frontmatter and markdown
  const parts = content.split(/^---\n/m);
  if (parts.length < 3) return content;

  const frontmatter = parts[1].trim();
  let markdown = parts.slice(2).join('---\n').trim();

  // Clean up frontmatter
  const cleanFrontmatter = frontmatter
    .split('\n')
    .map(line => {
      if (line.includes('tags:') || line.includes('categories:')) {
        // Ensure proper JSON array formatting
        const [key, value] = line.split(':').map(s => s.trim());
        try {
          const array = JSON.parse(value);
          return `${key}: ${JSON.stringify(array)}`;
        } catch (e) {
          return line;
        }
      }
      return line;
    })
    .join('\n');

  // Clean up markdown content
  markdown = markdown
    // Fix URLs with spaces and dots
    .replace(/https?:\/\/([^\s]+)/g, (match) => {
      return match.replace(/\s+|\.\s+/g, '');
    })
    
    // Fix broken reference-style image links
    .replace(/\[([^\]]+)\]:\s*([^\s]+)(?:\s+"([^"]+)")?\s*\)/g, '[$1]: $2 "$3"')
    
    // Remove empty links
    .replace(/\[([^\]]*)\]\(\s*\)/g, '$1')
    
    // Fix multiple consecutive blank lines
    .replace(/\n{3,}/g, '\n\n')
    
    // Fix spacing around headers
    .replace(/\n(#{1,6})\s*([^\n]+)/g, '\n\n$1 $2\n')
    
    // Fix spacing around blockquotes
    .replace(/>\s*\*Note:[^*]+\*/g, match => match.trim())
    .replace(/\n(>[^\n]+)/g, '\n\n$1\n\n')
    
    // Fix broken numbered lists
    .replace(/(\d+)\.\s+([^\n]+)/g, '$1. $2\n')
    
    // Fix broken unordered lists
    .replace(/^\s*[-*]\s+/gm, '- ')
    
    // Fix spacing around code blocks
    .replace(/\n(```[\s\S]+?```)/g, '\n\n$1\n\n')
    
    // Fix broken bold/italic formatting
    .replace(/\*\*\s*([^*]+?)\s*\*\*/g, '**$1**')
    .replace(/\*\s*([^*]+?)\s*\*/g, '*$1*')
    .replace(/\*\*\*\s*([^*]+?)\s*\*\*\*/g, '***$1***')
    
    // Fix spacing around images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '\n\n![$1]($2)\n\n')
    
    // Fix broken reference links
    .replace(/\[([^\]]+)\]\[([^\]]+)\](?:\s*\n*\s*\[([^\]]+)\]:\s*([^\s]+)(?:\s+"([^"]+)")?)?/g, 
      (match, text, id, refId, url, title) => {
        if (url) {
          return title ? `[${text}](${url} "${title}")` : `[${text}](${url})`;
        }
        return match;
      }
    )
    
    // Fix image removal notes
    .replace(/\[>\s*\*Note:[^*]+\*/g, match => {
      return match
        .replace(/\[>\s*/, '> ')
        .replace(/\s+/g, ' ')
        .trim();
    })
    
    // Fix spacing after periods
    .replace(/\.(\w)/g, '. $1')
    
    // Fix spacing around parentheses
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)\s*/g, ') ')
    
    // Fix spacing around commas
    .replace(/\s*,\s*/g, ', ')
    
    // Fix spacing around colons
    .replace(/\s*:\s*/g, ': ')
    
    // Fix list formatting
    .replace(/^(\d+)\.\s*/gm, '$1. ')
    .replace(/^[-*]\s*/gm, '- ')
    
    // Fix assumptions list
    .replace(/Assumptions:\s*(\d+)\./g, '\n\n**Assumptions**\n\n1.')
    
    // Fix network setup list
    .replace(/Network Setup:\s*(\d+)\./g, '\n\n**Network Setup**\n\n1.')
    
    // Fix router configuration list
    .replace(/Configure the Wireless Router as follows:\s*([a-z])\./g, '\n\n**Configure the Wireless Router as follows**\n\na.')
    
    // Fix broken lists
    .replace(/(\d+)\.\s*([^\n]+?)(?=\s*\d+\.|$)/g, '$1. $2\n')
    .replace(/([a-z])\.\s*([^\n]+?)(?=\s*[a-z]\.|$)/g, '$1. $2\n')
    
    // Fix broken bold/italic at start of line
    .replace(/^[-*]\s*\*\*([^*]+)\*\*/gm, '- **$1**')
    
    // Remove trailing spaces
    .replace(/[ \t]+$/gm, '')
    
    // Fix extra spaces
    .replace(/ +/g, ' ')
    
    // Fix spacing between sections
    .replace(/\n\n\n+/g, '\n\n')
    
    // Ensure proper spacing between sections
    .split('\n\n')
    .filter(section => section.trim())
    .join('\n\n')
    
    // Ensure single newline at end of file
    .replace(/\n*$/, '\n');

  // Reconstruct the file content
  return `---\n${cleanFrontmatter}\n---\n\n${markdown}`;
}

// Main function to process all posts
async function cleanupPosts() {
  try {
    const files = await readdir(postsDir);
    let processedCount = 0;
    let changedCount = 0;
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(postsDir, file);
      const content = await readFile(filePath, 'utf8');
      
      // Clean up the content
      const cleanedContent = cleanupMarkdown(content);
      processedCount++;

      // Save if changes were made
      if (cleanedContent !== content) {
        await writeFile(filePath, cleanedContent);
        console.log(`Updated ${file}`);
        changedCount++;
      }
    }

    console.log('\nSummary:');
    console.log(`Total files processed: ${processedCount}`);
    console.log(`Files updated: ${changedCount}`);
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

// Run the script
cleanupPosts().then(() => {
  console.log('\nDone cleaning up markdown files.');
}); 