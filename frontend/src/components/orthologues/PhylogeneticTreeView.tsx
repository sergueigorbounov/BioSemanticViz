import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { OrthoSpeciesCount, OrthologueSearchResponse } from '../../api/orthologueClient';

interface PhylogeneticTreeViewProps {
  orthologues: OrthologueSearchResponse | null;
  newickTree: string | null;
  loading: boolean;
}

// Interface for processed tree nodes
interface TreeNode {
  name: string;
  children?: TreeNode[];
  depth?: number;
  x?: number;
  y?: number;
  count?: number;
}

const PhylogeneticTreeView: React.FC<PhylogeneticTreeViewProps> = ({
  orthologues,
  newickTree,
  loading,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset error state on new data
    setError(null);
    
    if (loading) {
      return;
    }

    if (!orthologues || !newickTree) {
      // Don't set error for empty data
      return;
    }

    try {
      // Parse the Newick tree
      const root = parseNewickTree(newickTree);

      // Attach the orthologues data to the tree nodes
      if (orthologues.success && orthologues.counts_by_species) {
        annotateTreeWithCounts(root, orthologues.counts_by_species);
      }

      // Create the visualization
      createVisualization(root);
    } catch (err) {
      console.error('Error creating tree visualization:', err);
      setError('Failed to process the phylogenetic tree data.');
    }
  }, [orthologues, newickTree, loading]);

  // Parse Newick format tree string to hierarchical structure
  const parseNewickTree = (newickString: string): TreeNode => {
    // Simple Newick parser
    let i = 0;
    
    function parseNode(): TreeNode {
      let node: TreeNode = { name: '' };
      let children: TreeNode[] = [];
      
      // Read until we find a closing bracket, comma, or colon
      while (i < newickString.length) {
        const char = newickString[i];
        
        if (char === '(') {
          // Start of children
          i++;
          children.push(parseNode());
          
          // Process siblings
          while (newickString[i] === ',') {
            i++;
            children.push(parseNode());
          }
          
          // End of children
          if (newickString[i] === ')') {
            i++;
            node.children = children;
          } else {
            throw new Error('Missing closing parenthesis in Newick string');
          }
        } else if (char === ',' || char === ')' || char === ':' || char === ';') {
          // End of this node
          break;
        } else {
          // Part of the node name
          node.name += char;
          i++;
        }
      }
      
      // Read branch length if present
      if (i < newickString.length && newickString[i] === ':') {
        i++; // Skip the colon
        let lengthStr = '';
        while (i < newickString.length && 
               !isNaN(Number(newickString[i])) || 
               newickString[i] === '.' || 
               newickString[i] === 'e' || 
               newickString[i] === '-' || 
               newickString[i] === '+') {
          lengthStr += newickString[i];
          i++;
        }
      }
      
      return node;
    }
    
    const root = parseNode();
    
    // Skip the final semicolon if present
    if (i < newickString.length && newickString[i] === ';') {
      i++;
    }
    
    return root;
  };

  // Add counts data to tree nodes
  const annotateTreeWithCounts = (node: TreeNode, speciesCounts: OrthoSpeciesCount[]) => {
    if (!node) return;
    
    // Attempt to match this node with a species in the counts data
    const match = speciesCounts.find(
      s => s.species_name === node.name || s.species_id === node.name
    );
    if (match) {
      node.count = match.count;
    }
    
    // Recursively process children
    if (node.children) {
      node.children.forEach(child => annotateTreeWithCounts(child, speciesCounts));
    }
  };

  // Create the D3 visualization
  const createVisualization = (root: TreeNode) => {
    if (!svgRef.current) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    const width = 900;
    const height = 600;
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };
    
    // Create a tree layout
    const treeLayout = d3.tree<TreeNode>()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    
    // Create a hierarchy from the root node
    const hierarchy = d3.hierarchy(root);
    
    // Generate the tree data
    const treeData = treeLayout(hierarchy);
    
    // Create the SVG element
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create links
    svg.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
        .x(d => d.y)
        .y(d => d.x)
      )
      .style('fill', 'none')
      .style('stroke', '#ccc')
      .style('stroke-width', 2);
    
    // Create nodes
    const node = svg.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', d => 'node' + (d.children ? ' node--internal' : ' node--leaf'))
      .attr('transform', d => `translate(${d.y},${d.x})`);
    
    // Add circles to nodes
    node.append('circle')
      .attr('r', d => (d.data.count && d.data.count > 0) ? 
        Math.max(3, Math.min(10, 3 + Math.log(d.data.count))) : 3)
      .style('fill', d => (d.data.count && d.data.count > 0) ? '#ff7f0e' : '#4682b4')
      .style('stroke', '#fff')
      .style('stroke-width', 1);
    
    // Add labels to nodes
    node.append('text')
      .attr('dy', '.31em')
      .attr('x', d => d.children ? -8 : 8)
      .style('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => `${d.data.name}${d.data.count ? ` (${d.data.count})` : ''}`)
      .style('font-size', '12px');
    
    // Add tooltips for nodes with counts
    node.append('title')
      .text(d => {
        return d.data.count ? 
          `${d.data.name}: ${d.data.count} orthologues` : 
          d.data.name;
      });
  };

  // Render different states based on loading, error or data
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!orthologues || !newickTree) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1">No phylogenetic data available. Please select a gene or protein.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Tree Display Controls */}
      {/* ... existing controls ... */}
      
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '10px',
          height: '10px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '5px',
        }
      }}>
        <svg 
          ref={svgRef} 
          width="100%" 
          height="100%"
          style={{ cursor: 'grab', minHeight: "600px" }}
        />
      </Box>
      
      <Typography 
        variant="caption" 
        component="div"
        sx={{ 
          position: 'absolute', 
          bottom: 5, 
          left: 5, 
          background: 'rgba(255,255,255,0.7)',
          padding: '2px 5px',
          borderRadius: '4px'
        }}
      >
        <strong>Tips:</strong> Scroll to zoom, drag to pan, click nodes to select, double-click to reset view.
      </Typography>
    </Box>
  );
};

export default PhylogeneticTreeView; 