import React, { useRef, useEffect } from 'react';

// Define interfaces
interface TaxoniumWrapperProps {
  width?: string | number;
  height?: string | number;
}

// Skip window.React manipulation entirely since it's causing conflicts
// Just implement the component directly

const TaxoniumWrapper: React.FC<TaxoniumWrapperProps> = ({
  width = '100%',
  height = '100%'
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div style={{ width, height, overflow: 'hidden', border: '1px solid #ccc' }}>
      <iframe
        ref={iframeRef}
        src="https://taxonium.org/?embedded=1"
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        title="Taxonium Viewer"
      />
    </div>
  );
};

export default TaxoniumWrapper; 