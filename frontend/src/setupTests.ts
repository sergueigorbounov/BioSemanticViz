// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock for D3 functionality
jest.mock('d3', () => {
  const originalD3 = jest.requireActual('d3');
  
  return {
    ...originalD3,
    // Mock specific D3 functions that cause issues in JSDOM
    select: jest.fn().mockImplementation(() => ({
      selectAll: jest.fn().mockReturnThis(),
      append: jest.fn().mockReturnThis(),
      attr: jest.fn().mockReturnThis(),
      style: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      call: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      enter: jest.fn().mockReturnThis(),
      exit: jest.fn().mockReturnThis(),
      remove: jest.fn().mockReturnThis(),
      node: jest.fn().mockReturnValue(null),
    })),
  };
});

// Mock matchMedia which is not implemented in JSDOM
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
}; 