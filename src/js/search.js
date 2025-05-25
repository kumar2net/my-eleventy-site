// Search functionality
console.log('Search script loaded');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    
    // Check if elasticlunr is available
    if (typeof elasticlunr === 'undefined') {
        console.error('elasticlunr is not loaded!');
        return;
    }
    console.log('elasticlunr is available');

    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchIndex = null;

    if (!searchInput || !searchResults) {
        console.error('Search elements not found:', {
            searchInput: !!searchInput,
            searchResults: !!searchResults
        });
        return;
    }
    console.log('Search elements found');

    // Load search index
    console.log('Fetching search index...');
    fetch('/search-index.json')
        .then(response => {
            console.log('Search index response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Search index data received:', data);
            if (!data) {
                throw new Error('Invalid search index data');
            }
            searchIndex = elasticlunr.Index.load(data);
            console.log('Search index loaded successfully');
            
            if (searchInput) {
                searchInput.disabled = false;
                searchInput.placeholder = 'Search...';
            }
        })
        .catch(error => {
            console.error('Error loading search index:', error);
            searchResults.innerHTML = '<div class="search-error">Error loading search index</div>';
        });

    // Handle search input
    searchInput.addEventListener('input', (e) => {
        console.log('Search input event:', e.target.value);
        const query = e.target.value.trim();
        
        if (!query) {
            console.log('Empty query, clearing results');
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            return;
        }

        if (!searchIndex) {
            console.log('Search index not loaded yet');
            return;
        }

        console.log('Performing search for:', query);
        const results = searchIndex.search(query, {
            fields: {
                title: {boost: 2},
                content: {boost: 1},
                tags: {boost: 1.5},
                description: {boost: 1}
            }
        });

        console.log('Search results:', results);

        if (results.length === 0) {
            console.log('No results found');
            searchResults.innerHTML = '<div class="no-results">No results found</div>';
        } else {
            console.log('Displaying results');
            searchResults.innerHTML = results
                .map(result => {
                    const doc = searchIndex.documentStore.getDoc(result.ref);
                    return `
                        <a href="${doc.url}" class="search-result">
                            <h3>${doc.title}</h3>
                            ${doc.description ? `<p>${doc.description}</p>` : ''}
                        </a>
                    `;
                })
                .join('');
        }

        searchResults.style.display = 'block';
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            console.log('Clicking outside, hiding results');
            searchResults.style.display = 'none';
        }
    });
}); 