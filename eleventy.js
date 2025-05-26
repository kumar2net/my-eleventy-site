module.exports = function(eleventyConfig) {
  // Copy the `images` directory to the output
  eleventyConfig.addPassthroughCopy("src/images");
  
  // Copy the `css` directory to the output
  eleventyConfig.addPassthroughCopy("src/css");
  
  // Copy the `js` directory to the output
  eleventyConfig.addPassthroughCopy("src/js");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts"
    }
  };
};