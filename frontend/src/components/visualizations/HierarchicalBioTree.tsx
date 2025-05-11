import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import './HierarchicalBioTree.css';

// Define the TreeNodeData interface that was missing
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

  // Create a tree layout
  const createTreeLayout = () => {
    if (!svgRef.current) return;
    
    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();
    
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create hierarchy
    const root = d3.hierarchy(data);
    
    // Create tree layout
    const treeLayout = d3.tree<TreeNodeData>()
      .size([innerHeight, innerWidth]);
    
    // Compute layout
    treeLayout(root);
    
    // Add links
    svg.selectAll('.link')
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
      .attr('stroke-width', 1.5);
    
    // Add nodes
    const nodes = svg.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', d => `node ${d.data._childrenLoaded ? 'expanded' : ''}`)
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => handleNodeClick(d.data));
    
    // Add node circles
    nodes.append('circle')
      .attr('r', 8)
      .attr('fill', (d) => {
        switch (d.data.type) {
          case 'species': return '#4CAF50'; // Green
          case 'orthogroup': return '#2196F3'; // Blue
          case 'gene': return '#F44336'; // Red
          default: return '#9E9E9E'; // Gray
        }
      });
    
    // Add labels
    nodes.append('text')
      .attr('dy', '.31em')
      .attr('x', (d) => d.children ? -12 : 12)
      .attr('text-anchor', (d) => d.children ? 'end' : 'start')
      .text((d) => d.data.name)
      .attr('font-size', '12px')
      .attr('fill', '#333');

    // Add expand/collapse indicators
    nodes.filter((d) => !d.data._childrenLoaded && 
                         (d.data.type === 'species' || d.data.type === 'orthogroup'))
      .append('text')
      .attr('dy', '0.3em')
      .attr('x', 0)
      .attr('text-anchor', 'middle')
      .text('+')
      .attr('font-size', '16px')
      .attr('fill', '#FFF');
  };

  const handleNodeClick = async (node: TreeNodeData) => {
    if (node._childrenLoaded) {
      // Toggle visibility (implement collapse functionality)
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
  };

  const updateTreeData = (nodeId: string, children: TreeNodeData[]) => {
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
  };

  useEffect(() => {
    if (!svgRef.current) return;
    
    createTreeLayout();
    
  }, [data, width, height]);

  return (
    <Box sx={{ position: 'relative', overflow: 'auto' }}>
      <svg ref={svgRef} />
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