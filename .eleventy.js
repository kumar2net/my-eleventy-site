module.exports = function(eleventyConfig) {
    // Pass through copy for assets
    eleventyConfig.addPassthroughCopy("src/assets");
    eleventyConfig.addPassthroughCopy("src/css");

    // Date filters
    eleventyConfig.addFilter("dateIso", date => {
        return date.toISOString();
    });

    eleventyConfig.addFilter("dateReadable", date => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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