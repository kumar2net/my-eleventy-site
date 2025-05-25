// Search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchIndex = null;
    let searchTimeout = null;
    let lastQuery = '';

    // Load the search index
    fetch('/search-index.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid search index data');
            }
            try {
                searchIndex = elasticlunr.Index.load(data);
                console.log('Search index loaded successfully:', searchIndex);
                
                // Enable search input once index is loaded
                if (searchInput) {
                    searchInput.disabled = false;
                    searchInput.placeholder = 'Search...';
                }
            } catch (error) {
                console.error('Error loading search index:', error);
                throw error;
            }
        })
        .catch(error => {
            console.error('Error loading search index:', error);
            if (searchInput) {
                searchInput.placeholder = 'Search unavailable';
                searchInput.disabled = true;
            }
            if (searchResults) {
                searchResults.innerHTML = '<p>Search is currently unavailable</p>';
            }
        });

    // Function to get suggestions
    const getSuggestions = (query) => {
        if (!searchIndex || !query) return [];
        
        try {
            const results = searchIndex.search(query, {
                fields: {
                    title: {boost: 3},
                    description: {boost: 2},
                    content: {boost: 1},
                    tags: {boost: 2},
                    excerpt: {boost: 1.5}
                },
                expand: true
            });

            return results.slice(0, 5).map(result => {
                if (!result || !result.doc) return null;
                return {
                    title: result.doc.title || 'Untitled',
                    url: result.ref || '#',
                    description: result.doc.description || result.doc.excerpt || ''
                };
            }).filter(Boolean); // Remove null results
        } catch (error) {
            console.error('Error getting suggestions:', error);
            return [];
        }
    };

    // Function to perform search
    const performSearch = (query) => {
        if (!query) {
            if (searchResults) {
                searchResults.style.display = 'none';
            }
            return;
        }

        if (!searchIndex) {
            if (searchResults) {
                searchResults.innerHTML = '<p>Search is initializing...</p>';
                searchResults.style.display = 'block';
            }
            return;
        }

        try {
            const results = searchIndex.search(query, {
                fields: {
                    title: {boost: 3},
                    description: {boost: 2},
                    content: {boost: 1},
                    tags: {boost: 2},
                    excerpt: {boost: 1.5}
                },
                expand: true
            });

            if (searchResults) {
                if (results && results.length > 0) {
                    const html = results
                        .slice(0, 10)
                        .map(result => {
                            if (!result || !result.doc) return null;
                            
                            const title = result.doc.title || 'Untitled';
                            const description = result.doc.description || result.doc.excerpt || '';
                            const tags = result.doc.tags || '';
                            const url = result.ref || '#';
                            
                            return `
                                <div class="search-result">
                                    <a href="${url}">
                                        <h3>${title}</h3>
                                        ${description ? `<p class="search-description">${description}</p>` : ''}
                                        ${tags ? `<div class="search-tags">${tags}</div>` : ''}
                                    </a>
                                </div>
                            `;
                        })
                        .filter(Boolean) // Remove null results
                        .join('');
                    
                    searchResults.innerHTML = html || '<p>No results found</p>';
                } else {
                    searchResults.innerHTML = '<p>No results found</p>';
                }
                searchResults.style.display = 'block';
            }
        } catch (error) {
            console.error('Error performing search:', error);
            if (searchResults) {
                searchResults.innerHTML = `
                    <div class="search-error">
                        <p>An error occurred while searching. Please try again.</p>
                        <p class="error-details">${error.message}</p>
                    </div>
                `;
                searchResults.style.display = 'block';
            }
        }
    };

    // Handle input with debounce and autocomplete
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Show suggestions immediately
        if (query && query !== lastQuery) {
            const suggestions = getSuggestions(query);
            if (suggestions.length > 0 && searchResults) {
                const suggestionsHtml = suggestions
                    .map(suggestion => {
                        if (!suggestion) return null;
                        return `
                            <div class="search-suggestion" data-url="${suggestion.url}">
                                <div class="suggestion-title">${suggestion.title}</div>
                                ${suggestion.description ? `<div class="suggestion-description">${suggestion.description}</div>` : ''}
                            </div>
                        `;
                    })
                    .filter(Boolean) // Remove null results
                    .join('');
                searchResults.innerHTML = suggestionsHtml || '<p>No suggestions found</p>';
                searchResults.style.display = 'block';
            }
        }

        // Set new timeout for full search
        searchTimeout = setTimeout(() => {
            performSearch(query);
            lastQuery = query;
        }, 300); // 300ms debounce
    });

    // Handle suggestion clicks
    searchResults?.addEventListener('click', (e) => {
        const suggestion = e.target.closest('.search-suggestion');
        if (suggestion) {
            const url = suggestion.dataset.url;
            if (url && url !== '#') {
                window.location.href = url;
            }
        }
    });

    // Handle keyboard navigation
    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (searchResults) {
                searchResults.style.display = 'none';
            }
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            if (searchResults) {
                searchResults.style.display = 'none';
            }
        }
    });
}); 