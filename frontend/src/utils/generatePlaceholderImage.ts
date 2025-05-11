/**
 * Generate a placeholder image data URI
 * @param width - Image width
 * @param height - Image height
 * @param text - Optional text to display on image
 * @param bgColor - Background color of the image
 * @param textColor - Color for the text
 * @returns Data URI for a placeholder image
 */
export const generatePlaceholderImage = (
  width: number,
  height: number,
  text: string = `${width}×${height}`,
  bgColor: string = '#cccccc',
  textColor: string = '#333333'
): string => {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Get 2D context of the canvas
  const context = canvas.getContext('2d');
  
  if (!context) {
    console.error('Could not get canvas context');
    return '';
  }
  
  // Fill background
  context.fillStyle = bgColor;
  context.fillRect(0, 0, width, height);
  
  // Add text
  context.fillStyle = textColor;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Calculate font size based on image dimensions
  const fontSize = Math.max(10, Math.min(20, Math.floor(width / 10)));
  context.font = `${fontSize}px Arial, sans-serif`;
  
  // Draw text in the middle of the canvas
  context.fillText(text, width / 2, height / 2);
  
  // Convert canvas to data URL
  return canvas.toDataURL('image/png');
};

/**
 * Generate a placeholder logo image data URI
 * @param size - Image size (width and height)
 * @param text - Optional text to display on image
 * @returns Data URI for a placeholder logo
 */
export const generateLogoPlaceholder = (
  size: number = 192,
  text: string = 'LOGO'
): string => {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  // Get 2D context of the canvas
  const context = canvas.getContext('2d');
  
  if (!context) {
    console.error('Could not get canvas context');
    return '';
  }
  
  // Fill background with a gradient
  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#2196f3');
  gradient.addColorStop(1, '#1976d2');
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  
  // Add text
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Calculate font size based on image dimensions
  const fontSize = Math.floor(size / 3);
  context.font = `bold ${fontSize}px Arial, sans-serif`;
  
  // Draw text in the middle of the canvas
  context.fillText(text, size / 2, size / 2);
  
  // Convert canvas to data URL
  return canvas.toDataURL('image/png');
};

export default generatePlaceholderImage; 