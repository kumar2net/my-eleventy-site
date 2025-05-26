const express = require('express');
const path = require('path');
const RealBlogAgent = require('./real-blog-agent');

const app = express();
const PORT = 3000;

let agent;

// Load blog data before starting the server
async function initAgent() {
    agent = new RealBlogAgent();
    await agent.loadPosts(path.join(__dirname, '../posts'));
}

// API Endpoints
app.get('/api/stats', (req, res) => {
    res.json(agent.getPostStats());
});

app.get('/api/recent', (req, res) => {
    res.json(agent.getRecentPosts(5));
});

app.get('/api/positive', (req, res) => {
    res.json(agent.getMostPositivePosts(5));
});

app.get('/api/category', (req, res) => {
    const category = req.query.cat;
    if (!category) {
        return res.status(400).json({ error: 'Category parameter is required' });
    }
    res.json(agent.findPostsByCategory(category));
});

app.get('/api/similar', (req, res) => {
    const title = req.query.title;
    if (!title) {
        return res.status(400).json({ error: 'Title parameter is required' });
    }
    res.json(agent.findSimilarPosts(title));
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server after agent is ready
initAgent().then(() => {
    app.listen(PORT, () => {
        console.log(`Blog Analytics server running at http://localhost:${PORT}`);
    });
}); 