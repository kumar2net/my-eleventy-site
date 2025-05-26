module.exports = function(eleventyConfig) {
  // Copy the `images` directory to the output
  eleventyConfig.addPassthroughCopy("src/images");
  
  // Copy the `assets` directory to the output
  eleventyConfig.addPassthroughCopy("src/assets");
  
  // Copy the `css` directory to the output
  eleventyConfig.addPassthroughCopy("src/css");
  
  // Copy the `js` directory to the output
  eleventyConfig.addPassthroughCopy("src/js");
  module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets/images");
  //
};

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts"
    }
  };
};
