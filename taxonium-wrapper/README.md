# Taxonium React 17 Wrapper

This is a simple wrapper around the Taxonium component, using React 17 to avoid compatibility issues with React 18 in the main application.

## How it works

This application serves as a micro-frontend that loads the Taxonium component in an iframe. It communicates with the main application through the postMessage API.

## Running the application

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm start
```

The application will run on port 3002.

## Integration with the main application

The main application should include this as an iframe, and communicate through the postMessage API. The wrapper expects messages in the following format:

```js
{
  type: 'INIT_TAXONIUM',
  treeData: [...], // The tree data in Taxonium format
  newick: '...'    // Optional Newick string
}
```

The wrapper will send messages back to the parent window:

- When loaded: `{ type: 'TAXONIUM_IFRAME_LOADED' }`
- When the Taxonium component is ready: `{ type: 'TAXONIUM_READY' }` 