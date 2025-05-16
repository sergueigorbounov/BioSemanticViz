import React, { useRef, useEffect, useCallback, useState } from 'react';
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
  // Add state to track selected node
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Function to get path from a node to root
  const getPathToRoot = useCallback((node: d3.HierarchyNode<TreeNode> | null): string[] => {
    if (!node) return [];
    
    const path: string[] = [];
    let current: d3.HierarchyNode<TreeNode> | null = node;
    
    while (current) {
      path.push(current.data.id || current.data.name);
      current = current.parent;
    }
    
    return path;
  }, []);
  
  const renderTree = useCallback((treeData: TreeNode) => {
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
    svg.selectAll('*').remove();
    
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
    
    // Get the path to highlight if a node is selected
    const highlightPath = selectedNodeId ? 
      getPathToRoot(treeRoot.descendants().find(d => (d.data.id || d.data.name) === selectedNodeId) || null) : 
      [];
    
    // Add links between nodes
    g.selectAll('.link')
      .data(treeRoot.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', (d) => {
        // Use rectangular/square-angled path instead of curved links
        return `M${d.source.y},${d.source.x}
                L${d.source.y},${d.target.x}
                L${d.target.y},${d.target.x}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#aaa')
      .attr('stroke-width', (d) => {
        // Thicken the line if it's part of the path to root
        const sourceId = d.source.data.id || d.source.data.name;
        const targetId = d.target.data.id || d.target.data.name;
        if (highlightPath.includes(sourceId) && highlightPath.includes(targetId)) {
          return 3;
        }
        return 1.5;
      })
      .attr('stroke-opacity', (d) => {
        // Make highlighted path more opaque
        const sourceId = d.source.data.id || d.source.data.name;
        const targetId = d.target.data.id || d.target.data.name;
        if (highlightPath.includes(sourceId) && highlightPath.includes(targetId)) {
          return 1;
        }
        return 0.7;
      });
    
    // Create node groups
    const nodes = g.selectAll('.node')
      .data(treeRoot.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y}, ${d.x})`)
      .on('click', (event, d) => {
        // Toggle node selection
        const nodeId = d.data.id || d.data.name;
        setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId);
      });
    
    // Add node circles
    nodes.append('circle')
      .attr('r', d => {
        const nodeId = d.data.id || d.data.name;
        return highlightPath.includes(nodeId) ? 7 : 5;
      })
      .attr('fill', d => {
        const nodeId = d.data.id || d.data.name;
        if (highlightPath.includes(nodeId)) {
          // Use a darker shade for highlighted nodes
          const baseColor = getColorByType(d.data.type);
          return d3.color(baseColor)?.darker(0.5).toString() || baseColor;
        }
        return getColorByType(d.data.type);
      })
      .attr('stroke', d => {
        const nodeId = d.data.id || d.data.name;
        return highlightPath.includes(nodeId) ? '#fff' : '#eee';
      })
      .attr('stroke-width', d => {
        const nodeId = d.data.id || d.data.name;
        return highlightPath.includes(nodeId) ? 2 : 1.5;
      });
    
    // Add node labels
    nodes.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.children ? -8 : 8)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => truncateLabel(d.data.name))
      .attr('font-size', d => {
        const nodeId = d.data.id || d.data.name;
        return highlightPath.includes(nodeId) ? '12px' : '10px';
      })
      .attr('font-weight', d => {
        const nodeId = d.data.id || d.data.name;
        return highlightPath.includes(nodeId) ? 'bold' : 'normal';
      })
      .attr('fill', d => {
        const nodeId = d.data.id || d.data.name;
        return highlightPath.includes(nodeId) ? '#000' : '#333';
      })
      .append('title')  // Add tooltip with full name
      .text(d => d.data.name);
  }, [selectedNodeId, getPathToRoot]);
  
  useEffect(() => {
    if (!data || loading || error) return;
    
    // Clear previous visualization
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll('*').remove();
    }
    
    // Create the tree visualization
    renderTree(data);
  }, [data, loading, error, renderTree, selectedNodeId]);
  
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