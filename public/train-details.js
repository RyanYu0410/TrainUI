// Enhanced Train Details Page JavaScript with Real MTA Data
class TrainDetails {
    constructor() {
        this.currentStation = null;
        this.currentLine = null;
        this.fromStation = null;
        this.toStation = null;
        this.stationData = null;
        this.arrivalsData = null;
        this.updateInterval = null;
        
        this.init();
    }
    
    init() {
        this.loadTrainDetails();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Back button
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }
    }
    
    async loadTrainDetails() {
        try {
            // Get parameters from URL
            const urlParams = new URLSearchParams(window.location.search);
            const fromStation = urlParams.get('from') || 'Court Sq-23 St';
            const toStation = urlParams.get('to') || 'Court Sq-23 St';
            const line = urlParams.get('line') || 'G';
            
            this.currentStation = fromStation;
            this.currentLine = line;
            this.fromStation = fromStation;
            this.toStation = toStation;
            
            // Load station data
            await this.loadStationData();
            
            // Update all displays
            this.updateStationInformation();
            this.loadRouteMap();
            await this.loadTrainArrival();
            await this.loadServiceStatus();
            this.loadLineInformation();
            
            // Start real-time updates
            this.startRealTimeUpdates();
            
        } catch (error) {
            console.error('Error loading train details:', error);
            this.showError('Failed to load train details');
        }
    }
    
    async loadStationData() {
        try {
            const response = await fetch('/api/stations');
            if (response.ok) {
                const data = await response.json();
                this.stationData = data.stations;
                console.log('Loaded station data:', this.stationData.length, 'stations');
                
                // Find the current station and update line information
                const currentStationData = this.stationData.find(s => s.name === this.currentStation);
                if (currentStationData && currentStationData.lines) {
                    // Update current line to the first available line if not specified
                    if (!this.currentLine || this.currentLine === 'G') {
                        this.currentLine = currentStationData.lines[0];
                    }
                    console.log('Current station lines:', currentStationData.lines);
                }
            }
        } catch (error) {
            console.error('Error loading station data:', error);
        }
    }
    
    async loadArrivalsData() {
        try {
            // Use the correct line-specific API endpoint
            const lineEndpoint = this.getLineEndpoint(this.currentLine);
            const response = await fetch(`${lineEndpoint}?station=${encodeURIComponent(this.currentStation)}`);
            
            if (response.ok) {
                const data = await response.json();
                this.arrivalsData = data.arrivals || [];
                console.log('Loaded arrivals data:', this.arrivalsData.length, 'arrivals for line', this.currentLine);
                console.log('Arrivals data:', data);
                return this.arrivalsData;
            }
        } catch (error) {
            console.error('Error loading arrivals data:', error);
        }
        return [];
    }
    
    getLineEndpoint(line) {
        // Map line to correct API endpoint
        const lineEndpoints = {
            '1': '/api/1-arrivals',
            '2': '/api/2-arrivals', 
            '3': '/api/3-arrivals',
            '4': '/api/4-arrivals',
            '5': '/api/5-arrivals',
            '6': '/api/6-arrivals',
            '7': '/api/7-arrivals',
            'A': '/api/a-arrivals',
            'B': '/api/b-arrivals',
            'C': '/api/c-arrivals',
            'D': '/api/d-arrivals',
            'E': '/api/e-arrivals',
            'F': '/api/f-arrivals',
            'G': '/api/g-arrivals',
            'J': '/api/j-arrivals',
            'L': '/api/l-arrivals',
            'M': '/api/m-arrivals',
            'N': '/api/n-arrivals',
            'Q': '/api/q-arrivals',
            'R': '/api/r-arrivals',
            'W': '/api/w-arrivals'
        };
        return lineEndpoints[line] || '/api/g-arrivals';
    }
    
    updateStationInformation() {
        // Update station name
        const stationName = document.getElementById('stationName');
        if (stationName) {
            stationName.textContent = this.currentStation;
        }
        
        // Find station data and update details
        if (this.stationData) {
            const station = this.stationData.find(s => s.name === this.currentStation);
            if (station) {
                console.log('Found station data:', station);
                
                // Update borough
                const borough = document.getElementById('borough');
                if (borough) {
                    borough.textContent = station.borough || 'Unknown';
                }
                
                // Update accessibility
                const accessibility = document.getElementById('accessibility');
                if (accessibility) {
                    accessibility.textContent = station.ada ? 'ADA Accessible' : '';
                }
                
                // Update line badges with actual station lines
                const stationLines = station.lines || [this.currentLine];
                this.updateLineBadges(stationLines);
                
                // Update current line to match station's primary line
                if (stationLines.length > 0) {
                    this.currentLine = stationLines[0];
                }
            } else {
                console.log('Station not found in data, using fallback');
                // Fallback for stations not found in API data
                const borough = document.getElementById('borough');
                if (borough) {
                    borough.textContent = 'Unknown';
                }
                
                const accessibility = document.getElementById('accessibility');
                if (accessibility) {
                    accessibility.textContent = '';
                }
                
                this.updateLineBadges([this.currentLine]);
            }
        }
    }
    
    updateLineBadges(lines) {
        const lineBadges = document.getElementById('lineBadges');
        if (!lineBadges) return;
        
        lineBadges.innerHTML = '';
        
        lines.forEach(line => {
            const badge = document.createElement('div');
            badge.className = `line-badge ${line.toLowerCase()}`;
            badge.textContent = line;
            lineBadges.appendChild(badge);
        });
    }
    
    loadRouteMap() {
        const routeMap = document.getElementById('routeMap');
        if (!routeMap) return;
        
        // Get stations for current line
        const lineStations = this.getLineStations(this.currentLine);
        if (lineStations.length === 0) {
            routeMap.innerHTML = '<div class="no-data">No station data available</div>';
            return;
        }
        
        routeMap.innerHTML = '';
        
        // Add line indicator at top
        const lineIndicator = document.createElement('div');
        lineIndicator.className = 'line-header';
        lineIndicator.innerHTML = `
            <div class="line-badge">${this.currentLine}</div>
            <div class="line-title">${this.currentLine} Line</div>
        `;
        routeMap.appendChild(lineIndicator);
        
        // Create condensed station list with connecting line
        const stationList = document.createElement('div');
        stationList.className = 'condensed-stations';
        
        // Show only key stations (current station + 4-6 others)
        const keyStations = this.getKeyStations(lineStations);
        
        keyStations.forEach((station, index) => {
            const stationItem = document.createElement('div');
            stationItem.className = 'condensed-station';
            
            // Check if this is the current station
            const isCurrent = station.name === this.currentStation;
            
            // Generate crowd level for this station
            const crowdLevel = this.generateCrowdLevel(station.name);
            const crowdColor = this.getCrowdColor(crowdLevel);
            
            stationItem.innerHTML = `
                <div class="station-dot ${isCurrent ? 'active' : ''}" style="background: ${crowdColor}; border-color: ${crowdColor};" title="${this.getCrowdingText(crowdLevel)}"></div>
                <div class="station-name">${station.name}</div>
            `;
            stationList.appendChild(stationItem);
        });
        
        routeMap.appendChild(stationList);
        
        // Add station count summary
        const summary = document.createElement('div');
        summary.className = 'station-summary';
        summary.innerHTML = `
            <div class="summary-text">${lineStations.length} total stations on ${this.currentLine} line</div>
        `;
        routeMap.appendChild(summary);
    }
    
    getLineStations(line) {
        if (!this.stationData) return [];
        
        const lineStations = this.stationData
            .filter(station => station.lines && station.lines.includes(line))
            .sort((a, b) => a.name.localeCompare(b.name));
            
        console.log(`Found ${lineStations.length} stations for line ${line}:`, lineStations.map(s => s.name));
        return lineStations;
    }
    
    getKeyStations(lineStations) {
        // Get current station and select 4-6 key stations around it
        const currentIndex = lineStations.findIndex(s => s.name === this.currentStation);
        const totalStations = lineStations.length;
        
        if (currentIndex === -1) {
            // If current station not found, return first 6 stations
            return lineStations.slice(0, 6);
        }
        
        // Select stations around current station
        const start = Math.max(0, currentIndex - 2);
        const end = Math.min(totalStations, currentIndex + 4);
        const keyStations = lineStations.slice(start, end);
        
        // If we have fewer than 5 stations, try to get more
        if (keyStations.length < 5 && totalStations > 5) {
            const additionalNeeded = 5 - keyStations.length;
            if (start === 0) {
                // Add from the end
                keyStations.push(...lineStations.slice(end, end + additionalNeeded));
            } else {
                // Add from the beginning
                keyStations.unshift(...lineStations.slice(Math.max(0, start - additionalNeeded), start));
            }
        }
        
        return keyStations.slice(0, 6); // Limit to 6 stations max
    }
    
    getCrowdEmoji(crowdLevel) {
        // Return crowd emoji based on level
        if (crowdLevel >= 4) return '🔴'; // High
        if (crowdLevel >= 3) return '🟡'; // Medium
        if (crowdLevel >= 2) return '🟢'; // Low
        return '⚪'; // Very low
    }
    
    getCrowdColor(crowdLevel) {
        // Return color based on crowd level - coordinated minimalistic colors
        if (crowdLevel >= 4) return '#ff6b6b'; // High - Soft red
        if (crowdLevel >= 3) return '#ffd93d'; // Medium - Soft yellow
        if (crowdLevel >= 2) return '#6bcf7f'; // Low - Soft green
        return '#a8a8a8'; // Very low - Soft gray
    }
    
    generateCrowdLevel(stationName) {
        // Generate realistic crowd levels based on station characteristics
        const now = new Date();
        const hour = now.getHours();
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        
        // Major transfer stations are more crowded
        const majorStations = ['Times Sq-42 St', 'Union Square–14th Street', 'Grand Central-42 St', '34 St-Penn Station'];
        const isMajorStation = majorStations.some(major => stationName.includes(major.split(' ')[0]));
        
        let baseLevel = 1; // Low crowding by default
        
        if (isRushHour) {
            baseLevel += 2;
        }
        
        if (isMajorStation) {
            baseLevel += 1;
        }
        
        // Add some randomness
        baseLevel += Math.floor(Math.random() * 2);
        
        return Math.min(4, Math.max(1, baseLevel));
    }
    
    generateStationLabels(station) {
        const labels = [];
        
        // Add transfer information
        if (station.lines && station.lines.length > 1) {
            labels.push('Transfer');
        }
        
        // Add accessibility info
        if (station.ada) {
            labels.push('ADA');
        }
        
        // Add borough info for major stations
        if (station.borough && station.borough !== 'Unknown') {
            labels.push(station.borough);
        }
        
        // Add stop ID if available
        if (station.stopId) {
            labels.push(`ID: ${station.stopId}`);
        }
        
        return labels;
    }
    
    getCrowdingText(level) {
        const texts = ['Low', 'Moderate', 'High', 'Very High'];
        return texts[level - 1] + ' Crowding';
    }
    
    async loadTrainArrival() {
        const arrivalTime = document.getElementById('arrivalTime');
        const destination = document.getElementById('destination');
        const trainLength = document.getElementById('trainLength');
        const trainCars = document.getElementById('trainCars');
        
        // Load real arrival data
        const arrivals = await this.loadArrivalsData();
        
        if (arrivalTime) {
            if (arrivals && arrivals.length > 0) {
                // Find arrivals for the current station
                const stationArrivals = arrivals.filter(arrival => 
                    arrival.stationName && 
                    arrival.stationName.toLowerCase().includes(this.currentStation.toLowerCase())
                );
                
                if (stationArrivals.length > 0) {
                    const nextArrival = stationArrivals[0];
                    const minutes = this.calculateArrivalMinutes(nextArrival);
                    const direction = nextArrival.direction || 'N';
                    const density = this.getCurrentDensity();
                    arrivalTime.innerHTML = `${this.currentLine} Train: ${minutes} min (${direction}) • ${density}`;
                } else {
                    // Use first available arrival if no station-specific match
                    const nextArrival = arrivals[0];
                    const minutes = this.calculateArrivalMinutes(nextArrival);
                    const direction = nextArrival.direction || 'N';
                    const density = this.getCurrentDensity();
                    arrivalTime.innerHTML = `${this.currentLine} Train: ${minutes} min (${direction}) • ${density}`;
                }
            } else {
                const density = this.getCurrentDensity();
                arrivalTime.innerHTML = `${this.currentLine} Train: -- min • ${density}`;
            }
        }
        
        if (destination) {
            if (arrivals && arrivals.length > 0) {
                const nextArrival = arrivals[0];
                const dest = nextArrival.destination || this.toStation;
                destination.textContent = `To ${dest}`;
            } else {
                destination.textContent = `To ${this.toStation}`;
            }
        }
        
        if (trainLength) {
            // Hide train length - not needed
            trainLength.style.display = 'none';
        }
        
        if (trainCars) {
            // Hide train car visualization - not needed
            trainCars.style.display = 'none';
        }
        
        // Show crowd section only when train cars are shown (currently hidden)
        this.toggleCrowdSection(trainCars && trainCars.style.display !== 'none');
    }
    
    calculateArrivalMinutes(arrival) {
        if (arrival.epoch) {
            const now = Math.floor(Date.now() / 1000);
            const minutes = Math.max(0, Math.floor((arrival.epoch - now) / 60));
            return minutes.toString();
        } else if (arrival.arrivalTime) {
            // Try to parse arrival time
            const arrivalDate = new Date(arrival.arrivalTime);
            if (!isNaN(arrivalDate.getTime())) {
                const now = new Date();
                const minutes = Math.max(0, Math.floor((arrivalDate.getTime() - now.getTime()) / 60000));
                return minutes.toString();
            }
        }
        return '2'; // Default fallback
    }
    
    getCurrentDensity() {
        // Get current crowd density based on time and station
        const now = new Date();
        const hour = now.getHours();
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        
        // Major stations are more crowded
        const majorStations = ['Times Sq-42 St', 'Union Square–14th Street', 'Grand Central-42 St', '34 St-Penn Station'];
        const isMajorStation = majorStations.some(major => this.currentStation.includes(major.split(' ')[0]));
        
        // Always show 6 figures with varying transparency
        let activeCount = 1; // Default: 1 active figure
        
        if (isRushHour && isMajorStation) {
            activeCount = 6; // High density - all 6 figures active
        } else if (isRushHour || isMajorStation) {
            activeCount = 4; // Medium density - 4 figures active
        } else if (hour >= 10 && hour <= 16) {
            activeCount = 2; // Low-medium density - 2 figures active
        }
        
        // Create 6 figures with transparency
        let density = '';
        for (let i = 0; i < 6; i++) {
            if (i < activeCount) {
                density += '👤'; // Active figure
            } else {
                density += '<span style="opacity: 0.2;">👤</span>'; // Low transparency figure
            }
        }
        
        return density;
    }
    
    generateTrainOccupancy() {
        // Generate realistic train car occupancy based on time and station
        const now = new Date();
        const hour = now.getHours();
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        
        // Base occupancy on rush hour and station
        const baseOccupancy = isRushHour ? 0.7 : 0.4;
        const stationFactor = this.getStationCrowdFactor();
        
        return {
            front: Math.min(1, baseOccupancy + stationFactor + (Math.random() * 0.3 - 0.15)),
            middle: Math.min(1, baseOccupancy + (Math.random() * 0.2 - 0.1)),
            back: Math.min(1, baseOccupancy - 0.1 + (Math.random() * 0.2 - 0.1))
        };
    }
    
    getStationCrowdFactor() {
        // Get crowd factor based on current station
        const crowdStations = ['Times Sq-42 St', 'Union Square–14th Street', 'Grand Central-42 St'];
        return crowdStations.includes(this.currentStation) ? 0.2 : 0;
    }
    
    createTrainCarsHTML(occupancy) {
        const createCar = (type, content = '', occupancyLevel = 0) => {
            let occupancyClass = '';
            if (occupancyLevel > 0.7) {
                occupancyClass = 'high';
            } else if (occupancyLevel > 0.4) {
                occupancyClass = 'medium';
            } else {
                occupancyClass = 'low';
            }
            
            let occupancyBar = '';
            if (type === 'dark-blue' || type === 'orange') {
                let barColor = '#ffaa00'; // Default yellow
                if (occupancyLevel > 0.7) barColor = '#ff4444'; // Red for high
                else if (occupancyLevel > 0.4) barColor = '#ffaa00'; // Yellow for medium
                else barColor = '#00ff00'; // Green for low
                
                const barWidth = Math.max(5, Math.min(30, occupancyLevel * 30)); // Scale bar width
                occupancyBar = `<div class="occupancy-bar" style="width: ${barWidth}px; background-color: ${barColor};"></div>`;
            }
            
            return `<div class="train-car ${type} ${occupancyClass}">${content}${occupancyBar}</div>`;
        };
        
        return `
            <div class="train-row">
                ${createCar('blue', this.currentLine)}
                ${createCar('circle')}
                ${createCar('circle')}
                ${createCar('circle')}
                ${createCar('circle')}
                ${createCar('dark-blue', '', occupancy.front)}
                ${createCar('dark-blue', '', occupancy.middle)}
                ${createCar('dark-blue', '', occupancy.back)}
                ${createCar('dark-blue', '', occupancy.middle)}
                ${createCar('dark-blue', '', occupancy.front)}
            </div>
            <div class="train-row">
                ${createCar('grey')}
                ${createCar('orange', '', occupancy.front)}
                ${createCar('orange', '', occupancy.middle)}
                ${createCar('orange', '', occupancy.back)}
                ${createCar('orange', '', occupancy.middle)}
                ${createCar('orange', '', occupancy.front)}
                ${createCar('orange', '', occupancy.middle)}
                ${createCar('orange', '', occupancy.back)}
                ${createCar('orange', '', occupancy.middle)}
                ${createCar('orange', '', occupancy.front)}
            </div>
        `;
    }
    
    async loadServiceStatus() {
        const statusText = document.getElementById('statusText');
        const statusDetails = document.getElementById('statusDetails');
        
        // Try to get real service status from arrivals data
        const arrivals = await this.loadArrivalsData();
        const serviceStatus = this.getServiceStatus(arrivals);
        
        if (statusText) {
            statusText.textContent = serviceStatus.status;
            statusText.className = `status-text ${serviceStatus.type}`;
        }
        if (statusDetails) {
            statusDetails.textContent = serviceStatus.details;
        }
    }
    
    getServiceStatus(arrivals = []) {
        // Analyze arrivals data to determine service status
        const now = new Date();
        const hour = now.getHours();
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        
        // Check if we have real data
        if (arrivals && arrivals.length > 0) {
            // Analyze arrival patterns
            const recentArrivals = arrivals.filter(arrival => {
                if (arrival.epoch) {
                    const arrivalTime = new Date(arrival.epoch * 1000);
                    const timeDiff = arrivalTime.getTime() - now.getTime();
                    return timeDiff > 0 && timeDiff < 30 * 60 * 1000; // Next 30 minutes
                }
                return false;
            });
            
            if (recentArrivals.length === 0) {
                return { 
                    status: 'Service Suspended', 
                    type: 'red', 
                    details: 'No trains scheduled in the next 30 minutes' 
                };
            } else if (recentArrivals.length < 3 && isRushHour) {
                return { 
                    status: 'Reduced Service', 
                    type: 'yellow', 
                    details: 'Fewer trains than usual during rush hour' 
                };
            } else {
                return { 
                    status: 'Good Service', 
                    type: 'green', 
                    details: `${recentArrivals.length} trains arriving in next 30 minutes` 
                };
            }
        }
        
        // Fallback to simulated status based on time and station
        const statuses = [
            { status: 'Good Service', type: 'green', details: 'All trains running on schedule' },
            { status: 'Minor Delays', type: 'yellow', details: 'Some delays due to signal problems' },
            { status: 'Service Changes', type: 'yellow', details: 'Service pattern changes in effect' },
            { status: 'Major Delays', type: 'red', details: 'Significant delays due to track work' }
        ];
        
        if (isRushHour && Math.random() < 0.3) {
            return statuses[1]; // Minor delays during rush hour
        } else if (Math.random() < 0.1) {
            return statuses[2]; // Service changes
        } else if (Math.random() < 0.05) {
            return statuses[3]; // Major delays
        } else {
            return statuses[0]; // Good service
        }
    }
    
    loadCrowdInformation() {
        const crowdLevel = document.getElementById('crowdLevel');
        const crowdBar = document.getElementById('crowdBar');
        const crowdTip = document.getElementById('crowdTip');
        
        const crowdData = this.getCrowdData();
        
        if (crowdLevel) {
            crowdLevel.textContent = crowdData.level;
            crowdLevel.style.color = crowdData.color;
        }
        
        if (crowdBar) {
            crowdBar.style.width = `${crowdData.percentage}%`;
            // The linear gradient in CSS handles the color change based on width
        }
        
        if (crowdTip) {
            crowdTip.textContent = crowdData.tip;
        }
    }
    
    getCrowdData() {
        const now = new Date();
        const hour = now.getHours();
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        
        // Generate crowd level based on time and station
        let level, percentage, color, tip;
        
        if (isRushHour) {
            level = 'High Crowding';
            percentage = 85;
            color = '#ff4444';
            tip = 'Consider waiting for the next train for more space';
        } else if (hour >= 10 && hour <= 16) {
            level = 'Moderate Crowding';
            percentage = 60;
            color = '#ffaa00';
            tip = 'Normal crowd levels expected';
        } else {
            level = 'Low Crowding';
            percentage = 30;
            color = '#00ff00';
            tip = 'Plenty of space available';
        }
        
        return { level, percentage, color, tip };
    }
    
    toggleCrowdSection(show) {
        const section = document.querySelector('.crowd-section');
        if (section) {
            section.style.display = show ? 'block' : 'none';
        }
    }
    
    loadLineInformation() {
        const lineBadgeLarge = document.getElementById('lineBadgeLarge');
        const lineTitle = document.getElementById('lineTitle');
        const lineDescription = document.getElementById('lineDescription');
        const lineStats = document.getElementById('lineStats');
        
        const lineInfo = this.getLineInfo(this.currentLine); // Mock for now
        
        if (lineBadgeLarge) {
            lineBadgeLarge.textContent = lineInfo.name;
            lineBadgeLarge.className = `line-badge-large ${lineInfo.name.toLowerCase()}`;
        }
        if (lineTitle) lineTitle.textContent = lineInfo.fullName;
        if (lineDescription) lineDescription.textContent = lineInfo.description;
        
        if (lineStats) {
            lineStats.innerHTML = `
                <div class="stat-item">
                    <div class="stat-value">${lineInfo.stats.stations}</div>
                    <div class="stat-label">Stations</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${lineInfo.stats.length}</div>
                    <div class="stat-label">Length</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${lineInfo.stats.frequency}</div>
                    <div class="stat-label">Frequency</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${lineInfo.stats.ridership}</div>
                    <div class="stat-label">Daily Riders</div>
                </div>
            `;
        }
    }
    
    getLineInfo(line) {
        // Get actual station count for the line
        const lineStations = this.getLineStations(line);
        const stationCount = lineStations.length;
        
        // Mock line information with dynamic station count
        const lineData = {
            'A': {
                name: 'A',
                fullName: 'A Line Express',
                description: 'The A line provides express service from Inwood, Manhattan to Far Rockaway or Ozone Park, Queens, connecting major hubs and transfer points.',
                stats: {
                    stations: stationCount || 59,
                    length: '31 miles',
                    frequency: '5-10 min',
                    ridership: '600,000+'
                }
            },
            'G': {
                name: 'G',
                fullName: 'G Line Local',
                description: 'The G line provides local service between Queens and Brooklyn, connecting major neighborhoods and transfer points.',
                stats: {
                    stations: stationCount || 21,
                    length: '13.4 miles',
                    frequency: '6-8 min',
                    ridership: '45,000'
                }
            },
            '1': {
                name: '1',
                fullName: '1 Line Local',
                description: 'The 1 line provides local service along Broadway in Manhattan, connecting the Upper West Side to Lower Manhattan.',
                stats: {
                    stations: stationCount || 34,
                    length: '14.1 miles',
                    frequency: '4-6 min',
                    ridership: '200,000+'
                }
            },
            '2': {
                name: '2',
                fullName: '2 Line Express',
                description: 'The 2 line provides express service from the Bronx through Manhattan to Brooklyn, with major transfer points.',
                stats: {
                    stations: stationCount || 45,
                    length: '22.5 miles',
                    frequency: '3-5 min',
                    ridership: '300,000+'
                }
            },
            '3': {
                name: '3',
                fullName: '3 Line Express',
                description: 'The 3 line provides express service from Harlem through Manhattan to Brooklyn, complementing the 2 line.',
                stats: {
                    stations: stationCount || 42,
                    length: '21.2 miles',
                    frequency: '3-5 min',
                    ridership: '250,000+'
                }
            },
            '4': {
                name: '4',
                fullName: '4 Line Express',
                description: 'The 4 line provides express service from the Bronx through Manhattan to Brooklyn, with major transfer points.',
                stats: {
                    stations: stationCount || 48,
                    length: '24.3 miles',
                    frequency: '3-5 min',
                    ridership: '350,000+'
                }
            },
            '5': {
                name: '5',
                fullName: '5 Line Express',
                description: 'The 5 line provides express service from the Bronx through Manhattan to Brooklyn, complementing the 4 line.',
                stats: {
                    stations: stationCount || 45,
                    length: '23.1 miles',
                    frequency: '3-5 min',
                    ridership: '300,000+'
                }
            },
            '6': {
                name: '6',
                fullName: '6 Line Local',
                description: 'The 6 line provides local service along Lexington Avenue in Manhattan, connecting the Bronx to Lower Manhattan.',
                stats: {
                    stations: stationCount || 38,
                    length: '18.9 miles',
                    frequency: '4-6 min',
                    ridership: '400,000+'
                }
            },
            '7': {
                name: '7',
                fullName: '7 Line Express',
                description: 'The 7 line provides express service from Manhattan to Queens, connecting major neighborhoods and transfer points.',
                stats: {
                    stations: stationCount || 22,
                    length: '13.9 miles',
                    frequency: '4-6 min',
                    ridership: '180,000+'
                }
            },
            'B': {
                name: 'B',
                fullName: 'B Line Express',
                description: 'The B line provides express service from the Bronx through Manhattan to Brooklyn, with major transfer points.',
                stats: {
                    stations: stationCount || 40,
                    length: '20.8 miles',
                    frequency: '4-6 min',
                    ridership: '220,000+'
                }
            },
            'C': {
                name: 'C',
                fullName: 'C Line Local',
                description: 'The C line provides local service from Manhattan to Brooklyn, complementing the A line.',
                stats: {
                    stations: stationCount || 50,
                    length: '25.2 miles',
                    frequency: '6-8 min',
                    ridership: '180,000+'
                }
            },
            'D': {
                name: 'D',
                fullName: 'D Line Express',
                description: 'The D line provides express service from the Bronx through Manhattan to Brooklyn, with major transfer points.',
                stats: {
                    stations: stationCount || 42,
                    length: '21.8 miles',
                    frequency: '4-6 min',
                    ridership: '240,000+'
                }
            },
            'E': {
                name: 'E',
                fullName: 'E Line Express',
                description: 'The E line provides express service from Manhattan to Queens, connecting major neighborhoods and transfer points.',
                stats: {
                    stations: stationCount || 32,
                    length: '16.2 miles',
                    frequency: '4-6 min',
                    ridership: '200,000+'
                }
            },
            'F': {
                name: 'F',
                fullName: 'F Line Express',
                description: 'The F line provides express service from Manhattan to Queens and Brooklyn, with major transfer points.',
                stats: {
                    stations: stationCount || 45,
                    length: '22.8 miles',
                    frequency: '4-6 min',
                    ridership: '280,000+'
                }
            },
            'J': {
                name: 'J',
                fullName: 'J Line Express',
                description: 'The J line provides express service from Manhattan to Brooklyn and Queens, connecting major neighborhoods.',
                stats: {
                    stations: stationCount || 25,
                    length: '12.8 miles',
                    frequency: '6-8 min',
                    ridership: '120,000+'
                }
            },
            'L': {
                name: 'L',
                fullName: 'L Line Local',
                description: 'The L line provides local service from Manhattan to Brooklyn, connecting major neighborhoods.',
                stats: {
                    stations: stationCount || 24,
                    length: '12.1 miles',
                    frequency: '4-6 min',
                    ridership: '150,000+'
                }
            },
            'M': {
                name: 'M',
                fullName: 'M Line Local',
                description: 'The M line provides local service from Manhattan to Queens and Brooklyn, connecting major neighborhoods.',
                stats: {
                    stations: stationCount || 28,
                    length: '14.3 miles',
                    frequency: '6-8 min',
                    ridership: '100,000+'
                }
            },
            'N': {
                name: 'N',
                fullName: 'N Line Express',
                description: 'The N line provides express service from Manhattan to Brooklyn and Queens, with major transfer points.',
                stats: {
                    stations: stationCount || 35,
                    length: '18.2 miles',
                    frequency: '4-6 min',
                    ridership: '200,000+'
                }
            },
            'Q': {
                name: 'Q',
                fullName: 'Q Line Express',
                description: 'The Q line provides express service from Manhattan to Brooklyn and Queens, with major transfer points.',
                stats: {
                    stations: stationCount || 38,
                    length: '19.8 miles',
                    frequency: '4-6 min',
                    ridership: '220,000+'
                }
            },
            'R': {
                name: 'R',
                fullName: 'R Line Local',
                description: 'The R line provides local service from Manhattan to Brooklyn and Queens, connecting major neighborhoods.',
                stats: {
                    stations: stationCount || 42,
                    length: '21.5 miles',
                    frequency: '6-8 min',
                    ridership: '180,000+'
                }
            },
            'W': {
                name: 'W',
                fullName: 'W Line Local',
                description: 'The W line provides local service from Manhattan to Queens, connecting major neighborhoods.',
                stats: {
                    stations: stationCount || 22,
                    length: '11.2 miles',
                    frequency: '6-8 min',
                    ridership: '80,000+'
                }
            }
        };
        return lineData[line] || {
            name: line,
            fullName: `${line} Line`,
            description: `The ${line} line provides subway service connecting various neighborhoods and transfer points.`,
            stats: {
                stations: stationCount || 20,
                length: '10+ miles',
                frequency: '5-10 min',
                ridership: '50,000+'
            }
        };
    }
    
    startRealTimeUpdates() {
        // Update every 30 seconds
        this.updateInterval = setInterval(() => {
            this.loadTrainArrival();
            this.loadServiceStatus();
        }, 30000);
    }
    
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    showError(message) {
        console.error('Train Details Error:', message);
        // Could show user-friendly error message here
    }
    
    goBack() {
        this.stopRealTimeUpdates();
        window.history.back();
    }
}

// Global functions
function goBack() {
    if (window.trainDetails) {
        window.trainDetails.goBack();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.trainDetails = new TrainDetails();
});