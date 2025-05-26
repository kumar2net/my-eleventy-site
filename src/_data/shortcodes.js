const fs = require('fs');
const path = require('path');

module.exports = {
  instagram: function(postId) {
    const shortcodePath = path.join(__dirname, '../_includes/shortcodes/instagram.njk');
    const shortcodeContent = fs.readFileSync(shortcodePath, 'utf8');
    return shortcodeContent.replace(/{{ postId }}/g, postId);
  }
}; 