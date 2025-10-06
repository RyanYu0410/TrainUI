// NYC MTA Subway Display - Theme Switching and Interactive Features

class MTADisplay {
    constructor() {
        this.currentTheme = 'dark';
        this.currentChroma = 'brand';
        this.init();
    }

    init() {
        this.setupThemeControls();
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupThemeControls() {
        // Get current theme from HTML data attributes
        const body = document.body;
        this.currentTheme = body.getAttribute('data-theme') || 'dark';
        this.currentChroma = body.getAttribute('data-chroma') || 'brand';
        
        // Update toggle button states
        this.updateToggleButtons();
    }

    setupEventListeners() {
        // Theme toggle buttons
        const themeButtons = document.querySelectorAll('[data-theme]');
        themeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const theme = e.target.getAttribute('data-theme');
                this.switchTheme(theme);
            });
        });

        // Chroma toggle buttons
        const chromaButtons = document.querySelectorAll('[data-chroma]');
        chromaButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const chroma = e.target.getAttribute('data-chroma');
                this.switchChroma(chroma);
            });
        });

        // Back button
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }
    }

    switchTheme(theme) {
        if (theme === this.currentTheme) return;
        
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        this.updateToggleButtons();
        this.updateDisplay();
    }

    switchChroma(chroma) {
        if (chroma === this.currentChroma) return;
        
        this.currentChroma = chroma;
        document.body.setAttribute('data-chroma', chroma);
        this.updateToggleButtons();
        this.updateDisplay();
    }

    updateToggleButtons() {
        // Update theme buttons
        const themeButtons = document.querySelectorAll('[data-theme]');
        themeButtons.forEach(button => {
            const theme = button.getAttribute('data-theme');
            if (theme === this.currentTheme) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Update chroma buttons
        const chromaButtons = document.querySelectorAll('[data-chroma]');
        chromaButtons.forEach(button => {
            const chroma = button.getAttribute('data-chroma');
            if (chroma === this.currentChroma) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    updateDisplay() {
        // Update route badges with proper colors
        this.updateRouteBadges();
        
        // Update alert styles
        this.updateAlertStyles();
        
        // Update crowd indicators
        this.updateCrowdIndicators();
    }

    updateRouteBadges() {
        const badges = document.querySelectorAll('.route-badge');
        badges.forEach(badge => {
            const route = badge.textContent.trim();
            const routeVar = `--route-${route}`;
            
            if (this.currentChroma === 'bw') {
                // Monochrome mode - use badge fill color
                badge.style.background = 'var(--badge-fill)';
                badge.style.color = 'var(--badge-text)';
                
                // Add outline for IRT lines (1-7)
                if (badge.classList.contains('irt')) {
                    badge.style.border = '1.5px solid var(--badge-outline)';
                } else {
                    badge.style.border = 'none';
                }
            } else {
                // Brand mode - use route colors
                badge.style.background = `var(${routeVar})`;
                badge.style.color = 'var(--badge-text)';
                badge.style.border = 'none';
            }
        });
    }

    updateAlertStyles() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            if (this.currentChroma === 'bw') {
                // Monochrome alerts - use neutral colors
                alert.style.background = 'var(--alert-bg-soft)';
                alert.style.borderLeftColor = 'var(--text)';
            } else {
                // Brand alerts - use colored borders
                const alertType = alert.classList[1]; // warning, delay, suspension, info
                const alertVar = `--alert-${alertType}`;
                alert.style.background = 'var(--alert-bg-soft)';
                alert.style.borderLeftColor = `var(${alertVar})`;
            }
        });
    }

    updateCrowdIndicators() {
        const crowdFills = document.querySelectorAll('.crowd-fill');
        crowdFills.forEach(fill => {
            if (this.currentChroma === 'bw') {
                // Monochrome crowd indicators
                fill.style.background = 'var(--text-muted)';
            } else {
                // Brand crowd indicators - use gradient based on level
                const width = fill.style.width;
                const percentage = parseInt(width);
                
                if (percentage >= 75) {
                    fill.style.background = 'var(--alert-suspension)'; // Red for high
                } else if (percentage >= 50) {
                    fill.style.background = 'var(--alert-warning)'; // Yellow for medium
                } else {
                    fill.style.background = 'var(--alert-info)'; // Blue for low
                }
            }
        });
    }

    goBack() {
        // Navigate back to previous page
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    }

    // Utility method to get current theme combination
    getCurrentTheme() {
        return {
            theme: this.currentTheme,
            chroma: this.currentChroma,
            combination: `${this.currentTheme}-${this.currentChroma}`
        };
    }

    // Method to simulate real-time updates (for demo purposes)
    simulateUpdates() {
        setInterval(() => {
            this.updateArrivalTimes();
        }, 30000); // Update every 30 seconds
    }

    updateArrivalTimes() {
        const timeElements = document.querySelectorAll('.arrival-time');
        timeElements.forEach(element => {
            const currentTime = parseInt(element.textContent);
            if (currentTime > 0) {
                element.textContent = Math.max(0, currentTime - 1);
            }
        });
    }
}

// Initialize the MTA Display when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const mtaDisplay = new MTADisplay();
    
    // Start simulation for demo purposes
    mtaDisplay.simulateUpdates();
    
    // Make it globally accessible for debugging
    window.mtaDisplay = mtaDisplay;
});

// Global function for back button
function goBack() {
    if (window.mtaDisplay) {
        window.mtaDisplay.goBack();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MTADisplay;
}
