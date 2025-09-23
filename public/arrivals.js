// Train line configuration
const TRAIN_LINES = {
    'G': { name: 'G Line', color: '#6CBE45', api: '/api/g-arrivals' },
    '1': { name: '1 Line', color: '#EE352E', api: '/api/1-arrivals' },
    '2': { name: '2 Line', color: '#EE352E', api: '/api/2-arrivals' },
    '3': { name: '3 Line', color: '#EE352E', api: '/api/3-arrivals' },
    '4': { name: '4 Line', color: '#00933C', api: '/api/4-arrivals' },
    '5': { name: '5 Line', color: '#00933C', api: '/api/5-arrivals' },
    '6': { name: '6 Line', color: '#00933C', api: '/api/6-arrivals' },
    '7': { name: '7 Line', color: '#B933AD', api: '/api/7-arrivals' },
    'A': { name: 'A Line', color: '#0039A6', api: '/api/a-arrivals' },
    'B': { name: 'B Line', color: '#FF6319', api: '/api/b-arrivals' },
    'C': { name: 'C Line', color: '#0039A6', api: '/api/c-arrivals' },
    'D': { name: 'D Line', color: '#FF6319', api: '/api/d-arrivals' },
    'E': { name: 'E Line', color: '#0039A6', api: '/api/e-arrivals' },
    'F': { name: 'F Line', color: '#FF6319', api: '/api/f-arrivals' },
    'J': { name: 'J Line', color: '#996633', api: '/api/j-arrivals' },
    'L': { name: 'L Line', color: '#A7A9AC', api: '/api/l-arrivals' },
    'M': { name: 'M Line', color: '#FF6319', api: '/api/m-arrivals' },
    'Z': { name: 'Z Line', color: '#996633', api: '/api/z-arrivals' },
    'N': { name: 'N Line', color: '#FCCC0A', api: '/api/n-arrivals' },
    'Q': { name: 'Q Line', color: '#FCCC0A', api: '/api/q-arrivals' },
    'R': { name: 'R Line', color: '#FCCC0A', api: '/api/r-arrivals' },
    'W': { name: 'W Line', color: '#FCCC0A', api: '/api/w-arrivals' }
};

class ArrivalsApp {
    constructor() {
        this.currentLine = 'G';
        this.currentData = null;
        this.refreshInterval = null;
        
        this.elements = {
            trainSelect: document.getElementById('trainLine'),
            filterInput: document.getElementById('stopFilter'),
            refreshBtn: document.getElementById('refreshBtn'),
            updateTime: document.getElementById('updated'),
            summary: document.getElementById('summary'),
            tableBody: document.getElementById('arrivalsBody')
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadArrivals();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        this.elements.trainSelect.addEventListener('change', (e) => {
            this.currentLine = e.target.value;
            this.loadArrivals();
        });

        this.elements.filterInput.addEventListener('input', () => {
            this.renderArrivals();
        });

        this.elements.refreshBtn.addEventListener('click', () => {
            this.loadArrivals();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.loadArrivals();
            }
        });
    }

    async loadArrivals() {
        try {
            this.elements.refreshBtn.disabled = true;
            this.elements.refreshBtn.querySelector('.refresh-icon').style.animation = 'spin 1s linear infinite';
            
            const lineConfig = TRAIN_LINES[this.currentLine];
            const response = await fetch(lineConfig.api, { cache: 'no-store' });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.currentData = data;
            this.renderArrivals();
            
            // Show demo data notice if applicable
            if (data.demo) {
                this.showDemoNotice();
            }
            
        } catch (error) {
            console.error('Failed to load arrivals:', error);
            this.showError(`Failed to load ${TRAIN_LINES[this.currentLine].name} arrivals: ${error.message}`);
        } finally {
            this.elements.refreshBtn.disabled = false;
            this.elements.refreshBtn.querySelector('.refresh-icon').style.animation = 'spin 2s linear infinite';
        }
    }

    renderArrivals() {
        if (!this.currentData) return;

        const filter = this.elements.filterInput.value.trim().toLowerCase();
        const allArrivals = this.currentData.arrivals || [];
        
        const filteredArrivals = filter
            ? allArrivals.filter(arrival => 
                arrival.stationName?.toLowerCase().includes(filter) ||
                arrival.stopId?.toLowerCase().includes(filter) ||
                arrival.destination?.toLowerCase().includes(filter) ||
                arrival.routeId?.toLowerCase().includes(filter)
              )
            : allArrivals;

        this.elements.updateTime.textContent = this.currentData.updated 
            ? `Last updated: ${this.currentData.updated}` 
            : '';

        this.elements.summary.textContent = `Showing ${filteredArrivals.length} of ${allArrivals.length} arrivals`;

        this.elements.tableBody.innerHTML = filteredArrivals.map(arrival => 
            this.createArrivalRow(arrival)
        ).join('');
    }

    createArrivalRow(arrival) {
        const lineConfig = TRAIN_LINES[this.currentLine];
        const routeColor = lineConfig.color;
        
        return `
            <tr>
                <td>
                    <span class="route-badge" style="background-color: ${routeColor}; color: ${this.getContrastColor(routeColor)}">
                        ${arrival.routeId || this.currentLine}
                    </span>
                </td>
                <td>
                    <span class="station-name">${arrival.stationName || 'Unknown Station'}</span>
                </td>
                <td>
                    <span class="stop-id">${arrival.stopId || ''}</span>
                </td>
                <td>
                    <span class="direction">${arrival.direction || ''}</span>
                </td>
                <td>
                    <span class="destination">${arrival.destination || 'Unknown'}</span>
                </td>
                <td>
                    <span class="time">${arrival.arrivalTime || ''}</span>
                </td>
                <td>
                    <span class="time">${arrival.departureTime || ''}</span>
                </td>
            </tr>
        `;
    }

    getContrastColor(hexColor) {
        // Convert hex to RGB
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    showError(message) {
        this.elements.tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #ff6b6b;">
                    <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">⚠️ Error</div>
                    <div>${message}</div>
                    <div style="margin-top: 1rem; font-size: 0.9rem; color: #888;">
                        Make sure the API endpoint is configured in your .env file
                    </div>
                </td>
            </tr>
        `;
        
        this.elements.updateTime.textContent = 'Error loading data';
        this.elements.summary.textContent = '0 arrivals';
    }

    showDemoNotice() {
        // Add a demo notice to the status bar
        const existingNotice = document.querySelector('.demo-notice');
        if (existingNotice) {
            existingNotice.remove();
        }

        const notice = document.createElement('div');
        notice.className = 'demo-notice';
        notice.style.cssText = `
            background: linear-gradient(135deg, #ffa500, #ff8c00);
            color: #000;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-top: 0.5rem;
            text-align: center;
            animation: fadeInUp 0.5s ease-out;
        `;
        notice.textContent = '🎭 Demo Data - Configure MTA_API_KEY for real-time data';
        
        this.elements.summary.parentNode.appendChild(notice);
        
        // Remove notice after 5 seconds
        setTimeout(() => {
            if (notice.parentNode) {
                notice.style.animation = 'fadeOut 0.5s ease-out forwards';
                setTimeout(() => notice.remove(), 500);
            }
        }, 5000);
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadArrivals();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ArrivalsApp();
});

// Clean up when the page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.arrivalsApp) {
        window.arrivalsApp.stopAutoRefresh();
    }
});
