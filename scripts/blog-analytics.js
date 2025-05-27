const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const Sentiment = require('sentiment');

// Configuration
const POSTS_DIR = path.join(__dirname, '../src/posts');
const OUTPUT_FILE = path.join(__dirname, '../src/assets/analytics/blog-analytics.txt');
const JSON_OUTPUT_FILE = path.join(__dirname, '../src/assets/analytics/blog-analytics.json');

// Initialize sentiment analyzer
const sentiment = new Sentiment();

// Statistics object
const stats = {
    totalPosts: 0,
    postsByYear: {},
    postsByMonth: {},
    postsByCategory: {},
    totalWords: 0,
    averageWordsPerPost: 0,
    longestPost: { title: '', wordCount: 0 },
    shortestPost: { title: '', wordCount: Infinity },
    categories: new Set(),
    tags: new Set(),
    sentimentAnalysis: {
        averageScore: 0,
        mostPositive: { title: '', score: -Infinity },
        mostNegative: { title: '', score: Infinity },
        postsBySentiment: {
            positive: 0,
            neutral: 0,
            negative: 0
        }
    }
};

// Helper function to count words in markdown content
function countWords(content) {
    // Remove frontmatter, code blocks, and HTML tags
    const cleanContent = content
        .replace(/---[\s\S]*?---/, '') // Remove frontmatter
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert markdown links to just text
        .replace(/[#*_~`]/g, ''); // Remove markdown syntax

    // Split by whitespace and filter out empty strings
    return cleanContent.split(/\s+/).filter(word => word.length > 0).length;
}

// Process all markdown files in the posts directory
function analyzePosts() {
    const files = fs.readdirSync(POSTS_DIR);
    let totalSentimentScore = 0;
    
    files.forEach(file => {
        if (file.endsWith('.md')) {
            const filePath = path.join(POSTS_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const { data, content: markdownContent } = matter(content);
            
            // Update basic stats
            stats.totalPosts++;
            
            // Process date
            if (data.date) {
                const date = new Date(data.date);
                const year = date.getFullYear();
                const month = date.toLocaleString('default', { month: 'long' });
                
                stats.postsByYear[year] = (stats.postsByYear[year] || 0) + 1;
                stats.postsByMonth[month] = (stats.postsByMonth[month] || 0) + 1;
            }
            
            // Process categories
            if (data.categories) {
                data.categories.forEach(category => {
                    stats.categories.add(category);
                    stats.postsByCategory[category] = (stats.postsByCategory[category] || 0) + 1;
                });
            }
            
            // Process tags
            if (data.tags) {
                data.tags.forEach(tag => stats.tags.add(tag));
            }
            
            // Process word count
            const wordCount = countWords(markdownContent);
            stats.totalWords += wordCount;
            
            // Update longest/shortest post
            if (wordCount > stats.longestPost.wordCount) {
                stats.longestPost = { title: data.title, wordCount };
            }
            if (wordCount < stats.shortestPost.wordCount) {
                stats.shortestPost = { title: data.title, wordCount };
            }

            // Analyze sentiment
            const sentimentResult = sentiment.analyze(markdownContent);
            totalSentimentScore += sentimentResult.score;

            // Update most positive/negative posts
            if (sentimentResult.score > stats.sentimentAnalysis.mostPositive.score) {
                stats.sentimentAnalysis.mostPositive = {
                    title: data.title,
                    score: sentimentResult.score
                };
            }
            if (sentimentResult.score < stats.sentimentAnalysis.mostNegative.score) {
                stats.sentimentAnalysis.mostNegative = {
                    title: data.title,
                    score: sentimentResult.score
                };
            }

            // Categorize post by sentiment
            if (sentimentResult.score > 0) {
                stats.sentimentAnalysis.postsBySentiment.positive++;
            } else if (sentimentResult.score < 0) {
                stats.sentimentAnalysis.postsBySentiment.negative++;
            } else {
                stats.sentimentAnalysis.postsBySentiment.neutral++;
            }
        }
    });
    
    // Calculate average words per post
    stats.averageWordsPerPost = Math.round(stats.totalWords / stats.totalPosts);
    
    // Calculate average sentiment score
    stats.sentimentAnalysis.averageScore = Math.round(totalSentimentScore / stats.totalPosts);
}

// Generate report
function generateReport() {
    let report = 'Blog Analytics Report\n';
    report += '===================\n\n';
    
    report += `Total Posts: ${stats.totalPosts}\n`;
    report += `Total Words: ${stats.totalWords}\n`;
    report += `Average Words per Post: ${stats.averageWordsPerPost}\n\n`;
    
    report += 'Longest Post:\n';
    report += `- ${stats.longestPost.title} (${stats.longestPost.wordCount} words)\n\n`;
    
    report += 'Shortest Post:\n';
    report += `- ${stats.shortestPost.title} (${stats.shortestPost.wordCount} words)\n\n`;
    
    report += 'Sentiment Analysis:\n';
    report += `- Average Sentiment Score: ${stats.sentimentAnalysis.averageScore}\n`;
    report += `- Most Positive Post: ${stats.sentimentAnalysis.mostPositive.title} (Score: ${stats.sentimentAnalysis.mostPositive.score})\n`;
    report += `- Most Negative Post: ${stats.sentimentAnalysis.mostNegative.title} (Score: ${stats.sentimentAnalysis.mostNegative.score})\n`;
    report += `- Posts by Sentiment:\n`;
    report += `  * Positive: ${stats.sentimentAnalysis.postsBySentiment.positive}\n`;
    report += `  * Neutral: ${stats.sentimentAnalysis.postsBySentiment.neutral}\n`;
    report += `  * Negative: ${stats.sentimentAnalysis.postsBySentiment.negative}\n\n`;
    
    report += 'Posts by Year:\n';
    Object.entries(stats.postsByYear)
        .sort(([a], [b]) => b - a)
        .forEach(([year, count]) => {
            report += `- ${year}: ${count} posts\n`;
        });
    report += '\n';
    
    report += 'Posts by Month:\n';
    Object.entries(stats.postsByMonth)
        .sort(([a], [b]) => {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
            return months.indexOf(a) - months.indexOf(b);
        })
        .forEach(([month, count]) => {
            report += `- ${month}: ${count} posts\n`;
        });
    report += '\n';
    
    report += 'Posts by Category:\n';
    Object.entries(stats.postsByCategory)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
            report += `- ${category}: ${count} posts\n`;
        });
    report += '\n';
    
    report += 'Categories:\n';
    Array.from(stats.categories).sort().forEach(category => {
        report += `- ${category}\n`;
    });
    report += '\n';
    
    report += 'Tags:\n';
    Array.from(stats.tags).sort().forEach(tag => {
        report += `- ${tag}\n`;
    });
    
    // Also generate JSON data for visualization
    const jsonData = {
        totalPosts: stats.totalPosts,
        totalWords: stats.totalWords,
        averageWordsPerPost: stats.averageWordsPerPost,
        longestPost: stats.longestPost,
        shortestPost: stats.shortestPost,
        sentimentAnalysis: stats.sentimentAnalysis,
        postsByYear: Object.entries(stats.postsByYear)
            .sort(([a], [b]) => b - a)
            .reduce((acc, [year, count]) => {
                acc[year] = count;
                return acc;
            }, {}),
        postsByMonth: Object.entries(stats.postsByMonth)
            .sort(([a], [b]) => {
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
                return months.indexOf(a) - months.indexOf(b);
            })
            .reduce((acc, [month, count]) => {
                acc[month] = count;
                return acc;
            }, {}),
        postsByCategory: Object.entries(stats.postsByCategory)
            .sort(([,a], [,b]) => b - a)
            .reduce((acc, [category, count]) => {
                acc[category] = count;
                return acc;
            }, {}),
        categories: Array.from(stats.categories).sort(),
        tags: Array.from(stats.tags).sort()
    };
    
    fs.writeFileSync(JSON_OUTPUT_FILE, JSON.stringify(jsonData, null, 2));
    
    return report;
}

// Main execution
try {
    analyzePosts();
    const report = generateReport();
    fs.writeFileSync(OUTPUT_FILE, report);
    console.log(`Analytics report generated successfully at: ${OUTPUT_FILE}`);
} catch (error) {
    console.error('Error generating analytics:', error);
} 