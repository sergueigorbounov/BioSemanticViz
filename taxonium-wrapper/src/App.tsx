import React, { useEffect, useState } from 'react';
// Import with dynamic patching for ?? operator
const TaxoniumComponent = React.lazy(() => {
  // Monkey-patch the nullish coalescing operator
  const originalEval = window.eval;
  window.eval = function(code) {
    // Replace ?? with custom function to handle nullish coalescing
    code = code.replace(/\?\?/g, ') || (');
    return originalEval.call(this, code);
  };
  
  // Import the component
  return import('taxonium-component').then(module => {
    // Restore original eval
    window.eval = originalEval;
    return module;
  });
});

// Define the expected message structure from the parent window
interface TreeDataMessage {
  type: string;
  treeData?: any;
  newick?: string;
}

const App: React.FC = () => {
  const [treeData, setTreeData] = useState<any>(null);
  const [newick, setNewick] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  // When the component mounts, notify the parent window
  useEffect(() => {
    // Send a message to the parent window that the iframe is loaded
    window.parent.postMessage({ type: 'TAXONIUM_IFRAME_LOADED' }, '*');
    
    // Listen for messages from the parent window
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as TreeDataMessage;
      
      // Check if the message is for initializing Taxonium
      if (data?.type === 'INIT_TAXONIUM' && data.treeData) {
        console.log('Received tree data from parent window');
        setTreeData(data.treeData);
        if (data.newick) {
          setNewick(data.newick);
        }
        
        // Notify the parent that we've received the data
        window.parent.postMessage({ type: 'TAXONIUM_READY' }, '*');
      }
    };
    
    window.addEventListener('message', handleMessage);
    setLoaded(true);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {loaded && (
        <div style={{ padding: '0px', width: '100%', height: '100%' }}>
          {treeData ? (
            <React.Suspense fallback={
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#666'
              }}>
                Loading Taxonium component...
              </div>
            }>
              <TaxoniumComponent 
                width="100%"
                height="100%"
                data={treeData} 
                newick={newick} 
                customNavbar={null}
              />
            </React.Suspense>
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#666'
            }}>
              Waiting for tree data...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App; 