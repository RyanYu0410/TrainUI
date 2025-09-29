import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Route for home page
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// Route for train details page
app.get("/train-details", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "train-details.html"));
});

// Route for route results page

// Route for G train arrivals (original functionality)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const G_FEED_URL = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g";

// G train stop ID to station name mapping
const G_STATION_NAMES = {
  // G Line stops (Court Square to Church Avenue)
  "G21": "Court Square",
  "G22": "21st Street",
  "G24": "Greenpoint Avenue",
  "G15": "Nassau Av",
  "G09": "Broadway",
  "G20": "Greenpoint Av",
  "G19": "Metropolitan Av",
  "G10": "Flushing Av",
  "G14": "Myrtle-Willoughby Avs",
  "G11": "Myrtle-Willoughby Avs",
  "G13": "Myrtle-Willoughby Avs",
  "G18": "Metropolitan Av",
  "G26": "Nassau Avenue",
  "G28": "Metropolitan Avenue",
  "G29": "Broadway",
  "G30": "Flushing Avenue",
  "G31": "Myrtle–Willoughby Avenues",
  "G32": "Bedford–Nostrand Avenues",
  "G33": "Classon Avenue",
  "G34": "Clinton–Washington Avenues",
  "G35": "Fulton Street",
  "G36": "Hoyt–Schermerhorn Streets",
  "G38": "Bergen Street",
  "G39": "Carroll Street",
  "G40": "Smith–9th Streets",
  "G41": "4th Avenue–9th Street",
  "G42": "7th Avenue",
  "G43": "15th Street–Prospect Park",
  "G44": "Fort Hamilton Parkway",
  "G45": "Church Avenue",
  
  // F Line stops (that connect with G train)
  "F20": "Jay St–MetroTech",
  "F21": "Bergen St",
  "F22": "Carroll St",
  "F23": "Smith–9th Sts",
  "F24": "4th Av–9th St",
  "F25": "7th Av",
  "F26": "15th St–Prospect Park",
  "F27": "Fort Hamilton Pkwy",
  
  // A Line stops (that connect with G train)
  "A42": "Hoyt–Schermerhorn Sts"
};

function toLocalISO(epoch) {
  if (!epoch) return null;
  const d = new Date(epoch * 1000);
  return d.toLocaleString();
}

function formatArrivalTime(epoch) {
  if (!epoch) return null;
  const now = new Date();
  const arrivalTime = new Date(epoch * 1000);
  const diffMs = arrivalTime.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  
  if (diffMinutes <= 0) {
    return 'Now';
  } else if (diffMinutes === 1) {
    return '1 min';
  } else {
    return `${diffMinutes} min`;
  }
}

