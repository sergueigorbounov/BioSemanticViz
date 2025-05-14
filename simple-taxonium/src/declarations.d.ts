declare module 'taxonium-component' {
  interface TaxoniumProps {
    width?: string | number;
    height?: string | number;
    data: any;
    newick?: string;
    customNavbar?: any;
    [key: string]: any;
  }
  
  // Export the component as non-default
  export const TaxoniumComponent: React.ComponentType<TaxoniumProps>;
} 