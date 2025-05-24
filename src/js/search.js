// Search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchIndex = null;

    // Load the search index
    fetch('/search-index.json')
        .then(response => response.json())
        .then(data => {
            searchIndex = elasticlunr.Index.load(data);
            console.log('Search index loaded successfully');
        })
        .catch(error => {
            console.error('Error loading search index:', error);
        });

    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Show/hide results container
        if (!query) {
            searchResults.style.display = 'none';
            return;
        }
        
        if (!searchIndex) {
            searchResults.innerHTML = '<p>Search is initializing...</p>';
            searchResults.style.display = 'block';
            return;
        }

        const results = searchIndex.search(query, {
            fields: {
                title: {boost: 2},
                content: {boost: 1},
                tags: {boost: 1}
            },
            expand: true
        });

        if (results.length > 0) {
            const html = results
                .slice(0, 10)
                .map(result => `
                    <div class="search-result">
                        <a href="${result.ref}">
                            <h3>${result.doc.title}</h3>
                            <p>${result.doc.content.slice(0, 150)}...</p>
                            ${result.doc.tags ? `<div class="search-tags">${result.doc.tags}</div>` : ''}
                        </a>
                    </div>
                `)
                .join('');
            searchResults.innerHTML = html;
        } else {
            searchResults.innerHTML = '<p>No results found</p>';
        }
        
        searchResults.style.display = 'block';
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });
}); 