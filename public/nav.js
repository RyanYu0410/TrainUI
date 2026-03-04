// Station search cache and API integration
class StationAPI {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.searchTimeout = null;
    }

    async searchStations(query) {
        // Check cache first
        const cacheKey = query.toLowerCase().trim();
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await fetch(`/api/stations?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            console.log(`API search for "${query}": Found ${data.stations?.length || 0} stations (Total available: ${data.total || 'unknown'})`);
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: data.stations || [],
                timestamp: Date.now()
            });

            return data.stations || [];
        } catch (error) {
            console.error('Error searching stations:', error);
            // Return fallback hardcoded data
            return this.getFallbackStations(query);
        }
    }

    async getAllStations() {
        // Get all stations without filtering
        try {
            const response = await fetch('/api/stations');
            const data = await response.json();
            console.log(`Total stations available: ${data.total || data.stations?.length || 0}`);
            return data.stations || [];
        } catch (error) {
            console.error('Error getting all stations:', error);
            return this.getFallbackStations('');
        }
    }

    getFallbackStations(query) {
        // Fallback hardcoded stations for when API fails
        const fallbackStations = [
            // G Line
            { name: "Court Square", lines: ["G"], borough: "Queens" },
            { name: "21st Street", lines: ["G"], borough: "Queens" },
            { name: "Greenpoint Avenue", lines: ["G"], borough: "Queens" },
            { name: "Nassau Avenue", lines: ["G"], borough: "Brooklyn" },
            { name: "Metropolitan Avenue", lines: ["G"], borough: "Brooklyn" },
            { name: "Broadway", lines: ["G"], borough: "Brooklyn" },
            { name: "Flushing Avenue", lines: ["G"], borough: "Brooklyn" },
            { name: "Myrtle–Willoughby Avenues", lines: ["G"], borough: "Brooklyn" },
            { name: "Bedford–Nostrand Avenues", lines: ["G"], borough: "Brooklyn" },
            { name: "Classon Avenue", lines: ["G"], borough: "Brooklyn" },
            { name: "Clinton–Washington Avenues", lines: ["G"], borough: "Brooklyn" },
            { name: "Fulton Street", lines: ["G"], borough: "Brooklyn" },
            { name: "Hoyt–Schermerhorn Streets", lines: ["G", "A", "C"], borough: "Brooklyn" },
            { name: "Bergen Street", lines: ["G"], borough: "Brooklyn" },
            { name: "Carroll Street", lines: ["G", "F"], borough: "Brooklyn" },
            { name: "Smith–9th Streets", lines: ["G", "F"], borough: "Brooklyn" },
            { name: "4th Avenue–9th Street", lines: ["G", "F"], borough: "Brooklyn" },
            { name: "7th Avenue", lines: ["G", "F"], borough: "Brooklyn" },
            { name: "15th Street–Prospect Park", lines: ["G", "F"], borough: "Brooklyn" },
            { name: "Fort Hamilton Parkway", lines: ["G", "F"], borough: "Brooklyn" },
            { name: "Church Avenue", lines: ["G", "F"], borough: "Brooklyn" },

            // Major Manhattan Stations
            { name: "Times Square–42nd Street", lines: ["1", "2", "3", "7", "N", "Q", "R", "W", "S"], borough: "Manhattan" },
            { name: "Grand Central–42nd Street", lines: ["4", "5", "6", "7", "S"], borough: "Manhattan" },
            { name: "Union Square–14th Street", lines: ["4", "5", "6", "L", "N", "Q", "R", "W"], borough: "Manhattan" },
            { name: "Penn Station–34th Street", lines: ["1", "2", "3", "A", "C", "E"], borough: "Manhattan" },
            { name: "Central Park North–110th Street", lines: ["2", "3"], borough: "Manhattan" },
            { name: "Wall Street", lines: ["2", "3", "4", "5"], borough: "Manhattan" },
            { name: "Brooklyn Bridge–City Hall", lines: ["4", "5", "6"], borough: "Manhattan" },
            { name: "Chambers Street", lines: ["1", "2", "3", "A", "C"], borough: "Manhattan" },
            { name: "Canal Street", lines: ["4", "5", "6", "J", "Z", "N", "Q", "R", "W"], borough: "Manhattan" },
            { name: "14th Street–8th Avenue", lines: ["A", "C", "E", "L"], borough: "Manhattan" },

            // Major Brooklyn Stations
            { name: "Atlantic Avenue–Barclays Center", lines: ["2", "3", "4", "5", "B", "D", "N", "Q", "R"], borough: "Brooklyn" },
            { name: "Jay Street–MetroTech", lines: ["A", "C", "F", "R"], borough: "Brooklyn" },
            { name: "DeKalb Avenue", lines: ["B", "Q", "R"], borough: "Brooklyn" },
            { name: "Prospect Park", lines: ["B", "Q", "S"], borough: "Brooklyn" },
            { name: "Brighton Beach", lines: ["B", "Q"], borough: "Brooklyn" },
            { name: "Coney Island–Stillwell Avenue", lines: ["D", "F", "N", "Q"], borough: "Brooklyn" },

            // Major Queens Stations
            { name: "Jackson Heights–Roosevelt Avenue", lines: ["7", "E", "F", "M", "R"], borough: "Queens" },
            { name: "Queens Plaza", lines: ["E", "M", "R"], borough: "Queens" },
            { name: "74th Street–Broadway", lines: ["7", "E", "F", "M", "R"], borough: "Queens" },
            { name: "Flushing–Main Street", lines: ["7"], borough: "Queens" },
            { name: "Jamaica Center–Parsons/Archer", lines: ["E", "J", "Z"], borough: "Queens" },

            // Major Bronx Stations
            { name: "Yankees–East 161st Street", lines: ["4", "B", "D"], borough: "Bronx" },
            { name: "Fordham Road", lines: ["4", "B", "D"], borough: "Bronx" },
            { name: "Pelham Bay Park", lines: ["6"], borough: "Bronx" },

            // Popular Tourist/Transfer Stations
            { name: "World Trade Center", lines: ["E"], borough: "Manhattan" },
            { name: "South Ferry", lines: ["1"], borough: "Manhattan" },
            { name: "Battery Park", lines: ["4", "5"], borough: "Manhattan" },
            { name: "High Street–Brooklyn Bridge", lines: ["A", "C"], borough: "Brooklyn" },
            { name: "Astoria–Ditmars Boulevard", lines: ["N", "W"], borough: "Queens" },
            { name: "Rockaway Park–Beach 116th Street", lines: ["A", "S"], borough: "Queens" }
        ];

        // Filter fallback stations by query
        const lowerQuery = query.toLowerCase();
        return fallbackStations.filter(station => {
            const nameMatch = station.name.toLowerCase().includes(lowerQuery);
            const lineMatch = station.lines.some(line => line.toLowerCase().includes(lowerQuery));
            const boroughMatch = station.borough.toLowerCase().includes(lowerQuery);
            return nameMatch || lineMatch || boroughMatch;
        });
    }
}

// Global station API instance
const stationAPI = new StationAPI();

class StationSearch {
    constructor() {
        this.startInput = document.getElementById('start-station');
        this.endInput = document.getElementById('end-station');
        this.startSuggestions = document.getElementById('start-suggestions');
        this.endSuggestions = document.getElementById('end-suggestions');
        this.searchLoading = document.getElementById('search-loading');
        
        // Auto-search debounce timer
        this.autoSearchTimer = null;
        
        // Search debounce timer for API calls
        this.searchDebounceTimer = null;
        this.searchDebounceDelay = 300; // 300ms delay
        
        // Loading states for suggestions
        this.startSearching = false;
        this.endSearching = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    
    clearSearchData() {
        // Clear input fields
        if (this.startInput) {
            this.startInput.value = '';
        }
        if (this.endInput) {
            this.endInput.value = '';
        }
        
        // Hide suggestions
        this.hideSuggestions(this.startSuggestions);
        this.hideSuggestions(this.endSuggestions);
        
        // Clear any existing auto-search timer
        if (this.autoSearchTimer) {
            clearTimeout(this.autoSearchTimer);
            this.autoSearchTimer = null;
        }
    }

    setupEventListeners() {
        // Start station input
        this.startInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value, this.startSuggestions, 'start');
        });

        this.startInput.addEventListener('focus', () => {
            if (this.startInput.value) {
                this.showSuggestions(this.startInput.value, this.startSuggestions);
            }
        });

        this.startInput.addEventListener('blur', () => {
            setTimeout(() => this.hideSuggestions(this.startSuggestions), 200);
        });

        // End station input
        this.endInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value, this.endSuggestions, 'end');
        });

        this.endInput.addEventListener('focus', () => {
            if (this.endInput.value) {
                this.showSuggestions(this.endInput.value, this.endSuggestions);
            }
        });

        this.endInput.addEventListener('blur', () => {
            setTimeout(() => this.hideSuggestions(this.endSuggestions), 200);
        });

        // Auto-search when both fields are filled
        this.startInput.addEventListener('input', () => {
            this.checkAndTriggerAutoSearch();
        });
        
        this.endInput.addEventListener('input', () => {
            this.checkAndTriggerAutoSearch();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.startInput.value && this.endInput.value) {
                this.performSearch();
            }
        });
    }

    handleInput(value, suggestionsContainer, type) {
        if (value.length < 2) {
            this.hideSuggestions(suggestionsContainer);
            return;
        }

        // Clear existing debounce timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        // Show loading state
        this.showSearchingState(suggestionsContainer, type);

        // Debounce the API call
        this.searchDebounceTimer = setTimeout(async () => {
            await this.showSuggestions(value, suggestionsContainer, type);
        }, this.searchDebounceDelay);
    }

    showSearchingState(container, type) {
        // Show loading indicator in suggestions
        container.innerHTML = `
            <div class="suggestion-loading">
                <div class="loading-spinner"></div>
                <span>Searching stations...</span>
            </div>
        `;
        container.style.display = 'block';
    }

    checkAndTriggerAutoSearch() {
        // Clear existing timer
        if (this.autoSearchTimer) {
            clearTimeout(this.autoSearchTimer);
        }

        // Don't auto-search on typing - only when stations are actually selected
        // Hide loading animation if either field is empty
        this.hideSearchLoading();
    }

    triggerSearchAfterSelection() {
        // Clear existing timer
        if (this.autoSearchTimer) {
            clearTimeout(this.autoSearchTimer);
        }

        // Check if both fields have values after station selection
        if (this.startInput.value.trim() && this.endInput.value.trim()) {
            // Show loading animation immediately when both fields are filled
            this.showSearchLoading();
            
            // Wait longer before starting the actual search to let users see the animation
            this.autoSearchTimer = setTimeout(() => {
                console.log('Auto-search triggered after station selection');
                this.performSearch();
            }, 3000); // 3 second delay to show the animation
        } else {
            // Hide loading animation if either field is empty
            this.hideSearchLoading();
        }
    }

    showSearchLoading() {
        if (this.searchLoading) {
            this.searchLoading.style.display = 'flex';
            // Add a small delay for smoother transition
            setTimeout(() => {
                this.searchLoading.classList.add('show');
            }, 50);
        }
    }

    hideSearchLoading() {
        if (this.searchLoading) {
            this.searchLoading.classList.remove('show');
            setTimeout(() => {
                this.searchLoading.style.display = 'none';
            }, 300);
        }
    }

    async showSuggestions(query, container, type) {
        try {
            const matches = await stationAPI.searchStations(query);
            
            console.log('Showing suggestions for:', query, 'Found:', matches.length, 'matches');
            
            if (matches.length === 0) {
                this.hideSuggestions(container);
                return;
            }

            // Sort matches by relevance
            const sortedMatches = this.sortSearchResults(matches, query);

            container.innerHTML = sortedMatches.slice(0, 8).map(station => `
                <div class="suggestion-item" data-station="${station.name}">
                    <div class="suggestion-name">${station.name}</div>
                    <div class="suggestion-lines">
                        ${station.lines.map(line => `<span class="line-badge" style="background-color: ${this.getLineColor(line)}; color: ${this.getContrastColor(this.getLineColor(line))}">${line}</span>`).join(' ')} • ${station.borough}
                        ${station.ada ? '<span class="ada-badge">♿</span>' : ''}
                    </div>
                    ${station.stopId ? `<div class="suggestion-id">ID: ${station.stopId}</div>` : ''}
                </div>
            `).join('');

            // Add click handlers to suggestions
            container.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const stationName = item.dataset.station;
                    const input = container.id === 'start-suggestions' ? this.startInput : this.endInput;
                    input.value = stationName;
                    this.hideSuggestions(container);
                    
                    // Check if both fields now have values and trigger search
                    this.triggerSearchAfterSelection();
                });
            });

            container.style.display = 'block';
        } catch (error) {
            console.error('Error showing suggestions:', error);
            this.hideSuggestions(container);
        }
    }

    sortSearchResults(stations, query) {
        const lowerQuery = query.toLowerCase();
        
        return stations.sort((a, b) => {
            // Prioritize exact name matches
            const aExact = a.name.toLowerCase().startsWith(lowerQuery);
            const bExact = b.name.toLowerCase().startsWith(lowerQuery);
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            // Then by name length (shorter names first)
            return a.name.length - b.name.length;
        });
    }

    hideSuggestions(container) {
        container.style.display = 'none';
    }




    async performSearch() {
        const startStation = this.startInput.value.trim();
        const endStation = this.endInput.value.trim();
        
        console.log('Search initiated:', { startStation, endStation });
        
        if (!startStation || !endStation) {
            console.log('Empty station names');
            this.hideSearchLoading();
            return;
        }

        try {
            // Search for station objects using API
            const [startMatches, endMatches] = await Promise.all([
                stationAPI.searchStations(startStation),
                stationAPI.searchStations(endStation)
            ]);
            
            // Find exact matches first
            let startStationObj = startMatches.find(s => s.name === startStation);
            let endStationObj = endMatches.find(s => s.name === endStation);
            
            console.log('Found stations:', { startStationObj, endStationObj });
            
            if (!startStationObj || !endStationObj) {
                // Try fuzzy matching
                startStationObj = startMatches.find(s => s.name.toLowerCase().includes(startStation.toLowerCase()));
                endStationObj = endMatches.find(s => s.name.toLowerCase().includes(endStation.toLowerCase()));
                
                if (startStationObj && endStationObj) {
                    console.log('Using fuzzy matches:', { startStationObj, endStationObj });
                    this.calculateRoutes(startStationObj, endStationObj);
                    return;
                }
                
                alert('Please select valid stations from the suggestions.');
                this.hideSearchLoading();
                return;
            }

            // Calculate routes and show results
            this.calculateRoutes(startStationObj, endStationObj);
        } catch (error) {
            console.error('Error in performSearch:', error);
            alert('Error searching for stations. Please try again.');
            this.hideSearchLoading();
        }
    }

    async calculateRoutes(startStation, endStation) {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Fetch real-time route data from API
            const response = await fetch(`/api/route-planning?from=${encodeURIComponent(startStation.name)}&to=${encodeURIComponent(endStation.name)}`);
            const data = await response.json();
            
            let routes = [];
            if (data.routes && data.routes.length > 0) {
                routes = data.routes;
            } else {
                // Fallback to client-side calculation
                routes = await this.findRoutes(startStation, endStation);
                
                // If client-side also finds no routes, return empty array to show "sorry" message
                if (routes.length === 0) {
                    console.log('No routes found in client-side calculation either');
                }
            }
            
            // Hide search loading animation
            this.hideSearchLoading();
            
            // Show route results in card overlay
            this.showRouteCard(startStation, endStation, routes);
            
        } catch (error) {
            console.error('Route planning error:', error);
            // Fallback to client-side calculation
            const routes = await this.findRoutes(startStation, endStation);
            
            // If client-side also finds no routes, show empty array to display "sorry" message
            const finalRoutes = routes.length > 0 ? routes : [];
            
            // Hide search loading animation
            this.hideSearchLoading();
            
            // Show route results in card overlay
            this.showRouteCard(startStation, endStation, finalRoutes);
        }
    }

    showLoadingState() {
        const cardOverlay = document.getElementById('route-card-overlay');
        const loadingState = document.getElementById('loading-state');
        
        if (cardOverlay) {
            cardOverlay.style.display = 'flex';
            cardOverlay.classList.add('show');
        }
        
        if (loadingState) {
            loadingState.style.display = 'flex';
        }
    }

    showRouteCard(startStation, endStation, routes) {
        console.log('Showing route card:', { startStation, endStation, routes });
        
        const cardOverlay = document.getElementById('route-card-overlay');
        const loadingState = document.getElementById('loading-state');
        const totalTime = document.getElementById('total-time');
        const routeList = document.getElementById('route-list');
        
        console.log('DOM elements found:', { 
            cardOverlay: !!cardOverlay, 
            loadingState: !!loadingState,
            totalTime: !!totalTime,
            routeList: !!routeList
        });
        
        // Hide loading state
        if (loadingState) {
            loadingState.style.display = 'none';
        }
        
        // Update card header (from/to stations removed from display)
        
        // Calculate total time (use first route's time)
        const totalTimeValue = routes.length > 0 ? routes[0].totalTime : '--';
        if (totalTime) totalTime.textContent = totalTimeValue;
        
        // Display routes
        if (routeList) {
            if (routes.length === 0) {
                routeList.innerHTML = `
                    <div class="no-routes-message">
                        <div class="sorry-icon">😔</div>
                        <h3>Sorry, no routes found</h3>
                        <p>We couldn't find any available routes between these stations.</p>
                        <p>Please try different stations or check back later.</p>
                    </div>
                `;
            } else {
                routeList.innerHTML = routes.map((route, index) => this.createRouteOption(route, index === 0)).join('');
            }
        }
        
        // Show card overlay with proper animation timing
        if (cardOverlay) {
            // Reset any existing animations
            cardOverlay.classList.remove('show');
            cardOverlay.style.display = 'flex';
            
            // Force a reflow to ensure initial states are applied
            cardOverlay.offsetHeight;
            
            // Add show class to trigger animations with a slight delay
            setTimeout(() => {
                cardOverlay.classList.add('show');
                console.log('Added show class to trigger animations');
            }, 100);
        }
        
        // Setup card event listeners
        this.setupCardEventListeners();
    }

    createRouteOption(route, isBest = false) {
        const routeClass = isBest ? 'route-option best-route' : 'route-option';
        const routeLines = route.lines.map(line => 
            `<span class="route-badge ${line.toLowerCase()}" style="background-color: ${this.getLineColor(line)}; color: ${this.getContrastColor(this.getLineColor(line))}">${line}</span>`
        ).join('');
        
        const routeSteps = route.steps.map(step => `
            <div class="route-step ${step.highlight ? 'highlight' : ''}">
                <div class="step-icon ${step.highlight ? 'highlight' : ''}" style="background-color: ${this.getLineColor(step.line)}; color: ${this.getContrastColor(this.getLineColor(step.line))}">${step.line}</div>
                <div class="step-info">
                    <div class="step-station">${step.station}</div>
                    <div class="step-time">${step.time}</div>
                </div>
            </div>
        `).join('');
        
        return `
            <div class="${routeClass}">
                <div class="route-header">
                    <div class="route-info">
                        <div class="route-lines">${routeLines}</div>
                        <span class="route-transfers">${route.transfers} transfer${route.transfers !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="route-time">${route.totalTime}</div>
                </div>
                <div class="route-details">
                    ${routeSteps}
                </div>
            </div>
        `;
    }

    setupCardEventListeners() {
        const cardOverlay = document.getElementById('route-card-overlay');
        const routeCard = document.getElementById('route-card');
        
        // Click outside to close
        if (cardOverlay) {
            cardOverlay.onclick = (e) => {
                if (e.target === cardOverlay) {
                    this.hideRouteCard();
                    this.clearSearchData(); // Clear search data when closing
                }
            };
        }
        
        // Setup swipe gestures
        this.setupSwipeGestures(routeCard);
        
        // Setup keyboard events
        this.setupKeyboardEvents();
    }
    
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const cardOverlay = document.getElementById('route-card-overlay');
                if (cardOverlay && cardOverlay.style.display === 'flex') {
                    this.hideRouteCard();
                    this.clearSearchData(); // Clear search data when closing with Escape
                }
            }
        });
    }

    hideRouteCard() {
        const cardOverlay = document.getElementById('route-card-overlay');
        if (cardOverlay) {
            cardOverlay.classList.remove('show');
            setTimeout(() => {
                cardOverlay.style.display = 'none';
            }, 300);
        }
    }

    setupSwipeGestures(cardElement) {
        if (!cardElement) return;
        
        let touchStartY = 0;
        let touchStartX = 0;
        let touchEndY = 0;
        let touchEndX = 0;
        let isDragging = false;
        
        // Touch events
        cardElement.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            isDragging = true;
            cardElement.style.transition = 'none';
        }, { passive: false });
        
        cardElement.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            touchEndY = e.touches[0].clientY;
            touchEndX = e.touches[0].clientX;
            
            const deltaY = touchEndY - touchStartY;
            const deltaX = touchEndX - touchStartX;
            
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                const currentTransform = this.getCurrentTransform(cardElement);
                const newTransform = Math.max(0, Math.min(window.innerHeight * 0.8, currentTransform + deltaY));
                cardElement.style.transform = `translateY(${newTransform}px)`;
            }
        }, { passive: false });
        
        cardElement.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            cardElement.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            const deltaY = touchEndY - touchStartY;
            const threshold = 100;
            
            if (Math.abs(deltaY) > threshold) {
                if (deltaY > 0) {
                    // Swipe down - close card
                    this.hideRouteCard();
                    this.clearSearchData(); // Clear search data when closing
                } else {
                    // Swipe up - expand card
                    cardElement.style.transform = 'translateY(0)';
                }
            } else {
                // Return to position
                cardElement.style.transform = 'translateY(0)';
            }
        }, { passive: false });
    }

    getCurrentTransform(element) {
        const transform = element.style.transform;
        const match = transform.match(/translateY\(([^)]+)\)/);
        return match ? parseFloat(match[1]) : 0;
    }

    getLineColor(line) {
        const lineColors = {
            '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',
            '4': '#00933C', '5': '#00933C', '6': '#00933C',
            '7': '#B933AD',
            'A': '#0039A6', 'C': '#0039A6', 'E': '#0039A6',
            'B': '#FF6319', 'D': '#FF6319', 'F': '#FF6319', 'M': '#FF6319',
            'G': '#6CBE45',
            'J': '#996633', 'Z': '#996633',
            'L': '#A7A9AC',
            'N': '#FCCC0A', 'Q': '#FCCC0A', 'R': '#FCCC0A', 'W': '#FCCC0A',
            'S': '#808183'
        };
        return lineColors[line] || '#808183';
    }

    getContrastColor(hexColor) {
        // Convert hex to RGB
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return white for dark colors, black for light colors
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    async findRoutes(startStation, endStation) {
        const routes = [];
        
        // Direct route (same line)
        const commonLines = startStation.lines.filter(line => endStation.lines.includes(line));
        if (commonLines.length > 0) {
            routes.push({
                type: 'direct',
                lines: [commonLines[0]],
                steps: [
                    { station: startStation.name, line: commonLines[0], time: 'Now', highlight: true },
                    { station: endStation.name, line: commonLines[0], time: this.calculateTravelTime(startStation, endStation, commonLines[0]) }
                ],
                totalTime: `${this.calculateTravelTimeMinutes(startStation, endStation, commonLines[0])} min`,
                transfers: 0
            });
        }

        // One transfer routes
        for (const startLine of startStation.lines) {
            for (const endLine of endStation.lines) {
                if (startLine !== endLine) {
                    const transferStation = await this.findTransferStation(startLine, endLine);
                    if (transferStation) {
                        routes.push({
                            type: 'transfer',
                            lines: [startLine, endLine],
                            steps: [
                                { station: startStation.name, line: startLine, time: 'Now', highlight: true },
                                { station: transferStation.name, line: startLine, time: this.calculateTravelTime(startStation, transferStation, startLine) },
                                { station: transferStation.name, line: endLine, time: 'Transfer', highlight: true },
                                { station: endStation.name, line: endLine, time: this.calculateTravelTime(transferStation, endStation, endLine) }
                            ],
                            totalTime: `${this.calculateTravelTimeMinutes(startStation, transferStation, startLine) + 
                                      this.calculateTravelTimeMinutes(transferStation, endStation, endLine) + 5} min`, // 5 min transfer time
                            transfers: 1
                        });
                    }
                }
            }
        }

        // Sort routes by total time (extract numeric value for comparison)
        return routes.sort((a, b) => {
            const aTime = parseInt(a.totalTime.replace(/\D/g, '')) || 0;
            const bTime = parseInt(b.totalTime.replace(/\D/g, '')) || 0;
            return aTime - bTime;
        }).slice(0, 3);
    }

    async findTransferStation(line1, line2) {
        try {
            // Search for stations that serve both lines using API
            const stations = await stationAPI.searchStations('');
            return stations.find(station => 
                station.lines.includes(line1) && station.lines.includes(line2)
            );
        } catch (error) {
            console.error('Error finding transfer station:', error);
            // Fallback to hardcoded search
            const fallbackStations = stationAPI.getFallbackStations('');
            return fallbackStations.find(station => 
                station.lines.includes(line1) && station.lines.includes(line2)
            );
        }
    }

    calculateTravelTime(station1, station2, line) {
        // Simplified time calculation based on distance
        // In a real app, this would use actual MTA data
        const baseTime = Math.floor(Math.random() * 15) + 5; // 5-20 minutes
        return `${baseTime} min`;
    }

    calculateTravelTimeMinutes(station1, station2, line) {
        // Return just the number of minutes for calculations
        const baseTime = Math.floor(Math.random() * 15) + 5; // 5-20 minutes
        return baseTime;
    }

    displayRoutes(routes, startStation, endStation) {
        const resultsContainer = document.getElementById('route-results');
        const routeList = document.getElementById('route-list');
        const totalTime = document.getElementById('total-time');
        const routeCount = document.getElementById('route-count');

        if (routes.length === 0) {
            routeList.innerHTML = '<div class="no-routes">No routes found. Please try different stations.</div>';
            totalTime.textContent = '--';
            routeCount.textContent = '0';
        } else {
            // Update summary
            totalTime.textContent = routes[0].totalTime;
            routeCount.textContent = routes.length.toString();

            // Display routes
            routeList.innerHTML = routes.map((route, index) => {
                return `
                    <div class="route-option">
                        <div class="route-header">
                            <div class="route-info">
                                <div class="route-lines">
                                    ${route.lines.map(line => `<span class="route-badge ${line.toLowerCase()}">${line}</span>`).join('')}
                                </div>
                                <span class="route-transfers">${route.transfers} transfer${route.transfers !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                        
                        <div class="route-details">
                            ${route.steps.map(step => `
                                <div class="route-step ${step.highlight ? 'highlight' : ''}">
                                    <div class="step-icon ${step.highlight ? 'highlight' : ''}">${step.line}</div>
                                    <div class="step-info">
                                        <div class="step-station">${step.station}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="route-actions">
                            <button class="action-btn" onclick="trackRoute('${startStation.name}', '${endStation.name}', '${route.lines.join(',')}')">
                                Track
                            </button>
                            <button class="action-btn primary" onclick="viewArrivals('${route.lines[0]}')">
                                View Arrivals
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Show train details button when routes are displayed
            const trainDetailsLink = document.getElementById('train-details-link');
            if (trainDetailsLink) {
                trainDetailsLink.style.display = 'block';
            }
        }

        // Show results with animation
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// Global functions for route actions
window.trackRoute = function(startStation, endStation, lines) {
    alert(`Tracking route from ${startStation} to ${endStation} via ${lines}\n\nThis would show real-time tracking in a real app.`);
};

window.viewArrivals = function(line) {
    // Redirect to arrivals page with the specific line selected
    window.location.href = `/?line=${line.toLowerCase()}`;
};

window.viewTrainDetails = function() {
    // Get current search parameters
    const fromInput = document.getElementById('from-station');
    const toInput = document.getElementById('to-station');
    
    const fromStation = fromInput ? fromInput.value : '';
    const toStation = toInput ? toInput.value : '';
    
    // Navigate to train details page with parameters
    const params = new URLSearchParams();
    if (fromStation) params.set('from', fromStation);
    if (toStation) params.set('to', toStation);
    params.set('line', 'G'); // Default to G line for now
    
    window.location.href = `/train-details?${params.toString()}`;
};


// Initialize the search functionality when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new StationSearch();
});
