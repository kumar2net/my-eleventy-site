// Search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchIndex = null;
    let searchTimeout = null;
    let lastQuery = '';
    let isSearching = false;

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
                // Load index in a separate task to prevent blocking
                setTimeout(() => {
                    searchIndex = elasticlunr.Index.load(data);
                    console.log('Search index loaded successfully');
                    
                    if (searchInput) {
                        searchInput.disabled = false;
                        searchInput.placeholder = 'Search...';
                    }
                }, 0);
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

    // Function to get suggestions with performance optimization
    const getSuggestions = (query) => {
        if (!searchIndex || !query || isSearching) return [];
        
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
            }).filter(Boolean);
        } catch (error) {
            console.error('Error getting suggestions:', error);
            return [];
        }
    };

    // Function to perform search with performance optimization
    const performSearch = (query) => {
        if (!query || isSearching) {
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

        isSearching = true;

        // Use requestAnimationFrame for smooth UI updates
        requestAnimationFrame(() => {
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
                            .filter(Boolean)
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
            } finally {
                isSearching = false;
            }
        });
    };

    // Optimized input handler with improved debounce
    let debounceTimeout;
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        // Show suggestions immediately for short queries
        if (query && query !== lastQuery && query.length <= 3) {
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
                    .filter(Boolean)
                    .join('');
                searchResults.innerHTML = suggestionsHtml || '<p>No suggestions found</p>';
                searchResults.style.display = 'block';
            }
        }

        // Set new timeout for full search with progressive delay
        debounceTimeout = setTimeout(() => {
            if (query.length > 3) {
                performSearch(query);
                lastQuery = query;
            }
        }, query.length <= 3 ? 100 : 300);
    });

    // Optimized event listeners
    searchResults?.addEventListener('click', (e) => {
        const suggestion = e.target.closest('.search-suggestion');
        if (suggestion) {
            const url = suggestion.dataset.url;
            if (url && url !== '#') {
                window.location.href = url;
            }
        }
    });

    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (searchResults) {
                searchResults.style.display = 'none';
            }
        }
    });

    // Optimized click outside handler
    const handleClickOutside = (e) => {
        if (!e.target.closest('.search-container')) {
            if (searchResults) {
                searchResults.style.display = 'none';
            }
        }
    };

    // Use passive event listener for better performance
    document.addEventListener('click', handleClickOutside, { passive: true });
}); 