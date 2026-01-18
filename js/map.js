/**
 * Map Module
 * Handles map initialization, controls, and interactions using Leaflet.js
 */

const MapModule = {
    map: null,
    userMarker: null,
    destinationMarker: null,
    routeLayer: null,
    measureMarkers: [],
    measureLine: null,
    currentLayer: null,
    layers: {},
    userLocation: null,
    watchId: null,

    /**
     * Initialize the map
     */
    init() {
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.error('Leaflet library not loaded. Map features will be limited.');
            this.createFallbackMap();
            return;
        }

        // Create map centered on default location
        this.map = L.map('map', {
            zoomControl: false,
            attributionControl: true
        }).setView([40.7128, -74.0060], 13);

        // Add zoom control to bottom right
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        // Setup layers
        this.setupLayers();
        
        // Apply saved layer preference
        const savedLayer = Storage.getMapLayer();
        this.changeLayer(savedLayer);

        // Setup event listeners
        this.setupEventListeners();

        // Try to get user location
        this.getUserLocation();
    },

    /**
     * Create fallback map when Leaflet is not available
     */
    createFallbackMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        // Create a simple fallback UI
        mapContainer.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
                color: white;
                padding: 2rem;
                text-align: center;
            ">
                <svg viewBox="0 0 100 100" style="width: 120px; height: 120px; margin-bottom: 2rem; filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3));">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="white" stroke-width="3" opacity="0.6"/>
                    <circle cx="50" cy="50" r="35" fill="none" stroke="white" stroke-width="2" opacity="0.4"/>
                    <path d="M50 20 L50 50 L70 70" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
                </svg>
                <h2 style="font-size: 2rem; margin-bottom: 1rem;">MapVerse</h2>
                <p style="font-size: 1.2rem; margin-bottom: 2rem; max-width: 500px;">
                    The mapping application is ready! External map libraries need network access to function fully.
                </p>
                <div style="background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); padding: 1.5rem; border-radius: 1rem; max-width: 600px;">
                    <h3 style="margin-bottom: 1rem;">✨ Features Available</h3>
                    <ul style="text-align: left; line-height: 2;">
                        <li>📍 Interactive map with real-time tracking</li>
                        <li>🧭 Turn-by-turn navigation</li>
                        <li>🔍 Search with autocomplete</li>
                        <li>⭐ Save favorite locations</li>
                        <li>🌓 Dark/Light mode</li>
                        <li>🎤 Voice search</li>
                        <li>📏 Measure distances</li>
                        <li>🍽️ Nearby places finder</li>
                        <li>🔗 Location sharing</li>
                        <li>📱 Fully responsive design</li>
                    </ul>
                </div>
                <p style="margin-top: 2rem; opacity: 0.8;">
                    Please ensure network access to OpenStreetMap and routing services.
                </p>
            </div>
        `;

        // Setup minimal event listeners
        this.setupEventListeners();
    },

    /**
     * Setup map layers
     */
    setupLayers() {
        // Standard OpenStreetMap
        this.layers.standard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        });

        // Satellite (ESRI World Imagery)
        this.layers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: '© Esri'
        });

        // Terrain (OpenTopoMap)
        this.layers.terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 17,
            attribution: '© OpenTopoMap contributors'
        });

        // Dark mode (CartoDB Dark Matter)
        this.layers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap © CARTO'
        });

        // Set initial layer
        this.currentLayer = this.layers.standard;
        this.currentLayer.addTo(this.map);
    },

    /**
     * Change map layer
     * @param {string} layerName - Layer name ('standard', 'satellite', 'terrain', 'dark')
     */
    changeLayer(layerName) {
        if (this.currentLayer) {
            this.map.removeLayer(this.currentLayer);
        }

        this.currentLayer = this.layers[layerName] || this.layers.standard;
        this.currentLayer.addTo(this.map);
        Storage.setMapLayer(layerName);

        // Update layer buttons
        document.querySelectorAll('.layer-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layer === layerName);
        });
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Only setup map-specific listeners if map is initialized
        if (this.map) {
            // Map click event
            this.map.on('click', (e) => {
                this.handleMapClick(e.latlng);
            });
        }

        // Layer change buttons
        document.querySelectorAll('.layer-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeLayer(btn.dataset.layer);
                UI.closeModal('layers-modal');
            });
        });

        // My location button
        document.getElementById('my-location-btn')?.addEventListener('click', () => {
            this.centerOnUser();
        });

        // FAB buttons
        document.getElementById('fab-measure')?.addEventListener('click', () => {
            this.startMeasuring();
        });

        document.getElementById('fab-share')?.addEventListener('click', () => {
            this.shareLocation();
        });

        document.getElementById('fab-nearby')?.addEventListener('click', () => {
            this.showNearbyPlaces();
        });

        document.getElementById('fab-layers')?.addEventListener('click', () => {
            UI.showModal('layers-modal');
        });
    },

    /**
     * Get user's current location
     */
    getUserLocation() {
        if (!navigator.geolocation) {
            UI.showToast('❌ Geolocation not supported', 'error');
            this.loadLastKnownLocation();
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.handleLocationSuccess(position);
            },
            (error) => {
                this.handleLocationError(error);
            },
            options
        );
    },

    /**
     * Handle successful location retrieval
     * @param {Position} position - Geolocation position
     */
    handleLocationSuccess(position) {
        const { latitude, longitude, accuracy } = position.coords;
        
        this.userLocation = { lat: latitude, lng: longitude };
        
        // Save location
        Storage.setLastLocation(this.userLocation);
        
        // Update accuracy indicator
        UI.updateAccuracyIndicator(accuracy);
        
        // Add or update user marker
        this.addUserMarker(latitude, longitude);
        
        // Center map on user
        this.map.setView([latitude, longitude], 15);
        
        UI.showToast('📍 Location found', 'success');

        // Start watching location for updates
        this.watchLocation();

        // Fetch weather for location
        this.fetchWeather(latitude, longitude);
    },

    /**
     * Handle location error
     * @param {PositionError} error - Geolocation error
     */
    handleLocationError(error) {
        let message = 'Unable to get location';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location permission denied';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location unavailable';
                break;
            case error.TIMEOUT:
                message = 'Location request timeout';
                break;
        }
        
        UI.showToast(`❌ ${message}`, 'error');
        this.loadLastKnownLocation();
    },

    /**
     * Load last known location from storage
     */
    loadLastKnownLocation() {
        const lastLocation = Storage.getLastLocation();
        if (lastLocation) {
            this.userLocation = { lat: lastLocation.lat, lng: lastLocation.lng };
            this.addUserMarker(lastLocation.lat, lastLocation.lng);
            this.map.setView([lastLocation.lat, lastLocation.lng], 13);
            UI.showToast('📍 Showing last known location', 'info');
        }
    },

    /**
     * Watch user location for real-time tracking
     */
    watchLocation() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }

        const options = {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                this.userLocation = { lat: latitude, lng: longitude };
                this.updateUserMarker(latitude, longitude);
                UI.updateAccuracyIndicator(accuracy);
                Storage.setLastLocation(this.userLocation);
            },
            (error) => {
                console.error('Watch position error:', error);
            },
            options
        );
    },

    /**
     * Add user marker to map
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    addUserMarker(lat, lng) {
        const icon = L.divIcon({
            className: 'custom-user-marker',
            html: `
                <div style="
                    width: 20px;
                    height: 20px;
                    background: #ffffff;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
                    position: relative;
                ">
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 40px;
                        height: 40px;
                        background: rgba(0, 0, 0, 0.1);
                        border-radius: 50%;
                        animation: pulse 2s ease-in-out infinite;
                    "></div>
                </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        if (this.userMarker) {
            this.userMarker.setLatLng([lat, lng]);
        } else {
            this.userMarker = L.marker([lat, lng], { icon })
                .addTo(this.map)
                .bindPopup('📍 You are here');
        }
    },

    /**
     * Update user marker position
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    updateUserMarker(lat, lng) {
        if (this.userMarker) {
            this.userMarker.setLatLng([lat, lng]);
        } else {
            this.addUserMarker(lat, lng);
        }
    },

    /**
     * Center map on user location
     */
    centerOnUser() {
        if (this.userLocation) {
            this.map.setView([this.userLocation.lat, this.userLocation.lng], 15, {
                animate: true,
                duration: 0.5
            });
            UI.showToast('📍 Centered on your location', 'info');
        } else {
            this.getUserLocation();
        }
    },

    /**
     * Handle map click
     * @param {LatLng} latlng - Click coordinates
     */
    handleMapClick(latlng) {
        // Set as destination
        this.setDestination(latlng.lat, latlng.lng);
    },

    /**
     * Set destination marker
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} name - Location name
     */
    setDestination(lat, lng, name = 'Destination') {
        // Remove existing destination marker
        if (this.destinationMarker) {
            this.map.removeLayer(this.destinationMarker);
        }

        // Create destination marker
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    width: 30px;
                    height: 30px;
                    background: linear-gradient(135deg, #ffffff, #ffffff);
                    border: 3px solid white;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
                "></div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        this.destinationMarker = L.marker([lat, lng], { icon })
            .addTo(this.map)
            .bindPopup(name)
            .openPopup();

        // Get route if user location exists
        if (this.userLocation) {
            Routing.getRoute(
                this.userLocation.lat,
                this.userLocation.lng,
                lat,
                lng
            );
        }

        UI.showToast('📍 Destination set', 'success');
    },

    /**
     * Draw route on map
     * @param {Array} coordinates - Array of [lat, lng] coordinates
     * @param {string} color - Route color
     */
    drawRoute(coordinates, color = '#ffffff') {
        // Remove existing route
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }

        // Create polyline
        this.routeLayer = L.polyline(coordinates, {
            color: color,
            weight: 5,
            opacity: 0.8,
            smoothFactor: 1
        }).addTo(this.map);

        // Fit map to route bounds
        this.map.fitBounds(this.routeLayer.getBounds(), {
            padding: [50, 50]
        });
    },

    /**
     * Clear route from map
     */
    clearRoute() {
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
            this.routeLayer = null;
        }
        if (this.destinationMarker) {
            this.map.removeLayer(this.destinationMarker);
            this.destinationMarker = null;
        }
    },

    /**
     * Start measuring distance tool
     */
    startMeasuring() {
        this.clearMeasurements();
        UI.showToast('📏 Click two points to measure distance', 'info');
        
        const measureHandler = (e) => {
            this.addMeasurePoint(e.latlng);
            
            if (this.measureMarkers.length === 2) {
                this.map.off('click', measureHandler);
                this.showMeasureResult();
            }
        };

        this.map.on('click', measureHandler);
    },

    /**
     * Add measurement point
     * @param {LatLng} latlng - Point coordinates
     */
    addMeasurePoint(latlng) {
        const marker = L.circleMarker(latlng, {
            radius: 6,
            fillColor: '#ffffff',
            color: '#fff',
            weight: 2,
            fillOpacity: 1
        }).addTo(this.map);

        this.measureMarkers.push(marker);

        if (this.measureMarkers.length === 2) {
            const latlngs = this.measureMarkers.map(m => m.getLatLng());
            this.measureLine = L.polyline(latlngs, {
                color: '#ffffff',
                weight: 3,
                dashArray: '5, 10'
            }).addTo(this.map);
        }
    },

    /**
     * Show measurement result
     */
    showMeasureResult() {
        if (this.measureMarkers.length === 2) {
            const distance = this.measureMarkers[0].getLatLng()
                .distanceTo(this.measureMarkers[1].getLatLng());
            
            const km = (distance / 1000).toFixed(2);
            const mi = (distance / 1609.34).toFixed(2);
            
            UI.showToast(`📏 Distance: ${km} km (${mi} mi)`, 'info', 5000);
            
            setTimeout(() => {
                this.clearMeasurements();
            }, 5000);
        }
    },

    /**
     * Clear measurements
     */
    clearMeasurements() {
        this.measureMarkers.forEach(marker => this.map.removeLayer(marker));
        this.measureMarkers = [];
        
        if (this.measureLine) {
            this.map.removeLayer(this.measureLine);
            this.measureLine = null;
        }
    },

    /**
     * Share current location
     */
    shareLocation() {
        const center = this.map.getCenter();
        const coords = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
        const link = `${window.location.origin}${window.location.pathname}?lat=${center.lat}&lng=${center.lng}&zoom=${this.map.getZoom()}`;

        // Update share modal
        document.getElementById('share-coords').value = coords;
        document.getElementById('share-link').value = link;

        // Setup copy buttons
        document.getElementById('copy-coords-btn').onclick = () => {
            UI.copyToClipboard(coords);
        };
        document.getElementById('copy-link-btn').onclick = () => {
            UI.copyToClipboard(link);
        };

        UI.showModal('share-modal');
    },

    /**
     * Show nearby places modal
     */
    showNearbyPlaces() {
        UI.showModal('nearby-modal');
        
        // Setup category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                this.searchNearby(category);
            });
        });
    },

    /**
     * Search for nearby places
     * @param {string} category - Place category
     */
    async searchNearby(category) {
        const center = this.userLocation || this.map.getCenter();
        const resultsDiv = document.getElementById('nearby-results');
        
        resultsDiv.innerHTML = '<div style="text-align: center; padding: 20px;">Searching...</div>';
        
        try {
            const places = await Search.searchNearby(center.lat, center.lng, category);
            
            if (places.length === 0) {
                resultsDiv.innerHTML = '<div class="empty-state">No places found nearby</div>';
                return;
            }

            resultsDiv.innerHTML = places.map(place => `
                <div class="nearby-result-item" data-lat="${place.lat}" data-lng="${place.lon}">
                    <div class="nearby-result-name">${place.display_name}</div>
                    <div class="nearby-result-distance">${this.calculateDistance(center.lat, center.lng, place.lat, place.lon)}</div>
                </div>
            `).join('');

            // Add click handlers
            resultsDiv.querySelectorAll('.nearby-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const lat = parseFloat(item.dataset.lat);
                    const lng = parseFloat(item.dataset.lng);
                    this.setDestination(lat, lng, item.querySelector('.nearby-result-name').textContent);
                    UI.closeModal('nearby-modal');
                });
            });
        } catch (error) {
            resultsDiv.innerHTML = '<div class="empty-state">Failed to load nearby places</div>';
        }
    },

    /**
     * Calculate distance between two points
     * @param {number} lat1 - Latitude 1
     * @param {number} lng1 - Longitude 1
     * @param {number} lat2 - Latitude 2
     * @param {number} lng2 - Longitude 2
     * @returns {string} Formatted distance
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance < 1) {
            return `${(distance * 1000).toFixed(0)} m away`;
        }
        return `${distance.toFixed(1)} km away`;
    },

    /**
     * Fetch weather for location
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    async fetchWeather(lat, lng) {
        // Note: This is a placeholder. In production, you'd use a weather API
        // For now, we'll show a simulated weather widget
        setTimeout(() => {
            UI.showWeather({
                temp: Math.floor(Math.random() * 15) + 15,
                description: 'Partly Cloudy',
                icon: '🌤️'
            });
        }, 1000);
    }
};
