/**
 * Captures a chart container (by id) which renders a Recharts SVG,
 * draws it to an HTML5 canvas, and triggers a browser PNG download.
 */
export const downloadChartAsPng = (containerId, filename = 'chart.png') => {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Chart container with ID '${containerId}' not found.`);
    return;
  }
  const svgElement = container.querySelector('svg');
  if (!svgElement) {
    console.error(`SVG element not found inside container '${containerId}'.`);
    return;
  }
  
  try {
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      // Use clientWidth/clientHeight or fall back to bounding rect
      const width = svgElement.getBoundingClientRect().width || svgElement.clientWidth || 600;
      const height = svgElement.getBoundingClientRect().height || svgElement.clientHeight || 400;
      
      // Support high DPI screens
      const scale = 2; 
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const context = canvas.getContext('2d');
      context.scale(scale, scale);
      
      // Draw background
      context.fillStyle = '#ffffff'; 
      context.fillRect(0, 0, width, height);
      
      context.drawImage(image, 0, 0, width, height);
      
      const png = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = png;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  } catch (error) {
    console.error('Error exporting chart to PNG:', error);
  }
};
