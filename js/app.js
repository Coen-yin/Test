/**
 * Main Application Entry Point
 * Initializes and coordinates all modules
 */

// Global application state
const App = {
    initialized: false,
    locationPermissionGranted: false,

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Show loading screen
            UI.showLoading();

            // Initialize UI module
            UI.init();

            // Wait for DOM to be fully loaded
            await this.waitForDOM();

            // Initialize map (will handle missing Leaflet gracefully)
            MapModule.init();

            // Initialize routing
            Routing.init();

            // Initialize search
            Search.init();

            // Setup UI event handlers
            this.setupEventHandlers();

            // Load saved data
            this.loadSavedData();

            // Check for URL parameters (shared location)
            this.checkURLParams();

            // Request location permission (only if Leaflet is available)
            if (typeof L !== 'undefined') {
                this.requestLocationPermission();
            }

            // Hide loading screen
            UI.hideLoading();

            this.initialized = true;

            console.log('✓ MapVerse initialized successfully');

        } catch (error) {
            console.error('Initialization error:', error);
            // Still show the app even if there's an error
            UI.hideLoading();
            UI.showToast('⚠️ Some features may be limited', 'warning');
        }
    },

    /**
     * Wait for DOM to be ready
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    },

    /**
     * Setup UI event handlers
     */
    setupEventHandlers() {
        // Close sidebar button
        document.getElementById('close-sidebar')?.addEventListener('click', () => {
            UI.toggleSidebar();
        });

        // Add favorite button
        document.getElementById('add-favorite-btn')?.addEventListener('click', () => {
            Search.addCurrentLocationAsFavorite();
        });

        // Clear recent searches button
        document.getElementById('clear-recent-btn')?.addEventListener('click', () => {
            if (confirm('Clear all recent searches?')) {
                Search.clearRecentSearches();
            }
        });

        // Settings button
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            UI.showToast('⚙️ Settings coming soon!', 'info');
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            UI.showToast('🌐 Back online', 'success');
        });

        window.addEventListener('offline', () => {
            UI.showToast('📡 You are offline', 'warning');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    },

    /**
     * Load saved data from storage
     */
    loadSavedData() {
        // Load favorites
        Search.updateFavoritesList();

        // Load recent searches
        Search.updateRecentList();

        // Apply saved theme
        const theme = Storage.getTheme();
        UI.applyTheme(theme);
    },

    /**
     * Check URL parameters for shared location
     */
    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const lat = urlParams.get('lat');
        const lng = urlParams.get('lng');
        const zoom = urlParams.get('zoom');

        if (lat && lng) {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            const zoomLevel = zoom ? parseInt(zoom) : 15;

            MapModule.map.setView([latitude, longitude], zoomLevel);
            MapModule.setDestination(latitude, longitude, 'Shared Location');
            UI.showToast('📍 Showing shared location', 'info');
        }
    },

    /**
     * Request location permission
     */
    requestLocationPermission() {
        // Show permission modal
        const permissionModal = document.getElementById('permission-modal');
        
        // Allow button
        document.getElementById('allow-location-btn')?.addEventListener('click', () => {
            UI.closeModal('permission-modal');
            MapModule.getUserLocation();
            this.locationPermissionGranted = true;
        });

        // Deny button
        document.getElementById('deny-location-btn')?.addEventListener('click', () => {
            UI.closeModal('permission-modal');
            MapModule.loadLastKnownLocation();
            UI.showToast('ℹ️ You can enable location later', 'info');
        });

        // Auto-request after 2 seconds
        setTimeout(() => {
            if (!this.locationPermissionGranted) {
                UI.showModal('permission-modal');
            }
        }, 2000);
    },

    /**
     * Handle window resize
     */
    handleResize() {
        // Invalidate map size
        if (MapModule.map) {
            MapModule.map.invalidateSize();
        }

        // Update UI for mobile/desktop
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            // Mobile adjustments
            document.getElementById('sidebar')?.classList.add('collapsed');
        } else {
            // Desktop adjustments
            document.getElementById('sidebar')?.classList.remove('collapsed');
        }
    },

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('search-input')?.focus();
        }

        // Escape: Clear search, close modals
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('search-input');
            if (searchInput === document.activeElement) {
                searchInput.value = '';
                searchInput.blur();
            }
        }

        // Ctrl/Cmd + D: Toggle dark mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            document.getElementById('theme-toggle')?.click();
        }

        // Ctrl/Cmd + L: Center on user location
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            MapModule.centerOnUser();
        }

        // Ctrl/Cmd + S: Add current location to favorites
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            Search.addCurrentLocationAsFavorite();
        }
    },

    /**
     * Handle app visibility change (battery optimization)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // App is in background - reduce location updates
            if (MapModule.watchId) {
                navigator.geolocation.clearWatch(MapModule.watchId);
                MapModule.watchId = null;
            }
        } else {
            // App is in foreground - resume location updates
            if (this.locationPermissionGranted) {
                MapModule.watchLocation();
            }
        }
    },

    /**
     * Register service worker for offline support
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    },

    /**
     * Show install prompt (PWA)
     */
    setupPWA() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;

            // Show install button
            UI.showToast('📱 Install MapVerse for better experience', 'info', 5000);

            // Handle install
            setTimeout(() => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('PWA installed');
                        }
                        deferredPrompt = null;
                    });
                }
            }, 5000);
        });
    }
};

// Initialize app when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    App.init();
}

// Handle visibility change for battery optimization
document.addEventListener('visibilitychange', () => {
    App.handleVisibilityChange();
});

// Register service worker (optional - for offline support)
// Uncomment when sw.js is created
// App.registerServiceWorker();

// Setup PWA install prompt
App.setupPWA();

// Expose App to window for debugging
window.MapVerseApp = App;
