# Test-Driven Development (TDD) Workflow

This document outlines the TDD workflow for the BioSemanticViz project.

## TDD Overview

Test-Driven Development is a software development approach where tests are written before the implementation code:

1. **Write a failing test** that defines the desired functionality
2. **Write the minimum code** needed to make the test pass
3. **Refactor** the code while ensuring tests continue to pass

## Project Test Setup

We use the following testing tools and libraries:

- **Jest**: Test runner and assertion library
- **React Testing Library**: For testing React components
- **Mock Service Worker (MSW)**: For API mocking (planned)

## Running Tests

```bash
# Navigate to frontend directory
cd frontend

# Run tests in watch mode (during development)
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (for CI/CD pipelines)
npm run test:ci
```

## TDD Workflow

### 1. Creating a New Feature

When implementing a new feature, follow these steps:

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Create your test file first (in __tests__ directory or with .test.tsx extension)
# Example for a component:
touch src/components/YourComponent/__tests__/YourComponent.test.tsx
```

### 2. Write Tests First

Start by writing a failing test that describes the expected behavior:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  test('renders expected content', () => {
    render(<YourComponent />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });
});
```

### 3. Run the Test (It Should Fail)

```bash
npm test -- --testNamePattern="YourComponent"
```

### 4. Implement the Code

Write the minimum code necessary to make the test pass:

```typescript
const YourComponent: React.FC = () => {
  return <div>Expected Text</div>;
};

export default YourComponent;
```

### 5. Run Tests Again (Should Pass)

```bash
npm test -- --testNamePattern="YourComponent"
```

### 6. Refactor If Needed

Improve the code while ensuring tests continue to pass.

### 7. Repeat

Add more tests and functionality following the same cycle.

## Testing Patterns

### Component Testing

- Test rendering
- Test user interactions (click, input, etc.)
- Test conditional rendering

### API Client Testing

- Mock API responses
- Test successful responses
- Test error handling

### Utility Function Testing

- Test with various inputs
- Test edge cases
- Test error conditions

## Coverage Goals

- Aim for at least 70% line coverage
- Focus on testing business logic and user interactions
- Use coverage reports to identify untested code

## Continuous Integration

All tests run automatically on push and pull requests through GitHub Actions workflows. The workflow is defined in `.github/workflows/test.yml`.

## Tips for Effective TDD

1. Keep tests small and focused
2. Use descriptive test names
3. Test behavior, not implementation details
4. Mock external dependencies
5. Organize tests to mirror the source code structure
6. If a bug is found, write a test that exposes the bug before fixing it 