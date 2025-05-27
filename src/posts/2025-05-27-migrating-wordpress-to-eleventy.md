---
layout: post.njk
title: "Migrating from WordPress to Eleventy: A Journey of Image Handling"
date: 2025-05-27
tags: ["post", "eleventy", "wordpress", "migration", "javascript", "web-development"]
categories: ["web-development"]
---

# Migrating from WordPress to Eleventy: A Journey of Image Handling

Recently, I undertook the task of migrating my WordPress blog to Eleventy (11ty), a simpler and more modern static site generator. While the overall migration process was relatively straightforward, handling images proved to be one of the most challenging aspects. In this post, I'll share my experience and the solutions I developed to make this transition smoother.

## The Challenge

The main challenges I faced during the migration were:

1. Converting WordPress XML export to Eleventy markdown files
2. Downloading and properly handling images from WordPress posts
3. Ensuring correct image paths in the generated markdown files
4. Supporting both HTTP and HTTPS image URLs
5. Maintaining image metadata (alt text, titles)

## The Solution

I developed a Node.js script that handles the entire migration process. Here's how it works:

### 1. Image Processing

The script uses a custom TurndownService rule to handle images:

```javascript
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
```

### 2. Image Downloading

The script includes a robust image downloading function that:
- Supports both HTTP and HTTPS URLs
- Handles redirects
- Validates content types
- Creates unique filenames based on post slugs and image content

```javascript
async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, response => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
          reject(new Error('Redirect location not found'));
          return;
        }
        downloadImage(redirectUrl, filename).then(resolve).catch(reject);
        return;
      }
      // ... handle other response codes and download logic
    });
  });
}
```

### 3. Markdown Processing

After downloading images, the script processes the markdown content to:
- Replace image placeholders with local paths
- Handle failed downloads gracefully
- Maintain proper image references

```javascript
async function processImages(markdown, postSlug) {
  const imageRegex = /!\[(.*?)\]\[(.*?)\]\n\n\[(.*?)\]: (.*?)(?=\n|$)/g;
  const images = [];
  let match;
  let processedMarkdown = markdown;

  // Extract and process images
  while ((match = imageRegex.exec(markdown)) !== null) {
    // ... image processing logic
  }

  return processedMarkdown;
}
```

## Key Improvements

1. **Robust URL Handling**: The script now properly handles both HTTP and HTTPS URLs, making it more versatile for different WordPress setups.

2. **Better Error Handling**: Failed image downloads are handled gracefully, with clear warnings in the markdown output.

3. **Clean File Organization**: Images are stored in a structured way under `src/assets/images/` with meaningful filenames.

4. **Metadata Preservation**: Alt text and titles from WordPress are preserved in the markdown output.

## Results

The migration process has resulted in:
- Clean, well-structured markdown files
- Properly organized local images
- Maintained image metadata
- Better performance due to local image hosting
- Simplified content management

## Lessons Learned

1. Always handle both HTTP and HTTPS URLs in migration scripts
2. Implement proper error handling for failed downloads
3. Use meaningful filenames that include post context
4. Preserve image metadata for better accessibility
5. Test thoroughly with different types of WordPress setups

## Conclusion

Migrating from WordPress to Eleventy has been a rewarding experience. The improved image handling makes the site more maintainable and performant. The script we developed can be adapted for other WordPress to Eleventy migrations, making the process smoother for others undertaking similar migrations.

The complete script and related utilities are available in my [GitHub repository](https://github.com/kumar2net/my-eleventy-site).

## Next Steps

Future improvements could include:
- Support for more image formats
- Better handling of image galleries
- Automated image optimization
- Support for WordPress shortcodes
- Better handling of embedded content

Would you like to try this migration process for your WordPress site? Let me know if you need any help or have questions about the implementation! 