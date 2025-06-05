const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const { DateTime } = require("luxon");
const Image = require("@11ty/eleventy-img");
const readingTime = require('reading-time');
const elasticlunr = require("elasticlunr");
const fs = require("fs");
const path = require("path");

// Image shortcode
async function imageShortcode(src, alt, sizes = "100vw") {
    if (!src) {
        throw new Error(`Missing \`src\` on image`);
    }
    if (!alt) {
        throw new Error(`Missing \`alt\` on image`);
    }

    let metadata = await Image(src, {
        widths: [300, 600, 900],
        formats: ["avif", "jpeg"],
        outputDir: "./_site/img/"
    });

    let imageAttributes = {
        alt,
        sizes,
        loading: "lazy",
        decoding: "async",
    };

    return Image.generateHTML(metadata, imageAttributes);
}

// Instagram shortcode
function instagramShortcode(postId) {
    const shortcodePath = path.join(__dirname, "src/_includes/shortcodes/instagram.njk");
    const shortcodeContent = fs.readFileSync(shortcodePath, 'utf8');
    return shortcodeContent.replace(/{{ postId }}/g, postId);
}

module.exports = function(eleventyConfig) {
    // Plugins
    eleventyConfig.addPlugin(syntaxHighlight);
    eleventyConfig.addPlugin(pluginRss);

    // Pass through copy for assets
    eleventyConfig.addPassthroughCopy("src/assets");
    eleventyConfig.addPassthroughCopy("src/css");
    eleventyConfig.addPassthroughCopy("src/js");

    // Image shortcode
    eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
    eleventyConfig.addLiquidShortcode("image", imageShortcode);
    eleventyConfig.addJavaScriptFunction("image", imageShortcode);

    // Instagram shortcode
    eleventyConfig.addNunjucksShortcode("instagram", instagramShortcode);
    eleventyConfig.addLiquidShortcode("instagram", instagramShortcode);
    eleventyConfig.addJavaScriptFunction("instagram", instagramShortcode);

    // Date filters
    eleventyConfig.addFilter("dateIso", date => {
        return DateTime.fromJSDate(date).toISO();
    });

    eleventyConfig.addFilter("dateReadable", date => {
        return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_FULL);
    });

    // Reading time filter
    eleventyConfig.addFilter("readingTime", text => {
        const stats = readingTime(text);
        return Math.ceil(stats.minutes);
    });

    // Get collection items by tag
    eleventyConfig.addFilter("filterByTag", (posts, tag) => {
        if (!Array.isArray(posts)) return [];
        return posts.filter(post => post.data.tags && post.data.tags.includes(tag));
    });

    // Create a collection of all tags
    eleventyConfig.addCollection("tagList", function(collection) {
        const tagSet = new Set();
        collection.getAll().forEach(item => {
            if (item.data.tags) {
                item.data.tags.forEach(tag => tagSet.add(tag));
            }
        });
        return Array.from(tagSet).sort();
    });

    // Configure posts collection
    eleventyConfig.addCollection("post", function(collection) {
        return collection.getFilteredByTag("post").sort((a, b) => {
            return b.date - a.date;
        });
    });

    // Add currentYear shortcode
    eleventyConfig.addShortcode("currentYear", () => {
        return new Date().getFullYear();
    });

    // Generate search index
    eleventyConfig.addCollection("searchIndex", async function(collection) {
        // Create the index
        const index = elasticlunr(function() {
            this.addField("title");
            this.addField("content");
            this.addField("tags");
            this.addField("description");
            this.addField("excerpt");
            this.setRef("url");
        });

        // Add documents to the index
        for (const page of collection.getAll()) {
            if (page.url && page.template?.inputPath?.endsWith('.md')) {
                try {
                    // Get the raw content of the markdown file
                    const content = await fs.promises.readFile(page.template.inputPath, 'utf8');
                    // Remove front matter and get only the content
                    const contentWithoutFrontMatter = content.replace(/^---[\s\S]*?---\n/, '');
                    
                    // Create excerpt from content (first 200 characters)
                    const excerpt = contentWithoutFrontMatter
                        .replace(/[#*`_]/g, '') // Remove markdown syntax
                        .replace(/\n/g, ' ') // Replace newlines with spaces
                        .trim()
                        .substring(0, 200);

                    const doc = {
                        url: page.url,
                        title: page.data.title || '',
                        content: contentWithoutFrontMatter || '',
                        description: page.data.description || '',
                        tags: page.data.tags ? page.data.tags.join(' ') : '',
                        excerpt: excerpt
                    };

                    // Only add if we have some content to search
                    if (doc.content || doc.title || doc.description) {
                        index.addDoc(doc);
                        console.log(`Added to search index: ${doc.title}`);
                    }
                } catch (error) {
                    console.error(`Error processing ${page.template.inputPath}:`, error);
                }
            }
        }

        // Write the index to a file
        const outputDir = path.join(__dirname, "_site");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Serialize the index to JSON
        const indexJson = JSON.stringify(index.toJSON());
        fs.writeFileSync(path.join(outputDir, "search-index.json"), indexJson);
        console.log('Search index generated successfully');

        return index;
    });

    // Base Config
    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            layouts: "_layouts"
        },
        templateFormats: ["md", "njk", "html"],
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk",
        dataTemplateEngine: "njk"
    };
}; 