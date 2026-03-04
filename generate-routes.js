// Script to generate route-map HTML files for all subway lines
const fs = require('fs');
const path = require('path');

// MTA Route configurations
const routes = [
    { id: '1', name: '1', color: '#EE352E', bgColor: '#EE352E' },
    { id: '2', name: '2', color: '#EE352E', bgColor: '#EE352E' },
    { id: '3', name: '3', color: '#EE352E', bgColor: '#EE352E' },
    { id: '4', name: '4', color: '#00933C', bgColor: '#00933C' },
    { id: '5', name: '5', color: '#00933C', bgColor: '#00933C' },
    { id: '6', name: '6', color: '#00933C', bgColor: '#00933C' },
    { id: '7', name: '7', color: '#B933AD', bgColor: '#B933AD' },
    { id: 'A', name: 'A', color: '#0039A6', bgColor: '#0039A6' },
    { id: 'C', name: 'C', color: '#0039A6', bgColor: '#0039A6' },
    { id: 'E', name: 'E', color: '#0039A6', bgColor: '#0039A6' },
    { id: 'B', name: 'B', color: '#FF6319', bgColor: '#FF6319' },
    { id: 'D', name: 'D', color: '#FF6319', bgColor: '#FF6319' },
    { id: 'F', name: 'F', color: '#FF6319', bgColor: '#FF6319' },
    { id: 'M', name: 'M', color: '#FF6319', bgColor: '#FF6319' },
    { id: 'G', name: 'G', color: '#6CBE45', bgColor: '#6CBE45' },
    { id: 'J', name: 'J', color: '#996633', bgColor: '#996633' },
    { id: 'Z', name: 'Z', color: '#996633', bgColor: '#996633' },
    { id: 'L', name: 'L', color: '#A7A9AC', bgColor: '#A7A9AC' },
    { id: 'N', name: 'N', color: '#FCCC0A', bgColor: '#FCCC0A' },
    { id: 'Q', name: 'Q', color: '#FCCC0A', bgColor: '#FCCC0A' },
    { id: 'R', name: 'R', color: '#FCCC0A', bgColor: '#FCCC0A' },
    { id: 'W', name: 'W', color: '#FCCC0A', bgColor: '#FCCC0A' },
];

// Read the G line template
const templatePath = path.join(__dirname, 'public', 'Gtrain-roadmap.html');
const template = fs.readFileSync(templatePath, 'utf8');

// Generate files for each route
routes.forEach(route => {
    let content = template;
    
    // Replace route-specific content
    content = content.replace(/class="route-badge">G</g, `class="route-badge">${route.name}<`);
    content = content.replace(/G Line/g, `${route.name} Line`);
    content = content.replace(/--route-color: #6CBE45/g, `--route-color: ${route.color}`);
    content = content.replace(/#6CBE45/g, route.color);
    content = content.replace(/109, 190, 69/g, hexToRgb(route.color));
    
    // Update API endpoint
    content = content.replace(/\/api\/g-arrivals/g, `/api/${route.id.toLowerCase()}-arrivals`);
    
    // Update page title
    content = content.replace(/<title>.*?<\/title>/, `<title>${route.name} Line - Route Map</title>`);
    
    // Write file
    const filename = `route-${route.id.toLowerCase()}-horizontal.html`;
    const filepath = path.join(__dirname, 'public', filename);
    fs.writeFileSync(filepath, content);
    console.log(`✅ Created: ${filename}`);
});

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '109, 190, 69';
}

console.log('\n🎉 All route maps generated successfully!');

