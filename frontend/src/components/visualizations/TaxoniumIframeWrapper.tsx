import React, { useEffect, useRef } from 'react';

// Define the props interface
interface TaxoniumIframeWrapperProps {
  treeData: any;
  newick: string;
  width?: string | number;
  height?: string | number;
  showMetadata?: boolean;
  onNodeSelect?: (nodeData: any) => void;
  onLoad?: () => void;
  onError?: (errorMessage: string) => void;
}

/**
 * Wrapper component to use Taxonium in an iframe
 */
const TaxoniumIframeWrapper: React.FC<TaxoniumIframeWrapperProps> = ({
  treeData,
  newick,
  width = '100%',
  height = '600px',
  showMetadata = true,
  onNodeSelect,
  onLoad,
  onError
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Setup communication with the iframe
  useEffect(() => {
    // Setup message event listener
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'nodeSelect' && onNodeSelect) {
        onNodeSelect(event.data.node);
      } else if (event.data && event.data.type === 'taxoniumReady') {
        // Taxonium is loaded and ready, send the data
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'updateData',
            data: treeData,
            newick: newick
          }, '*');
        }

        // Call onLoad callback if provided
        if (onLoad) {
          onLoad();
        }
      } else if (event.data && event.data.type === 'taxoniumError') {
        // If there was an error in the iframe
        if (onError) {
          onError(event.data.message || 'Error in Taxonium visualization');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Cleanup function
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [treeData, newick, onNodeSelect, onLoad, onError]);

  return (
    <iframe
      ref={iframeRef}
      src={`${window.location.protocol}//${window.location.hostname}:3002?embedded=true&showMetadata=${showMetadata}`}
      style={{
        width: width,
        height: height,
        border: 'none'
      }}
      title="Taxonium Visualization"
      onError={() => onError?.('Failed to load iframe')}
    />
  );
};

export default TaxoniumIframeWrapper; 