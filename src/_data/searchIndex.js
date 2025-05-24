const elasticlunr = require('elasticlunr');
const fs = require('fs');
const path = require('path');

module.exports = async function(eleventyConfig) {
    // Create the elastic lunr index
    const index = elasticlunr(function() {
        this.addField('title');
        this.addField('content');
        this.addField('tags');
        this.setRef('url');
    });

    // Get the posts collection
    const posts = eleventyConfig.collections?.posts || [];

    // Add each post to the index
    for (const post of posts) {
        const doc = {
            url: post.url,
            title: post.data?.title || '',
            content: post.template?.frontMatter?.content?.replace(/<[^>]+>/g, '') || '',
            tags: post.data?.tags ? post.data.tags.join(' ') : '',
            excerpt: post.data?.description || (post.template?.frontMatter?.content?.slice(0, 150).replace(/<[^>]+>/g, '') + '...') || ''
        };
        index.addDoc(doc);
    }

    // Write the index to a file that will be available to the client
    const outputFile = path.join(__dirname, '../../_site/search-index.json');
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(index));

    return {};
}; 