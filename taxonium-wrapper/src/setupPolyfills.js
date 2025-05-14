// Add polyfill for nullish coalescing operator
if (typeof window !== 'undefined') {
  // Polyfill for nullish coalescing operator (??)
  if (!Object.prototype.hasOwnProperty.call(window, 'nullishCoalescing')) {
    Object.defineProperty(window, 'nullishCoalescing', {
      value: function(left, right) {
        return left !== null && left !== undefined ? left : right;
      },
      writable: false,
      configurable: false
    });
  }

  // Define process if it doesn't exist
  if (typeof process === 'undefined') {
    window.process = {
      env: {
        NODE_ENV: 'development'
      }
    };
  }
}

// Apply nullish coalescing polyfill to global scope
if (typeof global !== 'undefined' && !Object.prototype.hasOwnProperty.call(global, 'nullishCoalescing')) {
  Object.defineProperty(global, 'nullishCoalescing', {
    value: function(left, right) {
      return left !== null && left !== undefined ? left : right;
    },
    writable: false,
    configurable: false
  });
} 