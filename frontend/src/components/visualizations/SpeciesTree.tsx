import React, { useRef, useEffect, useCallback } from 'react';
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

    // Add links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<any, any>()
        .x((d: any) => d.y)
        .y((d: any) => d.x)
      )
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1.5);

    // Add nodes
    const node = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
      .on('click', (event, d: any) => {
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
      .attr('r', 5)
      .attr('fill', (d: any) => d.data.type === 'species' ? '#4caf50' : '#2196f3')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add node labels
    node.append('text')
      .attr('dy', '.31em')
      .attr('x', (d: any) => d.children ? -8 : 8)
      .attr('text-anchor', (d: any) => d.children ? 'end' : 'start')
      .text((d: any) => d.data.name)
      .attr('font-size', '12px')
      .attr('fill', '#333');
  }, [treeData, onSpeciesSelect, onOrthogroupSelect]);

  useEffect(() => {
    if (treeData && svgRef.current) {
      renderTree();
    }
  }, [treeData, renderTree]);

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