declare module 'taxonium-component' {
  import React from 'react';
  
  interface TaxoniumProps {
    width?: string | number;
    height?: string | number;
    data: any;
    newick?: string;
    customNavbar?: any;
    [key: string]: any;
  }
  
  // Allow all possible export patterns
  const TaxoniumComponent: React.ComponentType<TaxoniumProps>;
  export { TaxoniumComponent };
  export default TaxoniumComponent;
} 