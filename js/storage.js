/**
 * Storage Module
 * Handles all localStorage operations for the mapping application
 */

const Storage = {
    /**
     * Storage keys
     */
    KEYS: {
        FAVORITES: 'mapverse_favorites',
        RECENT: 'mapverse_recent_searches',
        THEME: 'mapverse_theme',
        LAST_LOCATION: 'mapverse_last_location',
        MAP_LAYER: 'mapverse_map_layer',
        TRAVEL_MODE: 'mapverse_travel_mode'
    },

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Stored value or default value
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },

    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },

    /**
     * Clear all app data from localStorage
     * @returns {boolean} Success status
     */
    clear() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },

    /**
     * Get all favorites
     * @returns {Array} Array of favorite locations
     */
    getFavorites() {
        return this.get(this.KEYS.FAVORITES, []);
    },

    /**
     * Add a favorite location
     * @param {Object} location - Location object {name, lat, lng, address}
     * @returns {boolean} Success status
     */
    addFavorite(location) {
        const favorites = this.getFavorites();
        const favorite = {
            id: Date.now(),
            name: location.name,
            lat: location.lat,
            lng: location.lng,
            address: location.address || '',
            createdAt: new Date().toISOString()
        };
        favorites.unshift(favorite);
        return this.set(this.KEYS.FAVORITES, favorites);
    },

    /**
     * Remove a favorite by id
     * @param {number} id - Favorite id
     * @returns {boolean} Success status
     */
    removeFavorite(id) {
        const favorites = this.getFavorites();
        const updated = favorites.filter(fav => fav.id !== id);
        return this.set(this.KEYS.FAVORITES, updated);
    },

    /**
     * Get recent searches
     * @param {number} limit - Maximum number of recent searches
     * @returns {Array} Array of recent searches
     */
    getRecentSearches(limit = 10) {
        const recent = this.get(this.KEYS.RECENT, []);
        return recent.slice(0, limit);
    },

    /**
     * Add to recent searches
     * @param {Object} search - Search object {name, lat, lng, address}
     * @returns {boolean} Success status
     */
    addRecentSearch(search) {
        let recent = this.getRecentSearches(50);
        
        // Remove duplicate if exists
        recent = recent.filter(item => 
            !(item.lat === search.lat && item.lng === search.lng)
        );
        
        const recentItem = {
            id: Date.now(),
            name: search.name,
            lat: search.lat,
            lng: search.lng,
            address: search.address || '',
            timestamp: new Date().toISOString()
        };
        
        recent.unshift(recentItem);
        return this.set(this.KEYS.RECENT, recent.slice(0, 50));
    },

    /**
     * Clear recent searches
     * @returns {boolean} Success status
     */
    clearRecentSearches() {
        return this.set(this.KEYS.RECENT, []);
    },

    /**
     * Get theme preference
     * @returns {string} Theme ('light' or 'dark')
     */
    getTheme() {
        return this.get(this.KEYS.THEME, 'light');
    },

    /**
     * Set theme preference
     * @param {string} theme - Theme ('light' or 'dark')
     * @returns {boolean} Success status
     */
    setTheme(theme) {
        return this.set(this.KEYS.THEME, theme);
    },

    /**
     * Get last known location
     * @returns {Object|null} Location object or null
     */
    getLastLocation() {
        return this.get(this.KEYS.LAST_LOCATION);
    },

    /**
     * Set last known location
     * @param {Object} location - Location object {lat, lng}
     * @returns {boolean} Success status
     */
    setLastLocation(location) {
        const data = {
            lat: location.lat,
            lng: location.lng,
            timestamp: new Date().toISOString()
        };
        return this.set(this.KEYS.LAST_LOCATION, data);
    },

    /**
     * Get map layer preference
     * @returns {string} Layer type
     */
    getMapLayer() {
        return this.get(this.KEYS.MAP_LAYER, 'standard');
    },

    /**
     * Set map layer preference
     * @param {string} layer - Layer type
     * @returns {boolean} Success status
     */
    setMapLayer(layer) {
        return this.set(this.KEYS.MAP_LAYER, layer);
    },

    /**
     * Get travel mode preference
     * @returns {string} Travel mode
     */
    getTravelMode() {
        return this.get(this.KEYS.TRAVEL_MODE, 'driving');
    },

    /**
     * Set travel mode preference
     * @param {string} mode - Travel mode
     * @returns {boolean} Success status
     */
    setTravelMode(mode) {
        return this.set(this.KEYS.TRAVEL_MODE, mode);
    }
};
