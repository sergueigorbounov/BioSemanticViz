import React, { useState, useEffect } from 'react';
import './App.css';
import TaxoniumWrapper from './TaxoniumWrapper';

function App() {
  const [treeData, setTreeData] = useState<any>(null);
  const [newickData, setNewickData] = useState<string>("");
  const [dataReady, setDataReady] = useState<boolean>(false);

  // Mock data example for testing
  useEffect(() => {
    const mockTreeData = {
      id: "root",
      name: "root",
      children: [
        {
          id: "A",
          name: "A",
          branch_length: 0.1,
          children: [
            { id: "A1", name: "A1", branch_length: 0.05 },
            { id: "A2", name: "A2", branch_length: 0.07 }
          ]
        },
        {
          id: "B",
          name: "B",
          branch_length: 0.2,
          children: [
            { id: "B1", name: "B1", branch_length: 0.08 },
            { id: "B2", name: "B2", branch_length: 0.11 }
          ]
        }
      ]
    };
    
    const mockNewick = "(((A:0.1,B:0.2):0.3,(C:0.3,D:0.4):0.5):0.1,E:0.7);";

    setTreeData(mockTreeData);
    setNewickData(mockNewick);
    setDataReady(true);
  }, []);

  useEffect(() => {
    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TAXONIUM_IFRAME_LOADED') {
        console.log('Taxonium iframe is loaded and ready');
        // Send tree data to the iframe
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'INIT_TAXONIUM',
            treeData: treeData,
            newick: newickData
          }, '*');
        }
      } else if (event.data?.type === 'TAXONIUM_READY') {
        console.log('Taxonium component initialized with data');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [treeData, newickData]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Taxonium Visualization</h1>
      </header>
      <div style={{ width: '100%', height: '600px', padding: '20px' }}>
        <TaxoniumWrapper 
          width="100%"
          height="100%" 
        />
      </div>
    </div>
  );
}

export default App;
