// Define the toPropertyKey function on the global object
function toPropertyKey(argument) {
  if (argument == null) {
    throw new TypeError("Cannot convert undefined or null to object");
  }
  
  if (typeof argument === 'symbol') {
    return argument;
  }
  
  return String(argument);
}

// Add to global scope for React refresh/HMR
if (typeof window !== 'undefined') {
  window.toPropertyKey = toPropertyKey;
}

if (typeof global !== 'undefined') {
  global.toPropertyKey = toPropertyKey;
}

// Export using ES Module syntax
export { toPropertyKey }; 