/**
 * Search Module
 * Handles geocoding, search, and autocomplete using Nominatim API
 */

const Search = {
    searchTimeout: null,
    currentResults: [],

    /**
     * Initialize search module
     */
    init() {
        this.setupSearchInput();
        this.setupSearchResults();
    },

    /**
     * Setup search input with debouncing
     */
    setupSearchInput() {
        const searchInput = document.getElementById('search-input');
        
        searchInput?.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Clear previous timeout
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            if (query.length < 3) {
                this.hideSearchResults();
                return;
            }

            // Debounce search
            this.searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });

        // Clear results when input is cleared
        searchInput?.addEventListener('blur', () => {
            // Delay to allow click on results
            setTimeout(() => {
                this.hideSearchResults();
            }, 200);
        });

        searchInput?.addEventListener('focus', () => {
            if (this.currentResults.length > 0) {
                this.showSearchResults();
            }
        });
    },

    /**
     * Setup search results interactions
     */
    setupSearchResults() {
        const resultsDiv = document.getElementById('search-results');
        
        resultsDiv?.addEventListener('click', (e) => {
            const item = e.target.closest('.search-result-item');
            if (item) {
                const index = parseInt(item.dataset.index);
                const result = this.currentResults[index];
                this.selectSearchResult(result);
            }
        });
    },

    /**
     * Perform search using Nominatim API
     * @param {string} query - Search query
     */
    async performSearch(query) {
        try {
            // Use user location for biased results if available
            const userLoc = MapModule.userLocation;
            const viewbox = userLoc 
                ? `&viewbox=${userLoc.lng-0.5},${userLoc.lat-0.5},${userLoc.lng+0.5},${userLoc.lat+0.5}&bounded=1`
                : '';

            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1${viewbox}`;

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            
            this.currentResults = data;
            this.displaySearchResults(data);

        } catch (error) {
            console.error('Search error:', error);
            this.hideSearchResults();
        }
    },

    /**
     * Display search results
     * @param {Array} results - Search results from Nominatim
     */
    displaySearchResults(results) {
        const resultsDiv = document.getElementById('search-results');
        if (!resultsDiv) return;

        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="search-result-item">No results found</div>';
            this.showSearchResults();
            return;
        }

        resultsDiv.innerHTML = results.map((result, index) => {
            const name = result.display_name.split(',')[0];
            const address = result.display_name.split(',').slice(1).join(',').trim();

            return `
                <div class="search-result-item" data-index="${index}">
                    <div class="search-result-name">${name}</div>
                    <div class="search-result-address">${address}</div>
                </div>
            `;
        }).join('');

        this.showSearchResults();
    },

    /**
     * Show search results dropdown
     */
    showSearchResults() {
        const resultsDiv = document.getElementById('search-results');
        resultsDiv?.classList.remove('hidden');
    },

    /**
     * Hide search results dropdown
     */
    hideSearchResults() {
        const resultsDiv = document.getElementById('search-results');
        resultsDiv?.classList.add('hidden');
    },

    /**
     * Select a search result
     * @param {Object} result - Selected search result
     */
    selectSearchResult(result) {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const name = result.display_name.split(',')[0];
        const address = result.display_name;

        // Update search input
        document.getElementById('search-input').value = name;

        // Hide results
        this.hideSearchResults();

        // Set destination
        MapModule.setDestination(lat, lon, name);

        // Add to recent searches
        Storage.addRecentSearch({
            name: name,
            lat: lat,
            lng: lon,
            address: address
        });

        // Update recent list
        this.updateRecentList();

        // Center map
        MapModule.map.setView([lat, lon], 15);
    },

    /**
     * Search for nearby places
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} category - Place category
     * @returns {Promise<Array>} Array of nearby places
     */
    async searchNearby(lat, lng, category) {
        try {
            // Map category to Nominatim amenity types
            const amenityMap = {
                restaurant: 'restaurant',
                cafe: 'cafe',
                fuel: 'fuel',
                hospital: 'hospital',
                pharmacy: 'pharmacy',
                bank: 'bank'
            };

            const amenity = amenityMap[category] || category;
            
            // Search radius (approximately 5km)
            const radius = 0.05;

            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${amenity}&limit=10&viewbox=${lng-radius},${lat-radius},${lng+radius},${lat+radius}&bounded=1`;

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Nearby search error:', error);
            return [];
        }
    },

    /**
     * Reverse geocode coordinates to address
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {Promise<string>} Address string
     */
    async reverseGeocode(lat, lng) {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            return data.display_name || 'Unknown location';

        } catch (error) {
            console.error('Reverse geocode error:', error);
            return 'Unknown location';
        }
    },

    /**
     * Update recent searches list in UI
     */
    updateRecentList() {
        const recent = Storage.getRecentSearches();
        UI.updateRecentList(recent);

        // Add click handlers
        document.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                const search = recent.find(r => r.id === id);
                if (search) {
                    MapModule.setDestination(search.lat, search.lng, search.name);
                    MapModule.map.setView([search.lat, search.lng], 15);
                }
            });
        });
    },

    /**
     * Update favorites list in UI
     */
    updateFavoritesList() {
        const favorites = Storage.getFavorites();
        UI.updateFavoritesList(favorites);

        // Add click handlers for favorites
        document.querySelectorAll('.favorite-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            const favorite = favorites.find(f => f.id === id);
            
            // Click to navigate
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-favorite')) {
                    if (favorite) {
                        MapModule.setDestination(favorite.lat, favorite.lng, favorite.name);
                        MapModule.map.setView([favorite.lat, favorite.lng], 15);
                    }
                }
            });
        });

        // Delete favorite buttons
        document.querySelectorAll('.delete-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                Storage.removeFavorite(id);
                this.updateFavoritesList();
                UI.showToast('🗑️ Favorite removed', 'success');
            });
        });
    },

    /**
     * Add current location as favorite
     */
    async addCurrentLocationAsFavorite() {
        const center = MapModule.map.getCenter();
        const lat = center.lat;
        const lng = center.lng;

        // Get address for location
        const address = await this.reverseGeocode(lat, lng);
        const name = address.split(',')[0] || 'Saved Location';

        // Add to favorites
        Storage.addFavorite({
            name: name,
            lat: lat,
            lng: lng,
            address: address
        });

        this.updateFavoritesList();
        UI.showToast('⭐ Added to favorites', 'success');
    },

    /**
     * Clear all recent searches
     */
    clearRecentSearches() {
        Storage.clearRecentSearches();
        this.updateRecentList();
        UI.showToast('🗑️ Recent searches cleared', 'success');
    }
};
