import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Box, Typography, CircularProgress } from '@mui/material';

interface TreeNode {
  name: string;
  id?: string;
  type?: string;
  properties?: Record<string, any>;
  children?: TreeNode[];
  depth?: number;
}

interface PhylogeneticTreeProps {
  data: TreeNode | null;
  loading?: boolean;
  error?: string | null;
}

const PhylogeneticTree: React.FC<PhylogeneticTreeProps> = ({ data, loading, error }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!data || loading || error) return;
    
    // Clear previous visualization
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll('*').remove();
    }
    
    // Create the tree visualization
    renderTree(data);
  }, [data, loading, error]);
  
  const renderTree = (treeData: TreeNode) => {
    if (!svgRef.current) return;
    
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Create a tree layout
    const treeLayout = d3.tree<TreeNode>()
      .size([height - 100, width - 200]);
    
    // Create a hierarchy from the data
    const root = d3.hierarchy(treeData);
    
    // Compute the tree layout
    const treeRoot = treeLayout(root);
    
    // Create an SVG element
    const svg = d3.select(svgRef.current);
    
    // Create a group for the tree
    const g = svg
      .append('g')
      .attr('transform', `translate(100, 50)`);
    
    // Add zoom and pan behavior
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        })
    );
    
    // Add links between nodes
    g.selectAll('.link')
      .data(treeRoot.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
        .x(d => d.y)
        .y(d => d.x))
      .attr('fill', 'none')
      .attr('stroke', '#aaa')
      .attr('stroke-width', 1.5);
    
    // Create node groups
    const nodes = g.selectAll('.node')
      .data(treeRoot.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y}, ${d.x})`);
    
    // Add node circles
    nodes.append('circle')
      .attr('r', 5)
      .attr('fill', d => getColorByType(d.data.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
    
    // Add node labels
    nodes.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.children ? -8 : 8)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => truncateLabel(d.data.name))
      .append('title')  // Add tooltip with full name
      .text(d => d.data.name);
  };
  
  const getColorByType = (type?: string): string => {
    if (!type) return '#999';
    
    const colorMap: Record<string, string> = {
      'Function': '#1f77b4',
      'MolecularFunction': '#1f77b4',
      'BiologicalProcess': '#2ca02c',
      'CellularComponent': '#d62728',
      'Gene': '#ff7f0e',
      'Protein': '#9467bd',
      'Species': '#8c564b',
      'Taxon': '#e377c2',
      'Organism': '#7f7f7f',
    };
    
    return colorMap[type] || '#999';
  };
  
  const truncateLabel = (text: string): string => {
    return text.length > 25 ? text.substring(0, 22) + '...' : text;
  };
  
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
        width="100%"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
        width="100%"
        flexDirection="column"
      >
        <Typography variant="h6" color="error" gutterBottom>
          Error loading visualization
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {error}
        </Typography>
      </Box>
    );
  }
  
  if (!data) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
        width="100%"
      >
        <Typography variant="body1" color="textSecondary">
          No data to visualize
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ cursor: 'grab' }}
      />
    </Box>
  );
};

export default PhylogeneticTree; 