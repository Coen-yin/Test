/**
 * Routing Module
 * Handles route calculation and turn-by-turn directions using OSRM
 */

const Routing = {
    currentRoute: null,
    travelMode: 'driving',

    /**
     * Initialize routing module
     */
    init() {
        this.travelMode = Storage.getTravelMode();
        this.setupTravelModeButtons();
        this.setupDirectionsButton();
    },

    /**
     * Setup travel mode buttons
     */
    setupTravelModeButtons() {
        document.querySelectorAll('.travel-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                document.querySelectorAll('.travel-mode-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                // Update travel mode
                this.travelMode = btn.dataset.mode;
                Storage.setTravelMode(this.travelMode);

                // Recalculate route if exists
                if (this.currentRoute) {
                    this.getRoute(
                        this.currentRoute.start.lat,
                        this.currentRoute.start.lng,
                        this.currentRoute.end.lat,
                        this.currentRoute.end.lng
                    );
                }
            });
        });

        // Set active mode from storage
        document.querySelectorAll('.travel-mode-btn').forEach(btn => {
            if (btn.dataset.mode === this.travelMode) {
                btn.classList.add('active');
            }
        });
    },

    /**
     * Setup directions button
     */
    setupDirectionsButton() {
        document.getElementById('directions-btn')?.addEventListener('click', () => {
            // Show travel mode selector
            document.getElementById('travel-mode-container')?.classList.remove('hidden');
            UI.showToast('📍 Click on the map to set a destination', 'info');
        });
    },

    /**
     * Get route between two points
     * @param {number} startLat - Start latitude
     * @param {number} startLng - Start longitude
     * @param {number} endLat - End latitude
     * @param {number} endLng - End longitude
     */
    async getRoute(startLat, startLng, endLat, endLng) {
        try {
            UI.showToast('🔄 Calculating route...', 'info');

            // Store current route endpoints
            this.currentRoute = {
                start: { lat: startLat, lng: startLng },
                end: { lat: endLat, lng: endLng }
            };

            // Map travel modes to OSRM profiles
            const profiles = {
                driving: 'car',
                walking: 'foot',
                cycling: 'bike'
            };

            const profile = profiles[this.travelMode] || 'car';

            // Use OSRM demo server for routing
            const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&steps=true&geometries=geojson`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                throw new Error('No route found');
            }

            const route = data.routes[0];
            
            // Process and display route
            this.displayRoute(route);

        } catch (error) {
            console.error('Routing error:', error);
            UI.showToast('❌ Failed to calculate route', 'error');
        }
    },

    /**
     * Display route on map
     * @param {Object} route - Route object from OSRM
     */
    displayRoute(route) {
        // Extract coordinates
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        // Draw route on map
        MapModule.drawRoute(coordinates);

        // Calculate distance and duration
        const distance = (route.distance / 1000).toFixed(1); // km
        const duration = Math.ceil(route.duration / 60); // minutes

        // Show route summary
        this.displayRouteSummary(distance, duration);

        // Show turn-by-turn directions
        this.displayTurnByTurn(route.legs[0].steps);

        // Show directions panel
        document.getElementById('directions-panel')?.classList.remove('hidden');

        UI.showToast('✓ Route calculated', 'success');
    },

    /**
     * Display route summary
     * @param {string} distance - Distance in km
     * @param {number} duration - Duration in minutes
     */
    displayRouteSummary(distance, duration) {
        const summaryDiv = document.getElementById('route-summary');
        if (!summaryDiv) return;

        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        const durationText = hours > 0 
            ? `${hours}h ${minutes}min` 
            : `${minutes} min`;

        // Get travel mode icon
        const modeIcons = {
            driving: '🚗',
            walking: '🚶',
            cycling: '🚴'
        };
        const icon = modeIcons[this.travelMode] || '🚗';

        summaryDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <span style="font-size: 2rem;">${icon}</span>
                <div>
                    <div class="route-distance">${distance} km</div>
                    <div class="route-duration">${durationText}</div>
                </div>
            </div>
            <button id="start-navigation-btn" class="action-btn primary-btn" style="width: 100%; margin-top: 1rem;">
                <svg viewBox="0 0 24 24" class="icon">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span>Start Navigation</span>
            </button>
        `;

        // Setup navigation button
        document.getElementById('start-navigation-btn')?.addEventListener('click', () => {
            this.startNavigation();
        });
    },

    /**
     * Display turn-by-turn directions
     * @param {Array} steps - Route steps from OSRM
     */
    displayTurnByTurn(steps) {
        const turnByTurnDiv = document.getElementById('turn-by-turn');
        if (!turnByTurnDiv) return;

        const instructions = steps.map((step, index) => {
            const distance = step.distance < 1000 
                ? `${Math.round(step.distance)} m`
                : `${(step.distance / 1000).toFixed(1)} km`;

            const icon = this.getInstructionIcon(step.maneuver.type);

            return `
                <div class="turn-instruction">
                    <div class="turn-icon">${icon}</div>
                    <div class="turn-text">${step.maneuver.instruction || 'Continue'}</div>
                    <div class="turn-distance">${distance}</div>
                </div>
            `;
        }).join('');

        turnByTurnDiv.innerHTML = instructions;
    },

    /**
     * Get icon for instruction type
     * @param {string} type - Maneuver type
     * @returns {string} Icon SVG
     */
    getInstructionIcon(type) {
        const icons = {
            'turn': '↪️',
            'new name': '➡️',
            'depart': '🚀',
            'arrive': '🏁',
            'merge': '🔀',
            'on ramp': '↗️',
            'off ramp': '↘️',
            'fork': '⑂',
            'end of road': '⊣',
            'continue': '⬆️',
            'roundabout': '⭮',
            'rotary': '⭮',
            'roundabout turn': '⭮'
        };

        return icons[type] || '➡️';
    },

    /**
     * Start navigation mode
     */
    startNavigation() {
        UI.showToast('🧭 Navigation started', 'success');
        
        // In a real app, this would start voice guidance and real-time tracking
        // For now, we'll simulate it
        this.simulateNavigation();
    },

    /**
     * Simulate navigation with voice guidance
     */
    simulateNavigation() {
        // Get first instruction
        const firstInstruction = document.querySelector('.turn-instruction');
        if (!firstInstruction) return;

        const text = firstInstruction.querySelector('.turn-text')?.textContent;
        const distance = firstInstruction.querySelector('.turn-distance')?.textContent;

        // Highlight first instruction
        firstInstruction.style.background = 'var(--primary)';
        firstInstruction.style.color = 'white';

        // Show in bottom sheet for mobile
        if (window.innerWidth < 768) {
            UI.updateBottomSheet(`
                <div style="text-align: center; padding: 1rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">➡️</div>
                    <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">${text}</div>
                    <div style="font-size: 1rem; color: var(--text-secondary);">in ${distance}</div>
                </div>
            `);
            UI.expandBottomSheet();
        }

        // Simulate voice guidance
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`In ${distance}, ${text}`);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }

        UI.showToast(`🗣️ In ${distance}, ${text}`, 'info', 5000);
    },

    /**
     * Clear current route
     */
    clearRoute() {
        this.currentRoute = null;
        MapModule.clearRoute();
        
        // Hide directions panel
        document.getElementById('directions-panel')?.classList.add('hidden');
        document.getElementById('travel-mode-container')?.classList.add('hidden');
    },

    /**
     * Get estimated time of arrival
     * @param {number} durationMinutes - Duration in minutes
     * @returns {string} Formatted ETA
     */
    getETA(durationMinutes) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + durationMinutes);
        
        return now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
};
