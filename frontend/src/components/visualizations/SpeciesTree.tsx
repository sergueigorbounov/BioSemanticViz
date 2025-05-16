import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import * as d3 from 'd3';
import { SpeciesTreeData } from '../../types/biology';

interface SpeciesTreeProps {
  treeData: SpeciesTreeData | null;
  onSpeciesSelect?: (speciesId: string) => void;
  onOrthogroupSelect?: (orthogroupId: string) => void;
}

const SpeciesTree: React.FC<SpeciesTreeProps> = ({ 
  treeData, 
  onSpeciesSelect, 
  onOrthogroupSelect 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // Add state to track selected node ID
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Function to get path to root for a given node
  const getPathToRoot = useCallback((node: d3.HierarchyNode<any> | null): string[] => {
    if (!node) return [];
    
    const path: string[] = [];
    let current: d3.HierarchyNode<any> | null = node;
    while (current) {
      path.push(current.data.id);
      current = current.parent;
    }
    return path;
  }, []);

  const renderTree = useCallback(() => {
    if (!svgRef.current || !treeData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Set dimensions
    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };

    // Create tree layout
    const treeLayout = d3.tree<any>()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    // Create a hierarchy from the data
    const root = d3.hierarchy(treeData) as d3.HierarchyNode<any>;
    
    // Compute the tree layout
    treeLayout(root);

    // Create the group that will contain the tree
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get path to root for highlighting
    const highlightPath = selectedNodeId ? 
      getPathToRoot(root.descendants().find(d => d.data.id === selectedNodeId) || null) : 
      [];

    // Add links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', (d: any) => {
        // Use rectangular/square-angled path instead of curved links
        return `M${d.source.y},${d.source.x}
                L${d.source.y},${d.target.x}
                L${d.target.y},${d.target.x}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', (d: any) => {
        // Thicken the line if it's part of the path to root
        if (highlightPath.includes(d.source.data.id) && 
            highlightPath.includes(d.target.data.id)) {
          return 3;
        }
        return 1.5;
      })
      .attr('stroke-opacity', (d: any) => {
        // Make highlighted path more opaque
        if (highlightPath.includes(d.source.data.id) && 
            highlightPath.includes(d.target.data.id)) {
          return 1;
        }
        return 0.7;
      });

    // Add nodes
    const node = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
      .on('click', (event, d: any) => {
        // Set this node as selected (or toggle off if already selected)
        setSelectedNodeId(d.data.id === selectedNodeId ? null : d.data.id);
        
        // Determine if this is a species node or orthogroup node
        const isSpecies = d.data.type === 'species';
        if (isSpecies && onSpeciesSelect) {
          onSpeciesSelect(d.data.id);
        } else if (!isSpecies && onOrthogroupSelect) {
          onOrthogroupSelect(d.data.id);
        }
      });

    // Add node circles
    node.append('circle')
      .attr('r', (d: any) => highlightPath.includes(d.data.id) ? 7 : 5)
      .attr('fill', (d: any) => {
        // Use brighter color for highlighted nodes
        if (highlightPath.includes(d.data.id)) {
          return d.data.type === 'species' ? '#2e7d32' : '#1565c0';
        }
        return d.data.type === 'species' ? '#4caf50' : '#2196f3';
      })
      .attr('stroke', (d: any) => highlightPath.includes(d.data.id) ? '#fff' : '#eee')
      .attr('stroke-width', (d: any) => highlightPath.includes(d.data.id) ? 2 : 1.5);

    // Add node labels
    node.append('text')
      .attr('dy', '.31em')
      .attr('x', (d: any) => d.children ? -8 : 8)
      .attr('text-anchor', (d: any) => d.children ? 'end' : 'start')
      .text((d: any) => d.data.name)
      .attr('font-size', '12px')
      .attr('font-weight', (d: any) => highlightPath.includes(d.data.id) ? 'bold' : 'normal')
      .attr('fill', (d: any) => highlightPath.includes(d.data.id) ? '#000' : '#333');
  }, [treeData, onSpeciesSelect, onOrthogroupSelect, selectedNodeId, getPathToRoot]);

  useEffect(() => {
    if (treeData && svgRef.current) {
      renderTree();
    }
  }, [treeData, renderTree, selectedNodeId]);

  if (!treeData) {
    return (
      <Paper sx={{ p: 3, height: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '600px', overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Species Hierarchy
      </Typography>
      <Box sx={{ width: '100%', height: '550px', overflow: 'auto' }}>
        <svg ref={svgRef} width="100%" height="100%" />
      </Box>
    </Paper>
  );
};

export default SpeciesTree; 