/// <reference types="react-scripts" />

// Allow dynamic imports of JS files
declare module '*.js';

// Simple declaration for taxonium-component
declare module 'taxonium-component' {
  import { ComponentType } from 'react';
  
  interface TaxoniumProps {
    width?: string | number;
    height?: string | number;
    data: any;
    newick?: string;
    customNavbar?: any;
    [key: string]: any;
  }
  
  const TaxoniumComponent: ComponentType<TaxoniumProps>;
  export { TaxoniumComponent };
  export default TaxoniumComponent;
}

// Extend Window interface to include React property
interface Window {
  React?: any;
  _React?: typeof React;
}

// Extend React namespace for internal APIs
declare namespace React {
  const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: any;
}
