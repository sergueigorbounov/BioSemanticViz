declare module 'taxonium-component' {
  import React from 'react';
  
  interface TaxoniumProps {
    treeData: any;
    colorBy?: string;
    initialSettings?: {
      ladderizeTree?: boolean;
      showLengthBars?: boolean;
      greyscale?: boolean;
      minTipSize?: number;
      maxTipSize?: number;
      [key: string]: any;
    };
    [key: string]: any;
  }
  
  const Taxonium: React.FC<TaxoniumProps>;
  
  export default Taxonium;
} 