const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

class RealBlogAgent {
    constructor() {
        this.context = {
            posts: [],
            categories: new Set(),
            tags: new Set(),
            lastAction: null,
            currentUser: null
        };
        
        // Initialize sentiment analysis data
        this.sentimentData = {
            positive: new Set(['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'enjoy', 'beautiful', 'perfect']),
            negative: new Set(['bad', 'poor', 'terrible', 'awful', 'difficult', 'hard', 'problem', 'issue', 'wrong', 'failed']),
            neutral: new Set(['and', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with'])
        };
    }

    // Load and parse blog posts
    async loadPosts(postsDir) {
        const files = fs.readdirSync(postsDir);
        
        for (const file of files) {
            if (file.endsWith('.md')) {
                const filePath = path.join(postsDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const { data: frontmatter, content: postContent } = matter(content);
                
                const post = {
                    title: frontmatter.title,
                    date: frontmatter.date,
                    categories: frontmatter.categories || [],
                    content: postContent,
                    permalink: frontmatter.permalink,
                    file: file
                };
                
                this.context.posts.push(post);
                
                // Update categories and tags
                post.categories.forEach(cat => this.context.categories.add(cat));
            }
        }
        
        console.log(`Loaded ${this.context.posts.length} posts`);
    }

    // Calculate reading time in minutes
    calculateReadingTime(content) {
        const wordsPerMinute = 200; // Average reading speed
        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / wordsPerMinute);
        return readingTime;
    }

    // Perform sentiment analysis
    analyzeSentiment(content) {
        const words = content.toLowerCase().split(/\s+/);
        let positiveCount = 0;
        let negativeCount = 0;
        let neutralCount = 0;

        words.forEach(word => {
            if (this.sentimentData.positive.has(word)) positiveCount++;
            else if (this.sentimentData.negative.has(word)) negativeCount++;
            else if (this.sentimentData.neutral.has(word)) neutralCount++;
        });

        const total = positiveCount + negativeCount + neutralCount;
        const sentiment = {
            positive: (positiveCount / total) * 100,
            negative: (negativeCount / total) * 100,
            neutral: (neutralCount / total) * 100,
            score: ((positiveCount - negativeCount) / total) * 100
        };

        return sentiment;
    }

    // Analyze blog post content
    analyzePost(post) {
        const wordCount = post.content.split(/\s+/).length;
        const imageCount = (post.content.match(/!\[.*?\]/g) || []).length;
        const readingTime = this.calculateReadingTime(post.content);
        const sentiment = this.analyzeSentiment(post.content);
        
        return {
            title: post.title,
            categories: post.categories,
            wordCount,
            imageCount,
            readingTime,
            sentiment,
            date: post.date,
            permalink: post.permalink
        };
    }

    // Find posts by category
    findPostsByCategory(category) {
        return this.context.posts.filter(post => 
            post.categories.includes(category)
        ).map(post => ({
            title: post.title,
            date: post.date,
            permalink: post.permalink,
            readingTime: this.calculateReadingTime(post.content)
        }));
    }

    // Find similar posts
    findSimilarPosts(title) {
        const targetPost = this.context.posts.find(p => p.title === title);
        if (!targetPost) return null;

        return this.context.posts
            .filter(p => p.title !== title && 
                p.categories.some(cat => targetPost.categories.includes(cat)))
            .map(p => ({
                title: p.title,
                categories: p.categories,
                date: p.date,
                permalink: p.permalink,
                readingTime: this.calculateReadingTime(p.content)
            }));
    }

    // Get post statistics
    getPostStats() {
        const stats = {
            totalPosts: this.context.posts.length,
            totalCategories: this.context.categories.size,
            postsByCategory: {},
            averageWordCount: 0,
            totalImages: 0,
            averageReadingTime: 0,
            sentimentAnalysis: {
                averagePositive: 0,
                averageNegative: 0,
                averageNeutral: 0,
                averageScore: 0
            }
        };

        let totalWords = 0;
        let totalImages = 0;
        let totalReadingTime = 0;
        let totalPositive = 0;
        let totalNegative = 0;
        let totalNeutral = 0;
        let totalScore = 0;

        this.context.posts.forEach(post => {
            // Count posts by category
            post.categories.forEach(cat => {
                stats.postsByCategory[cat] = (stats.postsByCategory[cat] || 0) + 1;
            });

            // Count words and images
            const wordCount = post.content.split(/\s+/).length;
            const imageCount = (post.content.match(/!\[.*?\]/g) || []).length;
            const readingTime = this.calculateReadingTime(post.content);
            const sentiment = this.analyzeSentiment(post.content);

            totalWords += wordCount;
            totalImages += imageCount;
            totalReadingTime += readingTime;
            totalPositive += sentiment.positive;
            totalNegative += sentiment.negative;
            totalNeutral += sentiment.neutral;
            totalScore += sentiment.score;
        });

        stats.averageWordCount = Math.round(totalWords / stats.totalPosts);
        stats.totalImages = totalImages;
        stats.averageReadingTime = Math.round(totalReadingTime / stats.totalPosts);
        stats.sentimentAnalysis = {
            averagePositive: Math.round(totalPositive / stats.totalPosts),
            averageNegative: Math.round(totalNegative / stats.totalPosts),
            averageNeutral: Math.round(totalNeutral / stats.totalPosts),
            averageScore: Math.round(totalScore / stats.totalPosts)
        };

        return stats;
    }

    // Get recent posts
    getRecentPosts(limit = 5) {
        return this.context.posts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit)
            .map(post => ({
                title: post.title,
                date: post.date,
                categories: post.categories,
                permalink: post.permalink,
                readingTime: this.calculateReadingTime(post.content),
                sentiment: this.analyzeSentiment(post.content)
            }));
    }

    // Get most positive posts
    getMostPositivePosts(limit = 5) {
        return this.context.posts
            .map(post => ({
                ...post,
                sentiment: this.analyzeSentiment(post.content)
            }))
            .sort((a, b) => b.sentiment.score - a.sentiment.score)
            .slice(0, limit)
            .map(post => ({
                title: post.title,
                date: post.date,
                permalink: post.permalink,
                sentiment: post.sentiment
            }));
    }
}

// Export the class
module.exports = RealBlogAgent;

// Example usage
async function main() {
    const agent = new RealBlogAgent();
    
    // Load posts from your blog
    await agent.loadPosts(path.join(__dirname, '../posts'));
    
    console.log('\n=== Blog Analysis ===');
    
    // Get post statistics
    const stats = agent.getPostStats();
    console.log('\nBlog Statistics:');
    console.log(JSON.stringify(stats, null, 2));
    
    // Get recent posts with reading time and sentiment
    console.log('\nRecent Posts with Analysis:');
    const recentPosts = agent.getRecentPosts(3);
    console.log(JSON.stringify(recentPosts, null, 2));
    
    // Get most positive posts
    console.log('\nMost Positive Posts:');
    const positivePosts = agent.getMostPositivePosts(3);
    console.log(JSON.stringify(positivePosts, null, 2));
    
    // Find posts by category with reading time
    console.log('\nPosts in Sports Category with Reading Time:');
    const sportsPosts = agent.findPostsByCategory('sports');
    console.log(JSON.stringify(sportsPosts, null, 2));
    
    // Find similar posts with reading time
    console.log('\nSimilar Posts to "Tennis Morning at NSS" with Reading Time:');
    const similarPosts = agent.findSimilarPosts('Tennis Morning at NSS');
    console.log(JSON.stringify(similarPosts, null, 2));
}

main().catch(console.error); 