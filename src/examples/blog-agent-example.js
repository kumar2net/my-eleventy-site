// Blog Management Agent Example
class BlogAgent {
    constructor() {
        this.context = {
            posts: [],
            categories: new Set(),
            tags: new Set(),
            lastAction: null,
            currentUser: null
        };
    }

    // Understanding and maintaining context
    updateContext(newInfo) {
        this.context = { ...this.context, ...newInfo };
        console.log('Context updated:', this.context);
    }

    // Analyze blog post content
    analyzePost(post) {
        const categories = this.extractCategories(post);
        const tags = this.extractTags(post);
        const wordCount = post.content.split(/\s+/).length;
        
        return {
            title: post.title,
            categories,
            tags,
            wordCount,
            date: post.date
        };
    }

    // Extract categories from post content
    extractCategories(post) {
        // Simple category detection based on content
        const categories = [];
        if (post.content.toLowerCase().includes('tennis')) categories.push('sports');
        if (post.content.toLowerCase().includes('technology')) categories.push('tech');
        if (post.content.toLowerCase().includes('food')) categories.push('food');
        return categories;
    }

    // Extract tags from post content
    extractTags(post) {
        const commonTags = ['sports', 'tennis', 'technology', 'food', 'travel', 'personal'];
        return commonTags.filter(tag => 
            post.content.toLowerCase().includes(tag)
        );
    }

    // Planning and decision making
    planAction(userRequest) {
        const action = this.analyzeRequest(userRequest);
        this.context.lastAction = action;
        return action;
    }

    // Understanding user requests
    analyzeRequest(request) {
        if (request.includes('analyze post')) {
            return 'ANALYZE_POST';
        } else if (request.includes('suggest tags')) {
            return 'SUGGEST_TAGS';
        } else if (request.includes('find similar')) {
            return 'FIND_SIMILAR';
        } else if (request.includes('summarize')) {
            return 'SUMMARIZE';
        }
        return 'UNKNOWN';
    }

    // Executing actions
    executeAction(action, params = {}) {
        switch (action) {
            case 'ANALYZE_POST':
                const analysis = this.analyzePost(params.post);
                this.context.posts.push(analysis);
                return `Analyzed post: ${analysis.title}\nCategories: ${analysis.categories.join(', ')}\nTags: ${analysis.tags.join(', ')}\nWord count: ${analysis.wordCount}`;
            
            case 'SUGGEST_TAGS':
                const post = this.context.posts.find(p => p.title === params.title);
                if (post) {
                    return `Suggested tags for ${post.title}: ${post.tags.join(', ')}`;
                }
                return 'Post not found';
            
            case 'FIND_SIMILAR':
                const targetPost = this.context.posts.find(p => p.title === params.title);
                if (targetPost) {
                    const similarPosts = this.context.posts.filter(p => 
                        p.title !== targetPost.title &&
                        p.categories.some(cat => targetPost.categories.includes(cat))
                    );
                    return `Similar posts to ${targetPost.title}:\n${similarPosts.map(p => p.title).join('\n')}`;
                }
                return 'Post not found';
            
            case 'SUMMARIZE':
                const postToSummarize = this.context.posts.find(p => p.title === params.title);
                if (postToSummarize) {
                    return `Summary of ${postToSummarize.title}:\nCategories: ${postToSummarize.categories.join(', ')}\nWord count: ${postToSummarize.wordCount}`;
                }
                return 'Post not found';
            
            default:
                return 'Unknown action';
        }
    }
}

// Example usage with real blog posts
const agent = new BlogAgent();

// Simulating blog post analysis
console.log('=== Starting Blog Management Agent Example ===');

// Add some sample blog posts
const samplePosts = [
    {
        title: 'Tennis Morning at NSS',
        content: 'Early morning tennis session at NSS. Great weather and good company.',
        date: '2024-03-15'
    },
    {
        title: 'My Experiment with ChatGPT',
        content: 'Exploring the capabilities of ChatGPT for technology and personal use.',
        date: '2024-03-10'
    }
];

// Analyze posts
console.log('\nAnalyzing posts...');
samplePosts.forEach(post => {
    const action = agent.planAction('analyze post');
    console.log(agent.executeAction(action, { post }));
});

// Find similar posts
console.log('\nFinding similar posts...');
const action1 = agent.planAction('find similar');
console.log(agent.executeAction(action1, { title: 'Tennis Morning at NSS' }));

// Suggest tags
console.log('\nSuggesting tags...');
const action2 = agent.planAction('suggest tags');
console.log(agent.executeAction(action2, { title: 'My Experiment with ChatGPT' }));

// Get post summary
console.log('\nGetting post summary...');
const action3 = agent.planAction('summarize');
console.log(agent.executeAction(action3, { title: 'Tennis Morning at NSS' }));

// Check final state
console.log('\n=== Final Context ===');
console.log(agent.context); 