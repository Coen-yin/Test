/**
 * UI Module
 * Handles all UI interactions, animations, and visual feedback
 */

const UI = {
    /**
     * Initialize UI components
     */
    init() {
        this.setupThemeToggle();
        this.setupModals();
        this.setupFAB();
        this.setupBottomSheet();
        this.setupVoiceSearch();
    },

    /**
     * Show loading screen
     */
    showLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    },

    /**
     * Hide loading screen
     */
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }
            if (app) {
                app.classList.remove('hidden');
            }
        }, 1000);
    },

    /**
     * Setup theme toggle
     */
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const theme = Storage.getTheme();
        
        // Apply saved theme
        this.applyTheme(theme);
        
        themeToggle?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(newTheme);
            Storage.setTheme(newTheme);
            this.showToast(`${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`, 'info');
        });
    },

    /**
     * Apply theme
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        const lightIcon = document.querySelector('.theme-icon-light');
        const darkIcon = document.querySelector('.theme-icon-dark');
        
        if (theme === 'dark') {
            lightIcon?.classList.add('hidden');
            darkIcon?.classList.remove('hidden');
        } else {
            lightIcon?.classList.remove('hidden');
            darkIcon?.classList.add('hidden');
        }
    },

    /**
     * Setup modal interactions
     */
    setupModals() {
        // Close modal when clicking backdrop or close button
        document.querySelectorAll('.modal').forEach(modal => {
            const backdrop = modal.querySelector('.modal-backdrop');
            const closeBtn = modal.querySelector('.modal-close');
            
            backdrop?.addEventListener('click', () => this.closeModal(modal.id));
            closeBtn?.addEventListener('click', () => this.closeModal(modal.id));
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });
    },

    /**
     * Show modal
     * @param {string} modalId - Modal element ID
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Close modal
     * @param {string} modalId - Modal element ID
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    /**
     * Setup Floating Action Button
     */
    setupFAB() {
        const fabMain = document.getElementById('fab-main');
        const fabMenu = document.getElementById('fab-menu');

        fabMain?.addEventListener('click', () => {
            fabMain.classList.toggle('active');
            fabMenu?.classList.toggle('hidden');
        });

        // Close FAB menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.fab-container')) {
                fabMain?.classList.remove('active');
                fabMenu?.classList.add('hidden');
            }
        });
    },

    /**
     * Setup bottom sheet for mobile
     */
    setupBottomSheet() {
        const bottomSheet = document.getElementById('bottom-sheet');
        const handle = bottomSheet?.querySelector('.bottom-sheet-handle');
        
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        handle?.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
        });

        handle?.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 0) {
                bottomSheet.style.transform = `translateY(calc(100% - 60px + ${diff}px))`;
            }
        });

        handle?.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            
            const diff = currentY - startY;
            if (diff > 100) {
                this.collapseBottomSheet();
            } else if (diff < -50) {
                this.expandBottomSheet();
            } else {
                bottomSheet.style.transform = '';
            }
        });

        handle?.addEventListener('click', () => {
            if (bottomSheet?.classList.contains('expanded')) {
                this.collapseBottomSheet();
            } else {
                this.expandBottomSheet();
            }
        });
    },

    /**
     * Expand bottom sheet
     */
    expandBottomSheet() {
        const bottomSheet = document.getElementById('bottom-sheet');
        if (bottomSheet) {
            bottomSheet.classList.add('expanded');
            bottomSheet.style.transform = '';
        }
    },

    /**
     * Collapse bottom sheet
     */
    collapseBottomSheet() {
        const bottomSheet = document.getElementById('bottom-sheet');
        if (bottomSheet) {
            bottomSheet.classList.remove('expanded');
            bottomSheet.style.transform = '';
        }
    },

    /**
     * Update bottom sheet content
     * @param {string} html - HTML content
     */
    updateBottomSheet(html) {
        const body = document.getElementById('bottom-sheet-body');
        if (body) {
            body.innerHTML = html;
        }
    },

    /**
     * Setup voice search
     */
    setupVoiceSearch() {
        const voiceBtn = document.getElementById('voice-search-btn');
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            voiceBtn?.classList.add('hidden');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        voiceBtn?.addEventListener('click', () => {
            recognition.start();
            voiceBtn.classList.add('listening');
            this.showToast('🎤 Listening...', 'info');
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = transcript;
                // Trigger search
                const inputEvent = new Event('input', { bubbles: true });
                searchInput.dispatchEvent(inputEvent);
            }
            voiceBtn?.classList.remove('listening');
        };

        recognition.onerror = () => {
            voiceBtn?.classList.remove('listening');
            this.showToast('❌ Voice search failed', 'error');
        };

        recognition.onend = () => {
            voiceBtn?.classList.remove('listening');
        };
    },

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type ('success', 'error', 'info', 'warning')
     * @param {number} duration - Duration in milliseconds
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Show/hide sidebar
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar?.classList.toggle('show');
    },

    /**
     * Update favorites list in UI
     * @param {Array} favorites - Array of favorite locations
     */
    updateFavoritesList(favorites) {
        const list = document.getElementById('favorites-list');
        if (!list) return;

        if (favorites.length === 0) {
            list.innerHTML = '<div class="empty-state">No saved places yet</div>';
            return;
        }

        list.innerHTML = favorites.map(fav => `
            <div class="favorite-item" data-id="${fav.id}">
                <svg viewBox="0 0 24 24" class="favorite-icon">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
                </svg>
                <div class="favorite-info">
                    <div class="favorite-name">${fav.name}</div>
                    <div class="favorite-address">${fav.address || 'No address'}</div>
                </div>
                <div class="favorite-actions">
                    <button class="favorite-action-btn delete-favorite" data-id="${fav.id}" aria-label="Delete favorite">
                        <svg viewBox="0 0 24 24" class="icon">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Update recent searches list in UI
     * @param {Array} recent - Array of recent searches
     */
    updateRecentList(recent) {
        const list = document.getElementById('recent-list');
        if (!list) return;

        if (recent.length === 0) {
            list.innerHTML = '<div class="empty-state">No recent searches</div>';
            return;
        }

        list.innerHTML = recent.map(item => `
            <div class="recent-item" data-id="${item.id}">
                <svg viewBox="0 0 24 24" class="recent-icon">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <div class="recent-info">
                    <div class="recent-name">${item.name}</div>
                    <div class="recent-address">${item.address || 'No address'}</div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Update accuracy indicator
     * @param {number} accuracy - Accuracy in meters
     */
    updateAccuracyIndicator(accuracy) {
        const indicator = document.getElementById('accuracy-indicator');
        const text = document.getElementById('accuracy-text');
        
        if (!indicator || !text) return;

        indicator.classList.remove('hidden');
        
        if (accuracy < 20) {
            text.textContent = 'High accuracy';
        } else if (accuracy < 100) {
            text.textContent = 'Medium accuracy';
        } else {
            text.textContent = 'Low accuracy';
        }
    },

    /**
     * Show weather widget
     * @param {Object} weather - Weather data
     */
    showWeather(weather) {
        const widget = document.getElementById('weather-widget');
        if (!widget) return;

        widget.classList.remove('hidden');
        widget.querySelector('.weather-icon').textContent = weather.icon || '🌤️';
        widget.querySelector('.weather-temp').textContent = `${weather.temp}°C`;
        widget.querySelector('.weather-desc').textContent = weather.description || 'Clear';
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('✓ Copied to clipboard', 'success');
            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showToast('❌ Failed to copy', 'error');
            return false;
        }
    },

    /**
     * Show loading state on button
     * @param {HTMLElement} button - Button element
     * @param {boolean} loading - Loading state
     */
    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span style="display: inline-block; animation: rotate 1s linear infinite;">⟳</span>';
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }
};
