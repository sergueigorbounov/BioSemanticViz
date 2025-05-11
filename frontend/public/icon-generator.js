// This is a script you can run with Node.js to generate icon files
// Run it with: node icon-generator.js

const fs = require('fs');
const { createCanvas } = require('canvas');

// Generate logo with specified size
function generateLogo(size, filePath) {
  // Create canvas with the specified size
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#2196f3');
  gradient.addColorStop(1, '#1976d2');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Add text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const fontSize = Math.floor(size / 4);
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  
  ctx.fillText('BSV', size / 2, size / 2);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  
  console.log(`Generated ${filePath}`);
}

// Generate favicon (simple 32x32 icon)
function generateFavicon(filePath) {
  const size = 32;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Create a circular icon
  ctx.fillStyle = '#2196f3';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Add text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('B', size/2, size/2);
  
  // Save as PNG (actual .ico files would require additional conversion)
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  
  console.log(`Generated ${filePath}`);
}

// Generate icons
try {
  // Generate logos
  generateLogo(192, 'public/logo192.png');
  generateLogo(512, 'public/logo512.png');
  
  // Generate favicon
  generateFavicon('public/favicon.ico');
  
  console.log('All icons generated successfully');
} catch (error) {
  console.error('Error generating icons:', error);
} 