import React, { useEffect, useState } from 'react';
// Just use React for now, without importing Taxonium
// import TaxoniumComponent from 'taxonium-component';

function App() {
  const [treeData, setTreeData] = useState(null);
  const [newickData, setNewickData] = useState(null);

  // Setup window message listener
  useEffect(() => {
    console.log('Taxonium micro-frontend initialized');
    
    const handleMessage = (event) => {
      console.log('Received message:', event.data);
      if (event.data && event.data.type === 'INIT_TAXONIUM') {
        console.log('Received tree data from parent application');
        setTreeData(event.data.treeData || null);
        setNewickData(event.data.newick || null);
        
        // Respond to parent that we received the data
        window.parent.postMessage({ type: 'TAXONIUM_READY' }, '*');
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Signal to parent that iframe is ready
    console.log('Sending TAXONIUM_IFRAME_LOADED message to parent');
    window.parent.postMessage({ type: 'TAXONIUM_IFRAME_LOADED' }, '*');
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Create a simple placeholder visualization
  return (
    <div className="App" style={{ padding: '20px' }}>
      {treeData ? (
        <div>
          <h2 style={{ color: '#2e7d32' }}>Taxonium Micro-Frontend</h2>
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            padding: '15px',
            marginTop: '10px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>Tree Data Received:</h3>
            <pre style={{ 
              backgroundColor: '#f0f0f0', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(treeData, null, 2)}
            </pre>
            
            {newickData && (
              <>
                <h3>Newick Format:</h3>
                <pre style={{ 
                  backgroundColor: '#f0f0f0', 
                  padding: '10px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '100px'
                }}>
                  {newickData.substring(0, 500)}...
                </pre>
              </>
            )}
            
            <div style={{ 
              marginTop: '20px', 
              padding: '10px', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '4px',
              color: '#2e7d32'
            }}>
              <strong>Success!</strong> This placeholder confirms the micro-frontend architecture is working.
              Once proper Taxonium integration is fixed, this component will be replaced with the actual visualization.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '600px',
          fontSize: '16px',
          color: '#666'
        }}>
          Waiting for tree data...
        </div>
      )}
    </div>
  );
}

export default App; 