// API endpoint for station search
app.get("/api/stations", (req, res) => {
  const stations = [
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
  
  // Filter stations by query if provided
  const { q } = req.query;
  let filteredStations = stations;
  
  if (q && q.trim()) {
    const query = q.toLowerCase().trim();
    filteredStations = stations.filter(station => 
      station.name.toLowerCase().includes(query) ||
      station.borough.toLowerCase().includes(query) ||
      station.lines.some(line => line.toLowerCase().includes(query))
    );
  }
  
  res.json({ stations: filteredStations });
});

// API endpoint for route planning with real-time data
app.get("/api/route-planning", async (req, res) => {
  const { from, to } = req.query;
  
  if (!from || !to) {
    return res.status(400).json({ error: "Missing from or to parameters" });
  }

  try {
    // Get real-time data for all lines to calculate better routes
    const routeData = {};
    
    // Fetch data for major lines
    const lines = ['G', '1', '2', '3', '4', '5', '6', '7', 'A', 'B', 'C', 'D', 'E', 'F', 'J', 'L', 'M', 'N', 'Q', 'R', 'W'];
    
    for (const line of lines) {
      try {
        const feedUrl = MTA_FEEDS[line];
        const data = await fetchArrivalsForLine(line, feedUrl);
        routeData[line] = data.arrivals || [];
      } catch (error) {
        console.log(`Could not fetch data for ${line} line:`, error.message);
        routeData[line] = [];
      }
    }

    // Calculate routes with real-time data
    const routes = calculateRoutesWithRealTimeData(from, to, routeData);
    
    res.json({
      from,
      to,
      routes,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Route planning error:', error);
    res.status(500).json({ error: "Failed to calculate routes" });
  }
});

function calculateRoutesWithRealTimeData(from, to, routeData) {
  // Enhanced route calculation with real-time data and fallbacks
  const routes = [];
  
  // Find stations that match the from/to parameters
  const fromStation = findStationByName(from);
  const toStation = findStationByName(to);
  
  if (!fromStation || !toStation) {
    console.log(`Could not find stations: from="${from}", to="${to}"`);
    return routes;
  }
  
  console.log(`Found stations: from="${fromStation.name}", to="${toStation.name}"`);
  
  // Direct route
  const commonLines = fromStation.lines.filter(line => toStation.lines.includes(line));
  if (commonLines.length > 0) {
    const line = commonLines[0];
    const arrivals = routeData[line] || [];
    const nextArrival = findNextArrival(arrivals, fromStation.name);
    
    routes.push({
      type: 'direct',
      lines: [line],
      totalTime: calculateDirectTime(fromStation, toStation, line),
      nextArrival: nextArrival,
      steps: [
        { station: fromStation.name, line, time: 'Now', highlight: true },
        { station: toStation.name, line, time: calculateDirectTime(fromStation, toStation, line) }
      ],
      transfers: 0
    });
  }
  
  // Transfer routes
  for (const startLine of fromStation.lines) {
    for (const endLine of toStation.lines) {
      if (startLine !== endLine) {
        const transferStation = findTransferStation(startLine, endLine);
        if (transferStation) {
          const startArrivals = routeData[startLine] || [];
          const endArrivals = routeData[endLine] || [];
          const nextStartArrival = findNextArrival(startArrivals, fromStation.name);
          
          routes.push({
            type: 'transfer',
            lines: [startLine, endLine],
            totalTime: calculateTransferTime(fromStation, transferStation, toStation, startLine, endLine),
            nextArrival: nextStartArrival,
            steps: [
              { station: fromStation.name, line: startLine, time: 'Now', highlight: true },
              { station: transferStation.name, line: startLine, time: calculateDirectTime(fromStation, transferStation, startLine) },
              { station: transferStation.name, line: endLine, time: 'Transfer', highlight: true },
              { station: toStation.name, line: endLine, time: calculateDirectTime(transferStation, toStation, endLine) }
            ],
            transfers: 1
          });
        }
      }
    }
  }
  
        // If no routes found with real-time data, generate fallback routes
        if (routes.length === 0) {
            console.log('No real-time routes found, generating fallback routes');
            
            // Direct route fallback
            const commonLines = fromStation.lines.filter(line => toStation.lines.includes(line));
            if (commonLines.length > 0) {
                const line = commonLines[0];
                routes.push({
                    type: 'direct',
                    lines: [line],
                    totalTime: calculateDirectTime(fromStation, toStation, line),
                    nextArrival: 'Check schedule',
                    steps: [
                        { station: fromStation.name, line, time: 'Now', highlight: true },
                        { station: toStation.name, line, time: calculateDirectTime(fromStation, toStation, line) }
                    ],
                    transfers: 0
                });
            }
            
            // Transfer route fallback
            if (routes.length === 0) {
                const transferStation = findTransferStation(fromStation.lines[0], toStation.lines[0]);
                if (transferStation) {
                    routes.push({
                        type: 'transfer',
                        lines: [fromStation.lines[0], toStation.lines[0]],
                        totalTime: calculateTransferTime(fromStation, toStation, transferStation),
                        nextArrival: 'Check schedule',
                        steps: [
                            { station: fromStation.name, line: fromStation.lines[0], time: 'Now', highlight: true },
                            { station: transferStation.name, line: fromStation.lines[0], time: '8 min' },
                            { station: transferStation.name, line: toStation.lines[0], time: 'Transfer', highlight: true },
                            { station: toStation.name, line: toStation.lines[0], time: calculateTransferTime(fromStation, toStation, transferStation) }
                        ],
                        transfers: 1
                    });
                }
            }
            
            // If still no routes found, return empty array to show "sorry" message
            if (routes.length === 0) {
                console.log('No fallback routes found, returning empty routes array');
                return [];
            }
        }
  
  return routes.sort((a, b) => a.totalTime - b.totalTime).slice(0, 3);
}

function findStationByName(name) {
  // Use the same station data as the /api/stations endpoint
  const stations = [
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
    { name: "Atlantic Avenue–Barclays Center", lines: ["2", "3", "4", "5", "B", "D", "N", "Q", "R"], borough: "Brooklyn" },
    { name: "Jay Street–MetroTech", lines: ["A", "C", "F", "R"], borough: "Brooklyn" },
    { name: "DeKalb Avenue", lines: ["B", "Q", "R"], borough: "Brooklyn" },
    { name: "Prospect Park", lines: ["B", "Q", "S"], borough: "Brooklyn" },
    { name: "Brighton Beach", lines: ["B", "Q"], borough: "Brooklyn" },
    { name: "Coney Island–Stillwell Avenue", lines: ["D", "F", "N", "Q"], borough: "Brooklyn" },
    { name: "Jackson Heights–Roosevelt Avenue", lines: ["7", "E", "F", "M", "R"], borough: "Queens" },
    { name: "Queens Plaza", lines: ["E", "M", "R"], borough: "Queens" },
    { name: "74th Street–Broadway", lines: ["7", "E", "F", "M", "R"], borough: "Queens" },
    { name: "Flushing–Main Street", lines: ["7"], borough: "Queens" },
    { name: "Jamaica Center–Parsons/Archer", lines: ["E", "J", "Z"], borough: "Queens" },
    { name: "Yankees–East 161st Street", lines: ["4", "B", "D"], borough: "Bronx" },
    { name: "Fordham Road", lines: ["4", "B", "D"], borough: "Bronx" },
    { name: "Pelham Bay Park", lines: ["6"], borough: "Bronx" },
    { name: "World Trade Center", lines: ["E"], borough: "Manhattan" },
    { name: "South Ferry", lines: ["1"], borough: "Manhattan" },
    { name: "Battery Park", lines: ["4", "5"], borough: "Manhattan" },
    { name: "High Street–Brooklyn Bridge", lines: ["A", "C"], borough: "Brooklyn" },
    { name: "Astoria–Ditmars Boulevard", lines: ["N", "W"], borough: "Queens" },
    { name: "Rockaway Park–Beach 116th Street", lines: ["A", "S"], borough: "Queens" }
  ];
  
  // First try exact match
  let station = stations.find(s => s.name === name);
  if (station) return station;
  
  // Then try case-insensitive match
  station = stations.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (station) return station;
  
  // Then try partial match (contains)
  station = stations.find(s => s.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(s.name.toLowerCase()));
  if (station) return station;
  
  // Finally try fuzzy matching for common variations
  const normalizedName = name.toLowerCase()
    .replace(/[–-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
    
  station = stations.find(s => {
    const normalizedStationName = s.name.toLowerCase()
      .replace(/[–-]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    return normalizedStationName === normalizedName;
  });
  
  return station;
}

function findTransferStation(line1, line2) {
  const stations = [
    { name: "Times Square–42nd Street", lines: ["1", "2", "3", "7", "N", "Q", "R", "W"] },
    { name: "Union Square–14th Street", lines: ["4", "5", "6", "L", "N", "Q", "R", "W"] },
    { name: "Hoyt–Schermerhorn Streets", lines: ["G", "A", "C"] },
    { name: "Atlantic Avenue–Barclays Center", lines: ["2", "3", "4", "5", "B", "D", "N", "Q", "R"] }
  ];
  
  return stations.find(station => 
    station.lines.includes(line1) && station.lines.includes(line2)
  );
}

function findNextArrival(arrivals, stationName) {
  const stationArrivals = arrivals.filter(arrival => 
    arrival.stationName && arrival.stationName.includes(stationName.split('–')[0])
  );
  
  if (stationArrivals.length > 0) {
    return stationArrivals[0].arrivalTime || '5 min';
  }
  
  return '5 min'; // Default fallback
}

function calculateDirectTime(station1, station2, line) {
  return '12 min';
}

function calculateTransferTime(station1, transfer, station2, line1, line2) {
  return '18 min';
}

// Load global ridership data once
async function loadGlobalRidershipData() {
  const now = Date.now();
  
  // Check if we have fresh global data
  if (globalRidershipData && (now - globalRidershipDataTimestamp) < GLOBAL_RIDERSHIP_CACHE_DURATION) {
    return globalRidershipData;
  }

  try {
    console.log('Loading global ridership data from NYC API...');
    
    const apiUrl = `https://data.ny.gov/resource/wujg-7c2s.json?transit_mode=subway&$limit=10000`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'X-App-Token': NYC_APP_TOKEN,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`NYC API responded ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No ridership data received from API');
    }

    // Process and index the data by station
    const stationIndex = new Map();
    
    for (const record of data) {
      if (!record.station_complex || !record.ridership) continue;
      
      // Clean station name by removing line information in parentheses
      let stationName = record.station_complex.toLowerCase().trim();
      stationName = stationName.replace(/\s*\([^)]*\)\s*$/, '').trim(); // Remove (J,Z) etc.
      stationName = stationName.replace(/\s*\/[^\/]*$/, '').trim(); // Remove /Bleecker St (6) etc.
      
      const ridership = parseFloat(record.ridership);
      
      if (isNaN(ridership)) continue;
      
      if (!stationIndex.has(stationName)) {
        stationIndex.set(stationName, []);
      }
      stationIndex.get(stationName).push(ridership);
    }

    // Calculate averages for each station
    const processedData = new Map();
    for (const [stationName, ridershipValues] of stationIndex.entries()) {
      if (ridershipValues.length === 0) continue;
      
      const total = ridershipValues.reduce((sum, val) => sum + val, 0);
      const average = Math.round(total / ridershipValues.length);
      
      processedData.set(stationName, {
        averageRidership: average,
        dataPoints: ridershipValues.length,
        lastUpdated: new Date().toISOString()
      });
    }

    globalRidershipData = processedData;
    globalRidershipDataTimestamp = now;
    
    console.log(`Loaded ridership data for ${processedData.size} stations`);
    
    // Log some sample station names for debugging
    const sampleStations = Array.from(processedData.keys()).slice(0, 10);
    console.log('Sample station names in dataset:', sampleStations);
    
    return processedData;

  } catch (error) {
    console.error('Error loading global ridership data:', error);
    return null;
  }
}

// Ridership data functions
async function fetchRidershipData(stationName, lineId) {
  const cacheKey = `${stationName}_${lineId}`;
  const now = Date.now();
  
  // Check cache first
  if (ridershipCache.has(cacheKey)) {
    const cached = ridershipCache.get(cacheKey);
    if (now - cached.timestamp < RIDERSHIP_CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    // Load global data if not available
    const globalData = await loadGlobalRidershipData();
    if (!globalData) {
      return { averageRidership: 0, dataPoints: 0, confidence: 'error', error: 'Failed to load ridership data' };
    }

    // Clean station name for matching
    const cleanStationName = stationName.replace(/[–-]/g, '-').replace(/\s+/g, ' ').toLowerCase().trim();
    
    // Also try variations of the station name
    const searchVariations = [
      cleanStationName,
      cleanStationName.replace(/\s+st\b/g, ' street'),
      cleanStationName.replace(/\s+av\b/g, ' avenue'),
      cleanStationName.replace(/\s+blvd\b/g, ' boulevard'),
      cleanStationName.replace(/\s+sq\b/g, ' square'),
      cleanStationName.replace(/\s+street\b/g, ' st'),
      cleanStationName.replace(/\s+avenue\b/g, ' av'),
      cleanStationName.replace(/\s+boulevard\b/g, ' blvd'),
      cleanStationName.replace(/\s+square\b/g, ' sq'),
      // Handle specific problematic cases
      cleanStationName.replace(/\s+avenues?\b/g, ' avs'),
      cleanStationName.replace(/\s+avs\b/g, ' avenues'),
      // Handle numbered streets
      cleanStationName.replace(/(\d+)(st|nd|rd|th)\b/g, '$1 $2'),
      cleanStationName.replace(/(\d+)\s+(st|nd|rd|th)\b/g, '$1$2')
    ];
    
    // Try to find matching station data with improved matching
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [recordStation, data] of globalData.entries()) {
      let score = 0;
      
      // Try each variation of the search term
      for (const searchTerm of searchVariations) {
        // Exact match
        if (recordStation === searchTerm) {
          score = Math.max(score, 100);
        }
        // Contains match
        else if (recordStation.includes(searchTerm) || searchTerm.includes(recordStation)) {
          score = Math.max(score, 80);
        }
        // Handle complex station names with multiple lines (e.g., "14 St (A,C,E)/8 Av (L)")
        else if (recordStation.includes('/') && recordStation.split('/').some(part => part.includes(searchTerm))) {
          score = Math.max(score, 75);
        }
        // Handle station names with line information in parentheses
        else if (recordStation.includes('(') && recordStation.split('(')[0].trim().includes(searchTerm)) {
          score = Math.max(score, 70);
        }
        // Word-based matching with improved logic
        else {
          const recordWords = recordStation.split(/[\s\-–]+/).filter(w => w.length > 0);
          const searchWords = searchTerm.split(/[\s\-–]+/).filter(w => w.length > 0);
          
          let matchingWords = 0;
          let totalWords = Math.max(recordWords.length, searchWords.length);
          
          for (const searchWord of searchWords) {
            for (const recordWord of recordWords) {
              // Exact word match
              if (recordWord === searchWord) {
                matchingWords += 2;
              }
              // Partial word match
              else if (recordWord.includes(searchWord) || searchWord.includes(recordWord)) {
                matchingWords += 1;
              }
              // Handle common abbreviations and variations
              else if (
              (searchWord === 'st' && recordWord === 'street') ||
              (searchWord === 'street' && recordWord === 'st') ||
              (searchWord === 'av' && recordWord === 'avenue') ||
              (searchWord === 'avenue' && recordWord === 'av') ||
              (searchWord === 'avs' && recordWord === 'avenues') ||
              (searchWord === 'avenues' && recordWord === 'avs') ||
              (searchWord === 'blvd' && recordWord === 'boulevard') ||
              (searchWord === 'boulevard' && recordWord === 'blvd') ||
              (searchWord === 'sq' && recordWord === 'square') ||
              (searchWord === 'square' && recordWord === 'sq') ||
              // Handle numbered streets
              (searchWord.match(/^\d+$/) && recordWord.match(/^\d+$/)) ||
              // Handle specific cases like "14th" vs "14"
              (searchWord.replace(/\D/g, '') === recordWord.replace(/\D/g, ''))
            ) {
              matchingWords += 1.5;
            }
          }
        }
          
          score = Math.max(score, (matchingWords / totalWords) * 70);
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = data;
      }
    }

    let result;
    if (bestMatch && bestScore >= 25) { // Lowered threshold for better coverage
      result = {
        ...bestMatch,
        stationName: cleanStationName,
        matchScore: bestScore
      };
    } else {
      result = { 
        averageRidership: 0, 
        dataPoints: 0, 
        confidence: 'low',
        stationName: cleanStationName,
        matchScore: bestScore
      };
    }

    // Cache the result
    ridershipCache.set(cacheKey, {
      data: result,
      timestamp: now
    });

    return result;

  } catch (error) {
    console.error(`Error fetching ridership data for ${stationName}:`, error);
    
    // Return cached data if available
    if (ridershipCache.has(cacheKey)) {
      const cached = ridershipCache.get(cacheKey);
      return {
        ...cached.data,
        confidence: 'stale'
      };
    }
    
    return { averageRidership: 0, dataPoints: 0, confidence: 'error', error: error.message };
  }
}

// Function to get ridership for a specific station and line combination
async function getStationRidership(stationName, lineId) {
  // Try exact station name first
  let ridership = await fetchRidershipData(stationName, lineId);
  
  // If no data found, try variations of the station name
  if (ridership.dataPoints === 0) {
    const variations = [
      stationName.replace(/–/g, '-'),
      stationName.replace(/-/g, '–'),
      stationName.split('–')[0].trim(),
      stationName.split('-')[0].trim()
    ];
    
    for (const variation of variations) {
      if (variation !== stationName) {
        ridership = await fetchRidershipData(variation, lineId);
        if (ridership.dataPoints > 0) {
          break;
        }
      }
    }
  }
  
  return ridership;
}

// MTA API Feed URLs - These are the actual working feeds
const MTA_FEEDS = {
  // Individual line feeds (these work reliably)
  'G': process.env.MTA_G_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g",
  'L': process.env.MTA_L_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l",
  
  // Combined feeds (contains numbered routes 1-7 and some express variants)
  '1': process.env.MTA_1_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
  '2': process.env.MTA_2_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
  '3': process.env.MTA_3_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
  '4': process.env.MTA_4_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
  '5': process.env.MTA_5_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
  '6': process.env.MTA_6_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
  '7': process.env.MTA_7_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
  
  // Letter routes - now using proper dedicated feeds
  'A': process.env.MTA_A_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
  'C': process.env.MTA_C_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
  'E': process.env.MTA_E_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
  'B': process.env.MTA_B_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
  'D': process.env.MTA_D_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
  'F': process.env.MTA_F_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
  'M': process.env.MTA_M_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
  'J': process.env.MTA_J_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz",
  'Z': process.env.MTA_Z_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz",
  'N': process.env.MTA_N_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
  'Q': process.env.MTA_Q_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
  'R': process.env.MTA_R_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
  'W': process.env.MTA_W_FEED_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw"
};

// Enhanced station name mapping for all lines
const ALL_STATION_NAMES = {
  ...G_STATION_NAMES,
  
  // 1, 2, 3 Lines (Broadway-7th Avenue)
  "101": "South Ferry",
  "103": "Rector St",
  "104": "Cortlandt St",
  "106": "Chambers St",
  "107": "Canal St",
  "108": "Franklin St",
  "109": "Houston St",
  "110": "Christopher St-Sheridan Sq",
  "111": "14th St",
  "112": "18th St",
  "113": "23rd St",
  "114": "28th St",
  "115": "34th St-Penn Station",
  "116": "Times Sq-42nd St",
  "117": "50th St",
  "118": "59th St-Columbus Circle",
  "119": "66th St-Lincoln Center",
  "120": "72nd St",
  "121": "79th St",
  "122": "86th St",
  "123": "96th St",
  "124": "103rd St",
  "125": "110th St-Cathedral Pkwy",
  "126": "116th St-Columbia University",
  "127": "125th St",
  "128": "137th St-City College",
  "129": "145th St",
  "130": "157th St",
  "131": "168th St-Washington Hts",
  "132": "181st St",
  "133": "191st St",
  "134": "Dyckman St",
  "135": "207th St",
  "136": "215th St",
  "137": "225th St",
  "138": "231st St",
  "139": "238th St",
  "142": "Van Cortlandt Park-242nd St",
  
  // 4, 5, 6 Lines (Lexington Avenue)
  "401": "Bowling Green",
  "402": "Borough Hall",
  "406": "Brooklyn Bridge-City Hall",
  "408": "Fulton St",
  "410": "Wall St",
  "412": "Rector St",
  "414": "Cortlandt St",
  "416": "Chambers St",
  "418": "Canal St",
  "420": "Spring St",
  "422": "Bleecker St",
  "423": "Astor Pl",
  "424": "Union Sq-14th St",
  "425": "23rd St",
  "426": "28th St",
  "427": "33rd St",
  "428": "Grand Central-42nd St",
  "429": "51st St",
  "430": "59th St-Lexington Av",
  "431": "68th St-Hunter College",
  "432": "77th St",
  "433": "86th St",
  "434": "96th St",
  "436": "103rd St",
  "437": "110th St",
  "438": "116th St",
  "439": "125th St",
  "440": "138th St-Grand Concourse",
  "441": "149th St-Grand Concourse",
  "442": "161st St-Yankee Stadium",
  "445": "170th St",
  "449": "Burnside Av",
  "451": "183rd St",
  "455": "Fordham Rd",
  "456": "182nd-183rd Sts",
  "458": "Tremont Av",
  "460": "174th-175th Sts",
  "462": "170th St",
  "464": "167th St",
  "465": "161st St-Yankee Stadium",
  "466": "155th St",
  "468": "145th St",
  "469": "135th St",
  "470": "125th St",
  "471": "116th St",
  "472": "110th St",
  "473": "103rd St",
  "474": "96th St",
  "475": "86th St",
  "476": "77th St",
  "477": "68th St-Hunter College",
  "478": "59th St-Lexington Av",
  "479": "51st St",
  "480": "Grand Central-42nd St",
  "481": "33rd St",
  "482": "28th St",
  "483": "23rd St",
  "484": "Union Sq-14th St",
  "485": "Astor Pl",
  "486": "Bleecker St",
  "487": "Spring St",
  "488": "Canal St",
  "489": "Brooklyn Bridge-City Hall",
  "490": "Fulton St",
  "491": "Wall St",
  "492": "Bowling Green",
  
  // 7 Line (Flushing)
  "701": "Flushing-Main St",
  "702": "Mets-Willets Point",
  "705": "111th St",
  "706": "103rd St-Corona Plaza",
  "707": "Junction Blvd",
  "708": "90th St-Elmhurst Av",
  "709": "82nd St-Jackson Hts",
  "710": "74th St-Broadway",
  "711": "69th St-Fisk Av",
  "712": "61st St-Woodside",
  "713": "52nd St",
  "714": "46th St-Bliss St",
  "715": "40th St-Lowery St",
  "716": "33rd St-Rawson St",
  "718": "Queensboro Plaza",
  "719": "Court Sq-23rd St",
  "720": "Hunters Point Av",
  "721": "Vernon Blvd-Jackson Av",
  "722": "Grand Central-42nd St",
  "723": "5th Av",
  "724": "Times Sq-42nd St",
  "725": "34th St-Hudson Yards",
  "726": "28th St",
  
  // 2, 3 Lines (Broadway-7th Avenue Express)
  "201": "Wakefield-241st St",
  "202": "Nereid Av",
  "203": "233rd St",
  "204": "225th St",
  "205": "219th St",
  "206": "Gun Hill Rd",
  "207": "Burke Av",
  "208": "Allerton Av",
  "209": "Pelham Pkwy",
  "210": "Bronx Park East",
  "211": "E 180th St",
  "212": "West Farms Sq-E Tremont Av",
  "213": "174th St",
  "214": "Freeman St",
  "215": "Simpson St",
  "216": "Intervale Av",
  "217": "Prospect Av",
  "218": "Jackson Av",
  "219": "3rd Av-149th St",
  "220": "149th St-Grand Concourse",
  "221": "135th St",
  "222": "125th St",
  "223": "116th St",
  "224": "Central Park North-110th St",
  "225": "96th St",
  "226": "72nd St",
  "227": "Times Sq-42nd St",
  "228": "14th St",
  "229": "Chambers St",
  "230": "Park Pl",
  "231": "Fulton St",
  "232": "Wall St",
  "233": "Clark St",
  "234": "Borough Hall",
  "235": "Hoyt St",
  "236": "Nevins St",
  "237": "Atlantic Av-Barclays Center",
  "238": "Bergen St",
  "239": "Grand Army Plaza",
  "240": "Eastern Pkwy-Brooklyn Museum",
  "241": "Franklin Av-Medgar Evers College",
  "242": "Nostrand Av",
  "243": "Kingston Av",
  "244": "Crown Hts-Utica Av",
  "245": "Sutter Av-Rutland Rd",
  "246": "Saratoga Av",
  "247": "Rockaway Av",
  "248": "Junius St",
  "249": "Pennsylvania Av",
  "250": "Van Siclen Av",
  "251": "New Lots Av",
  
  // 3 Line (Broadway-7th Avenue Express)
  "301": "Harlem-148th St",
  "302": "145th St",
  "303": "135th St",
  "304": "125th St",
  "305": "116th St",
  "306": "Central Park North-110th St",
  "307": "96th St",
  "308": "72nd St",
  "309": "Times Sq-42nd St",
  "310": "14th St",
  "311": "Chambers St",
  "312": "Park Pl",
  "313": "Fulton St",
  "314": "Wall St",
  "315": "Clark St",
  "316": "Borough Hall",
  "317": "Hoyt St",
  "318": "Nevins St",
  "319": "Atlantic Av-Barclays Center",
  "320": "Bergen St",
  "321": "Grand Army Plaza",
  "322": "Eastern Pkwy-Brooklyn Museum",
  "323": "Franklin Av-Medgar Evers College",
  "324": "Nostrand Av",
  "325": "Kingston Av",
  "326": "Crown Hts-Utica Av",
  "327": "Sutter Av-Rutland Rd",
  "328": "Saratoga Av",
  "329": "Rockaway Av",
  "330": "Junius St",
  "331": "Pennsylvania Av",
  "332": "Van Siclen Av",
  "333": "New Lots Av",
  
  // A, C, E Lines (8th Avenue)
  "A01": "Inwood-207th St",
  "A02": "Dyckman St",
  "A03": "190th St",
  "A05": "181st St",
  "A06": "175th St",
  "A07": "168th St",
  "A09": "163rd St-Amsterdam Av",
  "A10": "155th St",
  "A11": "145th St",
  "A12": "135th St",
  "A14": "125th St",
  "A15": "116th St",
  "A16": "110th St-Cathedral Pkwy",
  "A17": "103rd St",
  "A18": "96th St",
  "A19": "86th St",
  "A20": "81st St-Museum of Natural History",
  "A21": "72nd St",
  "A22": "59th St-Columbus Circle",
  "A24": "50th St",
  "A25": "42nd St-Port Authority Bus Terminal",
  "A27": "34th St-Penn Station",
  "A28": "23rd St",
  "A30": "14th St",
  "A31": "W 4th St-Wash Sq",
  "A32": "Spring St",
  "A33": "Canal St",
  "A34": "Chambers St",
  "A36": "Fulton St",
  "A38": "High St",
  "A40": "Jay St-MetroTech",
  "A41": "Hoyt-Schermerhorn Sts",
  "A42": "Hoyt-Schermerhorn Sts",
  "A43": "Nostrand Av",
  "A44": "Kingston-Throop Avs",
  "A45": "Utica Av",
  "A46": "Ralph Av",
  "A47": "Rockaway Av",
  "A48": "Broadway Junction",
  "A49": "Liberty Av",
  "A50": "Van Siclen Av",
  "A51": "Shepherd Av",
  "A52": "Euclid Av",
  "A53": "Grant Av",
  "A54": "80th St",
  "A55": "88th St",
  "A57": "Rockaway Blvd",
  "A59": "104th St",
  "A60": "111th St",
  "A61": "Ozone Park-Lefferts Blvd",
  "A63": "Aqueduct-North Conduit Av",
  "A65": "Aqueduct Racetrack",
  "A71": "Howard Beach-JFK Airport",
  "A72": "Broad Channel",
  "A74": "Beach 67th St",
  "A75": "Beach 60th St",
  "A76": "Beach 44th St",
  "A77": "Beach 36th St",
  "A78": "Beach 25th St",
  "A79": "Far Rockaway-Mott Av",
  
  // C Line (8th Avenue Local)
  "C01": "168th St",
  "C02": "163rd St-Amsterdam Av",
  "C03": "155th St",
  "C04": "145th St",
  "C05": "135th St",
  "C06": "125th St",
  "C07": "116th St",
  "C08": "110th St-Cathedral Pkwy",
  "C09": "103rd St",
  "C10": "96th St",
  "C11": "86th St",
  "C12": "81st St-Museum of Natural History",
  "C13": "72nd St",
  "C14": "59th St-Columbus Circle",
  "C15": "50th St",
  "C16": "42nd St-Port Authority Bus Terminal",
  "C17": "34th St-Penn Station",
  "C18": "23rd St",
  "C19": "14th St",
  "C20": "W 4th St-Wash Sq",
  "C21": "Spring St",
  "C22": "Canal St",
  "C23": "Chambers St",
  "C24": "Fulton St",
  "C25": "High St",
  "C26": "Jay St-MetroTech",
  "C27": "Hoyt-Schermerhorn Sts",
  "C28": "Nostrand Av",
  "C29": "Kingston-Throop Avs",
  "C30": "Utica Av",
  "C31": "Ralph Av",
  "C32": "Rockaway Av",
  "C33": "Broadway Junction",
  "C34": "Liberty Av",
  "C35": "Van Siclen Av",
  "C36": "Shepherd Av",
  "C37": "Euclid Av",
  "C38": "Grant Av",
  "C39": "80th St",
  "C40": "88th St",
  "C41": "Rockaway Blvd",
  "C42": "104th St",
  "C43": "111th St",
  "C44": "Ozone Park-Lefferts Blvd",
  
  // E Line (8th Avenue Local)
  "E01": "Jamaica Center-Parsons/Archer",
  "E02": "Sutphin Blvd-Archer Av-JFK Airport",
  "E03": "Jamaica-Van Wyck",
  "E04": "Briarwood-Van Wyck Blvd",
  "E05": "Kew Gardens-Union Tpke",
  "E06": "75th Av",
  "E07": "Forest Hills-71st Av",
  "E08": "Jackson Hts-Roosevelt Av",
  "E09": "Northern Blvd",
  "E10": "46th St",
  "E11": "Steinway St",
  "E12": "36th St",
  "E13": "Queens Plaza",
  "E14": "Court Sq-23rd St",
  "E15": "Lexington Av-53rd St",
  "E16": "5th Av-53rd St",
  "E17": "7th Av",
  "E18": "50th St",
  "E19": "23rd St",
  "E20": "Spring St",
  "E21": "Canal St",
  "E22": "World Trade Center",
  
  // H Line (Rockaway Shuttle)
  "H01": "Broad Channel",
  "H02": "Beach 90th St",
  "H03": "Beach 98th St",
  "H04": "Beach 105th St",
  "H05": "Rockaway Park-Beach 116th St",
  "H06": "Beach 67th St",
  
  // Shared stations between B, D, F, M lines (these are the actual B line stops)
  "R30": "47th-50th Sts-Rockefeller Center", // B line shares this with R line
  
  // B, D, F, M Lines (6th Avenue)
  "B04": "Bedford Park Blvd-Lehman College",
  "B06": "Kingsbridge Rd",
  "B08": "Fordham Rd",
  "B10": "182nd-183rd Sts",
  "B11": "Tremont Av",
  "B12": "174th-175th Sts",
  "B13": "170th St",
  "B14": "167th St",
  "B15": "161st St-Yankee Stadium",
  "B16": "155th St",
  "B17": "145th St",
  "B18": "135th St",
  "B19": "125th St",
  "B20": "116th St",
  "B21": "110th St-Cathedral Pkwy",
  "B22": "103rd St",
  "B23": "96th St",
  "B24": "86th St",
  "B25": "81st St-Museum of Natural History",
  "B26": "72nd St",
  "B28": "59th St-Columbus Circle",
  "B30": "47th-50th Sts-Rockefeller Center",
  "B31": "42nd St-Bryant Pk",
  "B32": "34th St-Herald Sq",
  "B33": "23rd St",
  "B34": "14th St",
  "B35": "W 4th St-Wash Sq",
  "B36": "Broadway-Lafayette St",
  "B37": "Grand St",
  "B38": "DeKalb Av",
  "B39": "Atlantic Av-Barclays Center",
  "B40": "7th Av",
  "B41": "Prospect Park",
  "B42": "Church Av",
  "B43": "Beverley Rd",
  "B44": "Cortelyou Rd",
  "B45": "Newkirk Plaza",
  "B46": "Avenue H",
  "B47": "Avenue J",
  "B48": "Avenue M",
  "B49": "Kings Hwy",
  "B50": "Avenue U",
  "B51": "Neck Rd",
  "B52": "Sheepshead Bay",
  "B53": "Brighton Beach",
  "B54": "Ocean Pkwy",
  "B55": "W 8th St-NY Aquarium",
  "B57": "Coney Island-Stillwell Av",
  
  // D Line (6th Avenue Express)
  "D01": "Norwood-205th St",
  "D03": "Bedford Park Blvd",
  "D04": "Kingsbridge Rd",
  "D05": "Fordham Rd",
  "D06": "182nd-183rd Sts",
  "D07": "Tremont Av",
  "D08": "174th-175th Sts",
  "D09": "170th St",
  "D10": "167th St",
  "D11": "161st St-Yankee Stadium",
  "D12": "155th St",
  "D13": "145th St",
  "D14": "135th St",
  "D15": "125th St",
  "D16": "116th St",
  "D17": "110th St-Cathedral Pkwy",
  "D18": "103rd St",
  "D19": "96th St",
  "D20": "86th St",
  "D21": "81st St-Museum of Natural History",
  "D22": "72nd St",
  "D23": "59th St-Columbus Circle",
  "D24": "47th-50th Sts-Rockefeller Center",
  "D25": "42nd St-Bryant Pk",
  "D26": "34th St-Herald Sq",
  "D27": "23rd St",
  "D28": "14th St",
  "D29": "W 4th St-Wash Sq",
  "D30": "Broadway-Lafayette St",
  "D31": "Grand St",
  "D32": "DeKalb Av",
  "D33": "Atlantic Av-Barclays Center",
  "D34": "7th Av",
  "D35": "Prospect Park",
  "D36": "Church Av",
  "D37": "Beverley Rd",
  "D38": "Cortelyou Rd",
  "D39": "Newkirk Plaza",
  "D40": "Avenue H",
  "D41": "Avenue J",
  "D42": "Avenue M",
  "D43": "Kings Hwy",
  "D44": "Avenue U",
  "D45": "Neck Rd",
  "D46": "Sheepshead Bay",
  "D47": "Brighton Beach",
  "D48": "Ocean Pkwy",
  "D49": "W 8th St-NY Aquarium",
  "D50": "Coney Island-Stillwell Av",
  
  // F Line (6th Avenue Local)
  "F01": "Jamaica-179th St",
  "F02": "169th St",
  "F03": "Parsons Blvd",
  "F04": "Sutphin Blvd",
  "F05": "Briarwood-Van Wyck Blvd",
  "F06": "Kew Gardens-Union Tpke",
  "F07": "75th Av",
  "F08": "Forest Hills-71st Av",
  "F09": "Jackson Hts-Roosevelt Av",
  "F10": "Northern Blvd",
  "F11": "46th St",
  "F12": "Steinway St",
  "F13": "36th St",
  "F14": "Queens Plaza",
  "F15": "Court Sq-23rd St",
  "F16": "Lexington Av-53rd St",
  "F17": "5th Av-53rd St",
  "F18": "47th-50th Sts-Rockefeller Center",
  "F19": "42nd St-Bryant Pk",
  "F20": "34th St-Herald Sq",
  "F21": "23rd St",
  "F22": "14th St",
  "F23": "W 4th St-Wash Sq",
  "F24": "Broadway-Lafayette St",
  "F25": "Delancey St-Essex St",
  "F26": "East Broadway",
  "F27": "York St",
  "F28": "Bergen St",
  "F29": "Carroll St",
  "F30": "Smith-9th Sts",
  "F31": "4th Av-9th St",
  "F32": "7th Av",
  "F33": "15th St-Prospect Park",
  "F34": "Fort Hamilton Pkwy",
  "F35": "Church Av",
  "F36": "Ditmas Av",
  "F37": "18th Av",
  "F38": "Avenue I",
  "F39": "Bay Pkwy",
  "F40": "Avenue N",
  "F41": "Avenue P",
  "F42": "Kings Hwy",
  "F43": "Avenue U",
  "F44": "Avenue X",
  "F45": "Neptune Av",
  "F46": "W 8th St-NY Aquarium",
  "F47": "Coney Island-Stillwell Av",
  
  // M Line (6th Avenue Local)
  "M01": "Middle Village-Metropolitan Av",
  "M02": "Fresh Pond Rd",
  "M03": "Forest Av",
  "M04": "Seneca Av",
  "M05": "Myrtle-Wyckoff Avs",
  "M06": "Knickerbocker Av",
  "M07": "Central Av",
  "M08": "Myrtle Av",
  "M09": "Flushing Av",
  "M10": "Lorimer St",
  "M11": "Hewes St",
  "M12": "Marcy Av",
  "M13": "Essex St",
  "M14": "Bowery",
  "M15": "Canal St",
  "M16": "Chambers St",
  "M17": "Fulton St",
  "M18": "Broad St",
  "M19": "Wall St",
  "M20": "Whitehall St-South Ferry",
  
  // L Line (14th Street-Canarsie)
  "L01": "8th Av",
  "L02": "6th Av",
  "L03": "Union Sq-14th St",
  "L05": "3rd Av",
  "L06": "1st Av",
  "L08": "Bedford Av",
  "L10": "Lorimer St",
  "L11": "Graham Av",
  "L12": "Grand St",
  "L13": "Montrose Av",
  "L14": "Morgan Av",
  "L15": "Jefferson St",
  "L16": "DeKalb Av",
  "L17": "Myrtle-Wyckoff Avs",
  "L19": "Halsey St",
  "L20": "Wilson Av",
  "L21": "Bushwick Av-Aberdeen St",
  "L22": "Broadway Junction",
  "L24": "Atlantic Av",
  "L25": "Sutter Av",
  "L26": "Livonia Av",
  "L27": "New Lots Av",
  "L28": "East 105th St",
  "L29": "Canarsie-Rockaway Pkwy",
  
  // N, Q, R, W Lines (Broadway)
  "Q01": "Astoria-Ditmars Blvd",
  "N01": "Astoria-Ditmars Blvd",
  "N02": "Astoria Blvd",
  "N03": "30th Av",
  "N04": "Broadway",
  "N05": "36th Av",
  "N06": "39th Av",
  "N07": "Queensboro Plaza",
  "N08": "Lexington Av-59th St",
  "N09": "5th Av-59th St",
  "N10": "57th St-7th Av",
  "N11": "49th St",
  "N12": "Times Sq-42nd St",
  "N13": "34th St-Herald Sq",
  "N14": "28th St",
  "N15": "23rd St",
  "N16": "14th St-Union Sq",
  "N17": "8th St-NYU",
  "N18": "Prince St",
  "N19": "Canal St",
  "N20": "City Hall",
  "N21": "Cortlandt St",
  "N22": "Rector St",
  "N23": "Whitehall St-South Ferry",
  "N24": "Rector St",
  "N25": "Cortlandt St",
  "N26": "City Hall",
  "N27": "Canal St",
  "N28": "8th St-NYU",
  "N29": "14th St-Union Sq",
  "N30": "23rd St",
  "N31": "28th St",
  "N32": "34th St-Herald Sq",
  "N33": "Times Sq-42nd St",
  "N34": "49th St",
  "N35": "57th St-7th Av",
  "N36": "5th Av-59th St",
  "N37": "Lexington Av-59th St",
  "N38": "Queensboro Plaza",
  "N39": "39th Av",
  "N40": "36th Av",
  "N41": "Broadway",
  "N42": "30th Av",
  "N43": "Astoria Blvd",
  "N44": "Astoria-Ditmars Blvd",
  
  // R Line (Broadway Local)
  "R01": "Astoria-Ditmars Blvd",
  "R02": "Astoria Blvd",
  "R03": "30th Av",
  "R04": "Broadway",
  "R05": "36th Av",
  "R06": "39th Av",
  "R07": "Queensboro Plaza",
  "R08": "Lexington Av-59th St",
  "R09": "5th Av-59th St",
  "R10": "57th St-7th Av",
  "R11": "49th St",
  "R12": "Times Sq-42nd St",
  "R13": "34th St-Herald Sq",
  "R14": "28th St",
  "R15": "23rd St",
  "R16": "14th St-Union Sq",
  "R17": "8th St-NYU",
  "R18": "Prince St",
  "R19": "Canal St",
  "R20": "City Hall",
  "R21": "Cortlandt St",
  "R22": "Rector St",
  "R23": "Whitehall St-South Ferry",
  "R24": "Rector St",
  "R25": "Cortlandt St",
  "R26": "City Hall",
  "R27": "Canal St",
  "R28": "8th St-NYU",
  "R29": "14th St-Union Sq",
  "R30": "23rd St",
  "R31": "28th St",
  "R32": "34th St-Herald Sq",
  "R33": "Times Sq-42nd St",
  "R34": "49th St",
  "R35": "57th St-7th Av",
  "R36": "5th Av-59th St",
  "R37": "Lexington Av-59th St",
  "R38": "Queensboro Plaza",
  "R39": "39th Av",
  "R40": "36th Av",
  "R41": "Broadway",
  "R42": "30th Av",
  "R43": "Astoria Blvd",
  "R44": "Astoria-Ditmars Blvd",
  
  // J, M, Z Lines (Nassau Street)
  "J12": "Jamaica Center-Parsons/Archer",
  "J13": "Sutphin Blvd-Archer Av-JFK Airport",
  "J14": "Jamaica-Van Wyck",
  "J15": "121st St",
  "J16": "111th St",
  "J17": "104th St",
  "J19": "Woodhaven Blvd",
  "J20": "85th St-Forest Pkwy",
  "J21": "75th St-Elderts Ln",
  "J22": "Cypress Hills",
  "J23": "Crescent St",
  "J24": "Norwood Av",
  "J27": "Cleveland St",
  "J28": "Van Siclen Av",
  "J29": "Alabama Av",
  "J30": "Broadway Junction",
  "J31": "Chauncey St",
  "J32": "Halsey St",
  "J33": "Gates Av",
  "J34": "Kosciuszko St",
  "J35": "Myrtle Av",
  "J36": "Flushing Av",
  "J37": "Lorimer St",
  "J38": "Hewes St",
  "J39": "Marcy Av",
  "J40": "Essex St",
  "J41": "Bowery",
  "J42": "Canal St",
  "J43": "Chambers St",
  "J44": "Fulton St",
  "J45": "Broad St"
};

// Enhanced real-time data cache with freshness validation
const dataCache = new Map();
const CACHE_DURATION = 30 * 1000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Ridership data cache
const ridershipCache = new Map();
const RIDERSHIP_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const NYC_APP_TOKEN = "K3zOykMAZX3QURV98nMZs6Vr2";

// Global ridership data cache to avoid repeated API calls
let globalRidershipData = null;
let globalRidershipDataTimestamp = 0;
const GLOBAL_RIDERSHIP_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Data quality validation
function validateArrivalData(arrival) {
  const now = Math.floor(Date.now() / 1000);
  const maxFutureTime = now + (2 * 60 * 60); // 2 hours max future
  const minPastTime = now - (30 * 60); // 30 minutes max past
  
  return arrival.epoch >= minPastTime && 
         arrival.epoch <= maxFutureTime &&
         arrival.stationName && 
         arrival.stationName.length > 0 &&
         arrival.routeId;
}

// Enhanced fetch with retry logic and caching
async function fetchArrivalsForLine(lineId, feedUrl, retryCount = 0) {
  const cacheKey = `${lineId}_${feedUrl}`;
  const now = Date.now();
  
  // Check cache first
  if (dataCache.has(cacheKey)) {
    const cached = dataCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached data for ${lineId} line (${Math.round((CACHE_DURATION - (now - cached.timestamp)) / 1000)}s remaining)`);
      return cached.data;
    }
  }

  try {
    console.log(`Fetching ${lineId} line from ${feedUrl} (attempt ${retryCount + 1})`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(feedUrl, {
      headers: { 
        "x-api-key": process.env.MTA_API_KEY,
        "User-Agent": "MTA-G-Site/2.0",
        "Accept": "application/x-protobuf",
        "Cache-Control": "no-cache"
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`MTA API responded ${response.status}: ${text}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error("Empty response from MTA API");
    }

    // Check data freshness from headers
    const lastModified = response.headers.get('last-modified');
    const cacheControl = response.headers.get('cache-control');
    const dataAge = response.headers.get('age');
    
    console.log(`Data freshness - Last-Modified: ${lastModified}, Age: ${dataAge}s, Cache-Control: ${cacheControl}`);

    let feed;
    try {
      feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(arrayBuffer)
      );
    } catch (decodeError) {
      console.error(`Failed to decode protobuf for ${lineId}:`, decodeError);
      throw new Error(`Invalid data format from MTA API: ${decodeError.message}`);
    }

    // Validate feed header
    if (!feed.header) {
      throw new Error("Invalid feed: missing header");
    }

    const feedTimestamp = feed.header.timestamp?.toNumber?.() || feed.header.timestamp;
    const feedAge = now / 1000 - feedTimestamp;
    
    if (feedAge > 300) { // 5 minutes max age
      console.warn(`Feed data is ${Math.round(feedAge)}s old for ${lineId} line`);
    }

    const arrivals = [];
    const now_epoch = Math.floor(Date.now() / 1000);
    const availableRoutes = new Set();
    const processedTrips = new Set();

    for (const entity of feed.entity || []) {
      if (!entity.tripUpdate) continue;

      const routeId = entity.tripUpdate.trip?.routeId || lineId;
      const tripId = entity.tripUpdate.trip?.tripId;
      
      // Skip duplicate trips
      if (tripId && processedTrips.has(tripId)) continue;
      if (tripId) processedTrips.add(tripId);
      
      availableRoutes.add(routeId);
      
      // Enhanced route filtering
      if (lineId !== 'G' && lineId !== 'L') {
        if (routeId !== lineId) continue;
      }

      for (const stu of entity.tripUpdate.stopTimeUpdate || []) {
        const stopId = stu.stopId || "";
        const dir = stopId.endsWith("N") ? "N" : stopId.endsWith("S") ? "S" : 
                   stopId.endsWith("E") ? "E" : stopId.endsWith("W") ? "W" : "";
        
        const arrival = stu.arrival?.time?.toNumber?.() || stu.arrival?.time || null;
        const departure = stu.departure?.time?.toNumber?.() || stu.departure?.time || null;

        const t = arrival || departure;
        if (!t || t < now_epoch - 60) continue; // Skip arrivals more than 1 minute past

        // Enhanced station name resolution
        const baseStopId = stopId.replace(/[NSEW]$/, "");
        let stationName = ALL_STATION_NAMES[baseStopId] || 
                         ALL_STATION_NAMES[stopId] || 
                         `Stop ${baseStopId}`;
        
        // Clean up station names
        stationName = stationName.replace(/\s+/g, ' ').trim();
        
        // Enhanced destination logic with better fallbacks
        let destination = "";
        const tripHeadsign = entity.tripUpdate.trip?.tripHeadsign;
        if (tripHeadsign) {
          destination = tripHeadsign;
        } else if (dir === "N") destination = "Northbound";
        else if (dir === "S") destination = "Southbound";
        else if (dir === "E") destination = "Eastbound";
        else if (dir === "W") destination = "Westbound";
        else {
          // Use line-specific terminal stations as fallback
          const terminalStations = {
            'G': 'Court Sq / Church Av',
            'A': 'Inwood / Far Rockaway',
            'C': '168 St / Euclid Av',
            'E': 'Jamaica Center / World Trade Center',
            'B': 'Bedford Park / Brighton Beach',
            'D': 'Norwood / Coney Island',
            'F': 'Jamaica / Coney Island',
            'M': 'Middle Village / Metropolitan Av',
            'J': 'Jamaica Center / Broad St',
            'L': '8 Av / Canarsie',
            'N': 'Astoria / Coney Island',
            'Q': 'Astoria / Coney Island',
            'R': 'Astoria / Bay Ridge',
            'W': 'Astoria / Whitehall St',
            '1': 'South Ferry / Van Cortlandt Park',
            '2': 'Wakefield / Flatbush Av',
            '3': 'Harlem / New Lots Av',
            '4': 'Woodlawn / Utica Av',
            '5': 'Dyre Av / Flatbush Av',
            '6': 'Pelham Bay Park / Brooklyn Bridge',
            '7': 'Flushing / Hudson Yards'
          };
          destination = terminalStations[lineId] || `${lineId} Line`;
        }
        
        const arrivalData = {
          routeId,
          tripId: tripId || "",
          stopId,
          stationName,
          direction: dir,
          destination,
          arrivalTime: arrival ? formatArrivalTime(arrival) : null,
          departureTime: departure ? formatArrivalTime(departure) : null,
          epoch: t,
          feedTimestamp: feedTimestamp,
          dataQuality: 'realtime',
          ridership: null // Will be populated later
        };

        // Validate data quality
        if (validateArrivalData(arrivalData)) {
          arrivals.push(arrivalData);
        }
      }
    }

    // Sort by arrival time and remove duplicates
    arrivals.sort((a, b) => a.epoch - b.epoch);
    
    // Remove duplicate arrivals (same trip, same stop)
    const uniqueArrivals = [];
    const seen = new Set();
    for (const arrival of arrivals) {
      const key = `${arrival.tripId}_${arrival.stopId}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueArrivals.push(arrival);
      }
    }

    // Add ridership data to arrivals (limit to first 30 to get better coverage)
    const arrivalsWithRidership = [];
    
    // Process ridership data in smaller batches to avoid overwhelming the API
    const batchSize = 10;
    const maxWithRidership = Math.min(uniqueArrivals.length, 30);
    
    for (let i = 0; i < maxWithRidership; i += batchSize) {
      const batch = uniqueArrivals.slice(i, i + batchSize);
      const batchPromises = batch.map(arrival => 
        getStationRidership(arrival.stationName, lineId).then(ridership => {
          arrival.ridership = ridership;
          return arrival;
        }).catch(error => {
          console.error(`Error getting ridership for ${arrival.stationName}:`, error);
          arrival.ridership = { averageRidership: 0, dataPoints: 0, confidence: 'error' };
          return arrival;
        })
      );
      
      try {
        const batchResults = await Promise.all(batchPromises);
        arrivalsWithRidership.push(...batchResults);
      } catch (error) {
        console.error('Error fetching ridership batch:', error);
        arrivalsWithRidership.push(...batch);
      }
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < maxWithRidership) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Add remaining arrivals without ridership data
    arrivalsWithRidership.push(...uniqueArrivals.slice(maxWithRidership));

    const result = {
      updated: new Date().toLocaleString(),
      count: arrivalsWithRidership.length,
      arrivals: arrivalsWithRidership.slice(0, 150), // Increased limit
      availableRoutes: Array.from(availableRoutes),
      feedTimestamp: feedTimestamp,
      dataAge: Math.round(feedAge),
      dataQuality: 'realtime',
      cacheExpiry: now + CACHE_DURATION
    };

    // Cache the result
    dataCache.set(cacheKey, {
      data: result,
      timestamp: now
    });

    console.log(`Found ${uniqueArrivals.length} valid arrivals for ${lineId} line (${Math.round(feedAge)}s old)`);
    console.log(`Available routes in feed: ${Array.from(availableRoutes).join(', ')}`);

    return result;
    
  } catch (error) {
    console.error(`Error fetching ${lineId} line arrivals (attempt ${retryCount + 1}):`, error);
    
    // Retry logic for transient errors
    if (retryCount < MAX_RETRIES && (
      error.name === 'AbortError' || 
      error.message.includes('timeout') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ENOTFOUND')
    )) {
      console.log(`Retrying ${lineId} line fetch in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return fetchArrivalsForLine(lineId, feedUrl, retryCount + 1);
    }
    
    // Return cached data if available and recent
    if (dataCache.has(cacheKey)) {
      const cached = dataCache.get(cacheKey);
      if (now - cached.timestamp < CACHE_DURATION * 2) { // Allow stale cache for 1 minute
        console.log(`Using stale cached data for ${lineId} line due to fetch error`);
        return {
          ...cached.data,
          dataQuality: 'stale',
          error: error.message
        };
      }
    }
    
    // Enhanced error messages
    if (error.message.includes('invalid wire type')) {
      throw new Error(`Data format error for ${lineId} line. This feed may be temporarily unavailable.`);
    } else if (error.message.includes('401') || error.message.includes('403')) {
      throw new Error(`Authentication error. Please check your MTA API key.`);
    } else if (error.message.includes('404')) {
      throw new Error(`Feed not found for ${lineId} line. This line may not be available.`);
    } else if (error.name === 'AbortError') {
      throw new Error(`Request timeout for ${lineId} line. The MTA API may be slow.`);
    } else {
      throw new Error(`Failed to fetch ${lineId} line data: ${error.message}`);
    }
  }
}

// Enhanced demo data with realistic station names
function generateDemoData(lineId) {
  const now = new Date();
  const demoArrivals = [];
  
  // Realistic station names for demo data
  const demoStations = {
    'G': ['Court Square', '21st Street', 'Greenpoint Avenue', 'Nassau Avenue', 'Metropolitan Avenue', 'Broadway', 'Flushing Avenue', 'Myrtle–Willoughby Avenues', 'Bedford–Nostrand Avenues', 'Classon Avenue', 'Clinton–Washington Avenues', 'Fulton Street', 'Hoyt–Schermerhorn Streets', 'Bergen Street', 'Carroll Street', 'Smith–9th Streets', '4th Avenue–9th Street', '7th Avenue', '15th Street–Prospect Park', 'Fort Hamilton Parkway', 'Church Avenue'],
    'A': ['Inwood-207th St', 'Dyckman St', '190th St', '181st St', '175th St', '168th St', '163rd St-Amsterdam Av', '155th St', '145th St', '135th St', '125th St', '116th St', '110th St-Cathedral Pkwy', '103rd St', '96th St', '86th St', '81st St-Museum of Natural History', '72nd St', '59th St-Columbus Circle', '50th St', '42nd St-Port Authority Bus Terminal', '34th St-Penn Station', '23rd St', '14th St', 'W 4th St-Wash Sq', 'Spring St', 'Canal St', 'Chambers St', 'Fulton St', 'High St', 'Jay St-MetroTech', 'Hoyt-Schermerhorn Sts'],
    '1': ['South Ferry', 'Rector St', 'Cortlandt St', 'Chambers St', 'Canal St', 'Franklin St', 'Houston St', 'Christopher St-Sheridan Sq', '14th St', '18th St', '23rd St', '28th St', '34th St-Penn Station', 'Times Sq-42nd St', '50th St', '59th St-Columbus Circle', '66th St-Lincoln Center', '72nd St', '79th St', '86th St', '96th St', '103rd St', '110th St-Cathedral Pkwy', '116th St-Columbia University', '125th St', '137th St-City College', '145th St', '157th St', '168th St-Washington Hts', '181st St', '191st St', 'Dyckman St', '207th St', '215th St', '225th St', '231st St', '238th St', 'Van Cortlandt Park-242nd St']
  };
  
  const stations = demoStations[lineId] || [`Demo Station 1`, `Demo Station 2`, `Demo Station 3`, `Demo Station 4`, `Demo Station 5`];
  const numArrivals = Math.floor(Math.random() * 8) + 5; // 5-12 arrivals
  
  for (let i = 0; i < numArrivals; i++) {
    const minutesFromNow = Math.floor(Math.random() * 25) + 1; // 1-25 minutes
    const arrivalTime = new Date(now.getTime() + minutesFromNow * 60000);
    const station = stations[Math.floor(Math.random() * stations.length)];
    const direction = Math.random() > 0.5 ? 'N' : 'S';
    
    demoArrivals.push({
      routeId: lineId,
      tripId: `DEMO_${lineId}_${i + 1}`,
      stopId: `${lineId}${Math.floor(Math.random() * 50) + 1}${direction}`,
      stationName: station,
      direction: direction,
      destination: direction === 'N' ? 'Northbound' : 'Southbound',
      arrivalTime: formatArrivalTime(Math.floor(arrivalTime.getTime() / 1000)),
      departureTime: formatArrivalTime(Math.floor(arrivalTime.getTime() / 1000)),
      epoch: Math.floor(arrivalTime.getTime() / 1000),
      dataQuality: 'demo'
    });
  }
  
  // Sort by arrival time
  demoArrivals.sort((a, b) => a.epoch - b.epoch);
  
  return {
    updated: new Date().toLocaleString(),
    count: demoArrivals.length,
    arrivals: demoArrivals,
    demo: true,
    dataQuality: 'demo',
    message: 'Demo data - Real-time feeds unavailable'
  };
}

// Cache cleanup function
function cleanupCache() {
  const now = Date.now();
  const maxAge = CACHE_DURATION * 3; // 3x cache duration
  
  for (const [key, value] of dataCache.entries()) {
    if (now - value.timestamp > maxAge) {
      dataCache.delete(key);
      console.log(`Cleaned up stale cache entry: ${key}`);
    }
  }
}

// Run cache cleanup every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000);

// Health monitoring endpoint
app.get("/api/health", (req, res) => {
  const now = Date.now();
  const cacheStats = {
    totalCached: dataCache.size,
    cacheEntries: []
  };
  
  for (const [key, value] of dataCache.entries()) {
    const age = now - value.timestamp;
    cacheStats.cacheEntries.push({
      line: key.split('_')[0],
      age: Math.round(age / 1000),
      fresh: age < CACHE_DURATION,
      dataQuality: value.data.dataQuality || 'unknown'
    });
  }
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cache: cacheStats,
    apiKey: process.env.MTA_API_KEY ? 'configured' : 'missing'
  });
});

// Enhanced API endpoints with better error handling
Object.keys(MTA_FEEDS).forEach(lineId => {
  const endpoint = `/api/${lineId.toLowerCase()}-arrivals`;
  app.get(endpoint, async (req, res) => {
    const startTime = Date.now();
    
    try {
      const feedUrl = MTA_FEEDS[lineId];
      const data = await fetchArrivalsForLine(lineId, feedUrl);
      
      // Add performance metrics
      const responseTime = Date.now() - startTime;
      data.responseTime = responseTime;
      data.endpoint = endpoint;
      
      // Check if this is a letter route that's not available in current feeds
      const isLetterRoute = /^[A-Z]$/.test(lineId);
      const hasData = data.arrivals && data.arrivals.length > 0;
      
      if (isLetterRoute && !hasData) {
        console.log(`Letter route ${lineId} not available in current feeds, returning demo data`);
        const demoData = generateDemoData(lineId);
        demoData.message = `Demo data - ${lineId} line not available in current MTA feeds`;
        demoData.availableRoutes = data.availableRoutes || [];
        demoData.responseTime = responseTime;
        demoData.endpoint = endpoint;
        return res.json(demoData);
      }
      
      // Set appropriate cache headers
      res.set({
        'Cache-Control': 'public, max-age=30',
        'X-Data-Quality': data.dataQuality || 'realtime',
        'X-Response-Time': responseTime.toString(),
        'X-Feed-Age': data.dataAge?.toString() || 'unknown'
      });
      
      res.json(data);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`Error in ${endpoint}:`, error);
      
      // If no API key is configured, return demo data
      if (!process.env.MTA_API_KEY) {
        console.log(`No API key configured, returning demo data for ${lineId} line`);
        const demoData = generateDemoData(lineId);
        demoData.message = "Demo data - Configure MTA_API_KEY in .env for real data";
        demoData.responseTime = responseTime;
        demoData.endpoint = endpoint;
        return res.json(demoData);
      }
      
      // For other errors, return error with helpful message
      res.status(500).json({ 
        error: `Failed to load ${lineId} line arrivals`, 
        details: String(error),
        message: "Make sure the MTA API key and feed URLs are configured in your .env file",
        demo: false,
        responseTime: responseTime,
        endpoint: endpoint,
        timestamp: new Date().toISOString()
      });
    }
  });
});

app.get("/api/g-arrivals", async (req, res) => {
  try {
    const r = await fetch(G_FEED_URL, {
      headers: { "x-api-key": process.env.MTA_API_KEY }
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return res.status(r.status).json({ error: `MTA responded ${r.status}`, body: text });
    }

    const arrayBuffer = await r.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(arrayBuffer)
    );

    const arrivals = [];

    for (const entity of feed.entity) {
      if (!entity.tripUpdate) continue;

      const routeId = entity.tripUpdate.trip?.routeId || "G";
      const tripId = entity.tripUpdate.trip?.tripId || "";

      for (const stu of entity.tripUpdate.stopTimeUpdate || []) {
        const stopId = stu.stopId || "";
        const dir = stopId.endsWith("N") ? "N" : stopId.endsWith("S") ? "S" : "";
        const arrival = stu.arrival?.time?.toNumber?.() || stu.arrival?.time || null;
        const departure = stu.departure?.time?.toNumber?.() || stu.departure?.time || null;

        const now = Math.floor(Date.now() / 1000);
        const t = arrival || departure;
        if (!t || t < now - 60) continue;

        // Extract base stop ID (remove N/S suffix for station name lookup)
        const baseStopId = stopId.replace(/[NS]$/, "");
        const stationName = G_STATION_NAMES[baseStopId] || `Stop ${baseStopId}`;
        const destination = dir === "N" ? "Court Square" : dir === "S" ? "Church Avenue" : "G Line";
        
        arrivals.push({
          routeId,
          tripId,
          stopId,
          stationName,
          direction: dir,
          destination,
          arrivalTime: arrival ? formatArrivalTime(arrival) : null,
          departureTime: departure ? formatArrivalTime(departure) : null,
          epoch: t
        });
      }
    }

    arrivals.sort((a, b) => a.epoch - b.epoch);

    res.json({
      updated: new Date().toLocaleString(),
      count: arrivals.length,
      arrivals
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load or decode GTFS-realtime feed", details: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
});
