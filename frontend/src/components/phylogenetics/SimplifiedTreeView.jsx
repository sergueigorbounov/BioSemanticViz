import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box, Typography, Alert } from '@mui/material';

const SimplifiedTreeView = ({ treeData }) => {
  const svgRef = useRef(null);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    if (!treeData || !svgRef.current) {
      setError("No tree data available to visualize");
      return;
    }

    // Reset error state
    setError(null);

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    try {
      // Verify treeData structure
      if (!treeData || (Array.isArray(treeData.nodes) && treeData.nodes.length === 0)) {
        throw new Error("Tree data is empty or malformed");
      }

      // Set up dimensions and margins
      const width = 800;
      const height = 500;
      const margin = { top: 20, right: 90, bottom: 30, left: 90 };

      // Create SVG element
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Create hierarchical data
      let root;
      if (treeData.nodes && Array.isArray(treeData.nodes)) {
        // Taxonium format with nodes array
        // Convert to hierarchy format for d3
        // Create a map of nodes by ID
        const nodesById = {};
        treeData.nodes.forEach(node => {
          if (!node || !node.id) return; // Skip invalid nodes
          nodesById[node.id] = { 
            ...node, 
            children: [] 
          };
        });

        // Build the tree structure
        let rootNode = null;
        treeData.nodes.forEach(node => {
          if (!node || !node.id) return; // Skip invalid nodes
          if (node.parentId !== undefined && nodesById[node.parentId]) {
            nodesById[node.parentId].children.push(nodesById[node.id]);
          } else {
            // This is the root node
            rootNode = nodesById[node.id];
          }
        });

        if (!rootNode) {
          throw new Error("Could not identify root node in tree data");
        }

        root = d3.hierarchy(rootNode);
      } else {
        // Already in hierarchy format
        root = d3.hierarchy(treeData);
      }

      if (!root) {
        throw new Error("Failed to create hierarchy from tree data");
      }

      // Generate the tree layout
      const treeLayout = d3.tree()
        .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
      
      // Rename treeData to hierarchyData to avoid name collision
      const hierarchyData = treeLayout(root);

      // Add links
      svg.selectAll('.link')
        .data(hierarchyData.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal()
          .x(d => d.y)
          .y(d => d.x)
        )
        .style('fill', 'none')
        .style('stroke', '#aaa')
        .style('stroke-width', 1.5);

      // Add nodes
      const nodes = svg.selectAll('.node')
        .data(hierarchyData.descendants())
        .enter()
        .append('g')
        .attr('class', d => `node ${d.children ? 'node--internal' : 'node--leaf'}`)
        .attr('transform', d => `translate(${d.y},${d.x})`);

      // Add circles to nodes
      nodes.append('circle')
        .attr('r', 5)
        .style('fill', d => d.children ? '#888' : '#55f')
        .style('stroke', '#fff')
        .style('stroke-width', 1);

      // Add labels to nodes
      nodes.append('text')
        .attr('dy', '.31em')
        .attr('x', d => d.children ? -8 : 8)
        .style('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.name || 'Node')
        .style('font-size', '10px');

    } catch (error) {
      console.error('Error rendering simplified tree:', error);
      setError(error.message || "Failed to render tree visualization");
      
      // Show error message in the SVG
      d3.select(svgRef.current)
        .append('text')
        .attr('x', 50)
        .attr('y', 50)
        .text('Error rendering tree data')
        .style('fill', 'red');
    }
  }, [treeData]);

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <Typography variant="subtitle2" gutterBottom>
        Simple Tree Visualization (Fallback)
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <svg ref={svgRef} width="800" height="500" />
    </Box>
  );
};

export default SimplifiedTreeView; 