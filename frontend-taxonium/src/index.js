import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Log React version for debugging
console.log('React version:', React.version);

// Check if the taxonium component is available
try {
  const TaxoniumComponent = require('taxonium-component');
  console.log('Taxonium component loaded:', TaxoniumComponent);
} catch (error) {
  console.error('Error loading taxonium-component:', error);
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
); 