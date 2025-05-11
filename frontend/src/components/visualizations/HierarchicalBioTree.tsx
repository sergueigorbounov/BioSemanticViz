import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { Box, CircularProgress, Button, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import './HierarchicalBioTree.css';

// Define the TreeNodeData interface
export interface TreeNodeData {
  id: string;
  name: string;
  type: 'species' | 'orthogroup' | 'gene' | string;
  children?: TreeNodeData[];
  // Additional metadata
  scientific_name?: string;
  common_name?: string;
  description?: string;
  taxonomy_id?: number;
  _childrenLoaded?: boolean;
  _children?: TreeNodeData[]; // For collapsed nodes
}

interface HierarchicalBioTreeProps {
  initialData: TreeNodeData;
  width?: number;
  height?: number;
}

const HierarchicalBioTree: React.FC<HierarchicalBioTreeProps> = ({ 
  initialData, 
  width = 900, 
  height = 700 
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<TreeNodeData>(initialData);
  const [loading, setLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tooltip, setTooltip] = useState<{visible: boolean, content: string, x: number, y: number}>({
    visible: false,
    content: '',
    x: 0,
    y: 0
  });

  // Generate tooltip content based on node data
  const generateTooltipContent = (node: TreeNodeData): string => {
    let content = `<strong>${node.name}</strong>`;
    
    if (node.type) {
      content += `<br>Type: ${node.type}`;
    }
    
    if (node.scientific_name) {
      content += `<br>Scientific Name: ${node.scientific_name}`;
    }
    
    if (node.common_name) {
      content += `<br>Common Name: ${node.common_name}`;
    }
    
    if (node.description) {
      // Truncate description if too long
      const desc = node.description.length > 100 
        ? node.description.substring(0, 97) + '...' 
        : node.description;
      content += `<br>Description: ${desc}`;
    }
    
    return content;
  };

  // Define update functions before using them in useCallback
  const updateTreeData = useCallback((nodeId: string, children: TreeNodeData[]) => {
    // Function to recursively find and update a node by ID
    const updateNode = (currentNode: TreeNodeData): TreeNodeData => {
      if (currentNode.id === nodeId) {
        return {
          ...currentNode,
          children: children,
          _childrenLoaded: true
        };
      }
      
      if (currentNode.children) {
        return {
          ...currentNode,
          children: currentNode.children.map(updateNode)
        };
      }
      
      return currentNode;
    };
    
    setData(updateNode(data));
  }, [data]);
  
  const updateTreeDataForCollapse = useCallback((nodeId: string, children: TreeNodeData[]): TreeNodeData => {
    // Function for collapsing nodes
    const updateNode = (currentNode: TreeNodeData): TreeNodeData => {
      if (currentNode.id === nodeId) {
        return {
          ...currentNode,
          _children: children,
          children: [],
          _childrenLoaded: true
        };
      }
      
      if (currentNode.children) {
        return {
          ...currentNode,
          children: currentNode.children.map(updateNode)
        };
      }
      
      return currentNode;
    };
    
    return updateNode(data);
  }, [data]);
  
  const updateTreeDataForExpand = useCallback((nodeId: string, children: TreeNodeData[]): TreeNodeData => {
    // Function for expanding nodes
    const updateNode = (currentNode: TreeNodeData): TreeNodeData => {
      if (currentNode.id === nodeId) {
        return {
          ...currentNode,
          children: children,
          _children: [],
          _childrenLoaded: true
        };
      }
      
      if (currentNode.children) {
        return {
          ...currentNode,
          children: currentNode.children.map(updateNode)
        };
      }
      
      return currentNode;
    };
    
    return updateNode(data);
  }, [data]);

  const handleNodeClick = useCallback(async (node: TreeNodeData) => {
    if (node._childrenLoaded) {
      // Toggle node expansion/collapse
      if (node.children && node.children.length > 0) {
        // Collapse: store children and set children to empty array
        setData(updateTreeDataForCollapse(node.id, node.children));
      } else if (node._children && node._children.length > 0) {
        // Expand: restore children from _children
        setData(updateTreeDataForExpand(node.id, node._children));
      }
      return;
    }

    setLoading(node.id);
    
    try {
      // Load children based on node type
      if (node.type === 'species') {
        // Load orthogroups for this species
        const response = await axios.get(`http://localhost:8002/api/species/${node.id}/orthogroups`);
        if (response.data.success) {
          const orthogroups = response.data.data.map((og: any) => ({
            id: og.id,
            name: og.name,
            type: 'orthogroup',
            description: og.description || 'No description available',
            children: [],
            _childrenLoaded: false
          }));
          
          // Update the data to include the orthogroups
          updateTreeData(node.id, orthogroups);
        }
      } 
      else if (node.type === 'orthogroup') {
        // Load genes for this orthogroup
        const response = await axios.get(`http://localhost:8002/api/orthogroup/${node.id}/genes`);
        if (response.data.success) {
          const genes = response.data.data.map((gene: any) => ({
            id: gene.id,
            name: gene.label || gene.name,
            type: 'gene',
            description: gene.description || 'No description available',
            species_id: gene.species_id,
            children: [],
            _childrenLoaded: true
          }));
          
          // Update the data to include the genes
          updateTreeData(node.id, genes);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(null);
    }
  }, [updateTreeData, updateTreeDataForCollapse, updateTreeDataForExpand]);

  const createTreeLayout = useCallback(() => {
    if (!svgRef.current) return;
    
    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();
    
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
      
    // Add zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoomBehavior);
    
    // Add main group for transformations
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create hierarchy
    const root = d3.hierarchy(data);
    
    // Create tree layout
    const treeLayout = d3.tree<TreeNodeData>()
      .size([innerHeight, innerWidth]);
    
    // Compute layout
    treeLayout(root);
    
    // Add links with transitions
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', (d: any) => {
        return `M${d.source.y},${d.source.x}
                L${d.source.y},${d.target.x}
                L${d.target.y},${d.target.x}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .attr('opacity', 1);
    
    // Add nodes with transitions
    g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', d => `node ${d.data._childrenLoaded ? 'expanded' : ''} ${searchTerm && d.data.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 'search-match' : ''}`)
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .attr('cursor', 'pointer')
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((d, i) => i * 10)
      .attr('opacity', 1);
    
    // Add node interactive elements after transitions
    g.selectAll('.node')
      .on('click', (event, d: any) => handleNodeClick(d.data))
      .on('mouseover', (event, d: any) => {
        // Generate tooltip content
        const content = generateTooltipContent(d.data);
        // Set tooltip position and content - use functional state update to avoid closure issues
        setTooltip(prev => ({
          visible: true,
          content,
          x: event.pageX,
          y: event.pageY
        }));
      })
      .on('mouseout', () => {
        // Use functional state update to avoid stale closures
        setTooltip(prev => ({...prev, visible: false}));
      });
    
    // Add node circles
    g.selectAll('.node')
      .append('circle')
      .attr('r', 8)
      .attr('fill', (d: any) => {
        switch (d.data.type) {
          case 'species': return '#4CAF50'; // Green
          case 'orthogroup': return '#2196F3'; // Blue
          case 'gene': return '#F44336'; // Red
          default: return '#9E9E9E'; // Gray
        }
      });
    
    // Add labels
    g.selectAll('.node')
      .append('text')
      .attr('dy', '.31em')
      .attr('x', (d: any) => d.children ? -12 : 12)
      .attr('text-anchor', (d: any) => d.children ? 'end' : 'start')
      .text((d: any) => d.data.name)
      .attr('font-size', '12px')
      .attr('fill', '#333');

    // Add expand/collapse indicators
    g.selectAll('.node')
      .filter((d: any) => d.data._childrenLoaded)
      .append('text')
      .attr('dy', '0.3em')
      .attr('x', 0)
      .attr('text-anchor', 'middle')
      .text('-')  // Minus sign for collapsing
      .attr('font-size', '16px')
      .attr('fill', '#FFF');
      
    g.selectAll('.node')
      .filter((d: any) => !d.data._childrenLoaded && 
                         (d.data.type === 'species' || d.data.type === 'orthogroup'))
      .append('text')
      .attr('dy', '0.3em')
      .attr('x', 0)
      .attr('text-anchor', 'middle')
      .text('+')  // Plus sign for expanding
      .attr('font-size', '16px')
      .attr('fill', '#FFF');
      
    // Highlight search matches
    if (searchTerm) {
      g.selectAll('.node.search-match circle')
        .attr('stroke', '#FF9800')
        .attr('stroke-width', 3);
    }
  }, [data, width, height, searchTerm, handleNodeClick]);
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(d3.zoom<SVGSVGElement, unknown>().scaleBy, 1.3);
  };
  
  const handleZoomOut = () => {
    if (!svgRef.current) return;
    
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(d3.zoom<SVGSVGElement, unknown>().scaleBy, 0.7);
  };
  
  const handleReset = () => {
    if (!svgRef.current) return;
    
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
  };
  
  const handleExport = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'biological_tree.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!svgRef.current) return;
    
    createTreeLayout();
    
  }, [data, width, height, searchTerm, createTreeLayout]);

  return (
    <Box sx={{ position: 'relative', overflow: 'auto' }}>
      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          placeholder="Search nodes..."
          size="small"
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: '300px' }}
        />
        <Box>
          <Button 
            onClick={handleZoomIn} 
            size="small" 
            variant="outlined"
            sx={{ mx: 0.5 }}
          >
            Zoom In
          </Button>
          <Button 
            onClick={handleZoomOut}
            size="small"
            variant="outlined"
            sx={{ mx: 0.5 }}
          >
            Zoom Out
          </Button>
          <Button 
            onClick={handleReset}
            size="small"
            variant="outlined"
            sx={{ mx: 0.5 }}
          >
            Reset
          </Button>
          <Button 
            onClick={handleExport}
            size="small"
            variant="outlined"
            sx={{ mx: 0.5 }}
          >
            Export
          </Button>
        </Box>
      </Box>
      
      {/* Tree SVG */}
      <svg ref={svgRef} />
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div 
          className="tooltip" 
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            opacity: 1,
            position: 'fixed',
            zIndex: 9999,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            pointerEvents: 'none',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
      
      {/* Loading overlay */}
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            padding: 2,
            borderRadius: 2
          }}
        >
          <CircularProgress size={30} />
        </Box>
      )}
    </Box>
  );
};

export default HierarchicalBioTree; 