const path = require('path');
const RealBlogAgent = require('./real-blog-agent');

async function testBlogAgent() {
    const agent = new RealBlogAgent();
    
    // Load all posts
    await agent.loadPosts(path.join(__dirname, '../posts'));
    
    console.log('\n=== Testing Blog Agent ===\n');
    
    // Test 1: Analyze a specific post in detail
    console.log('Test 1: Detailed Post Analysis');
    console.log('------------------------------');
    const post = agent.context.posts.find(p => p.title === 'Tennis Morning at NSS');
    if (post) {
        const analysis = agent.analyzePost(post);
        console.log('Title:', analysis.title);
        console.log('Categories:', analysis.categories.join(', '));
        console.log('Word Count:', analysis.wordCount);
        console.log('Reading Time:', analysis.readingTime, 'minutes');
        console.log('Sentiment:', analysis.sentiment);
        console.log('Image Count:', analysis.imageCount);
    }
    
    // Test 2: Find posts by multiple categories
    console.log('\nTest 2: Posts by Multiple Categories');
    console.log('----------------------------------');
    const categories = ['tennis', 'fitness'];
    categories.forEach(category => {
        console.log(`\nPosts in ${category} category:`);
        const posts = agent.findPostsByCategory(category);
        posts.forEach(post => {
            console.log(`- ${post.title} (${post.readingTime} min read)`);
        });
    });
    
    // Test 3: Find most engaging posts (based on word count and sentiment)
    console.log('\nTest 3: Most Engaging Posts');
    console.log('-------------------------');
    const engagingPosts = agent.context.posts
        .map(post => ({
            ...post,
            analysis: agent.analyzePost(post)
        }))
        .sort((a, b) => {
            const scoreA = a.analysis.wordCount * (1 + a.analysis.sentiment.score / 100);
            const scoreB = b.analysis.wordCount * (1 + b.analysis.sentiment.score / 100);
            return scoreB - scoreA;
        })
        .slice(0, 5);
    
    engagingPosts.forEach(post => {
        console.log(`\n${post.title}`);
        console.log(`Word Count: ${post.analysis.wordCount}`);
        console.log(`Reading Time: ${post.analysis.readingTime} minutes`);
        console.log(`Sentiment Score: ${post.analysis.sentiment.score.toFixed(2)}`);
    });
    
    // Test 4: Content relationship analysis
    console.log('\nTest 4: Content Relationships');
    console.log('---------------------------');
    const targetPost = 'Tennis Morning at NSS';
    const similarPosts = agent.findSimilarPosts(targetPost);
    console.log(`\nPosts similar to "${targetPost}":`);
    similarPosts.forEach(post => {
        console.log(`\n- ${post.title}`);
        console.log(`  Categories: ${post.categories.join(', ')}`);
        console.log(`  Reading Time: ${post.readingTime} minutes`);
    });
}

// Run the tests
testBlogAgent().catch(console.error); 