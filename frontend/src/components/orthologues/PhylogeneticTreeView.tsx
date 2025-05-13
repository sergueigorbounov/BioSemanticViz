import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { OrthoSpeciesCount } from '../../api/orthologueClient';

interface PhylogeneticTreeViewProps {
  newickData: string;
  speciesCounts: OrthoSpeciesCount[];
}

interface TreeNode {
  id: string;
  name: string;
  length?: number;
  children?: TreeNode[];
  x?: number;
  y?: number;
  count?: number;
}

const PhylogeneticTreeView: React.FC<PhylogeneticTreeViewProps> = ({ 
  newickData, 
  speciesCounts 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);

  // Parse Newick string to tree hierarchy
  useEffect(() => {
    if (!newickData) {
      setError('No tree data provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use D3 Hierarchy to parse the Newick string
      // This is a simplified approach - in a real app, you might use a dedicated Newick parser
      const parseNewick = (newickString: string): TreeNode => {
        // Basic Newick parsing - this is simplified and might not handle all Newick formats
        // For production, use a proper Newick parser library

        // Remove any whitespace and the trailing semicolon
        const cleaned = newickString.trim().replace(/;$/, '');
        
        // Recursive function to parse nested structure
        const parseSubtree = (str: string, id = 'root'): TreeNode => {
          // If there are no parentheses, this is a leaf node
          if (!str.includes('(')) {
            const [name, lengthStr] = str.split(':');
            return {
              id: name.trim() || id,
              name: name.trim() || id,
              length: lengthStr ? parseFloat(lengthStr) : undefined
            };
          }
          
          // Find matching closing parenthesis for the first opening parenthesis
          let openCount = 0;
          let childrenStr = '';
          let nameAndLength = '';
          let foundOpeningParen = false;
          
          for (let i = 0; i < str.length; i++) {
            const char = str[i];
            
            if (char === '(') {
              if (foundOpeningParen) {
                childrenStr += char;
              } else {
                foundOpeningParen = true;
              }
              openCount++;
            } else if (char === ')') {
              openCount--;
              if (openCount === 0) {
                nameAndLength = str.substring(i + 1);
                break;
              } else {
                childrenStr += char;
              }
            } else if (foundOpeningParen) {
              childrenStr += char;
            }
          }
          
          // Split child nodes by commas, but only at the top level
          const childStrings: string[] = [];
          let currentChild = '';
          openCount = 0;
          
          for (let i = 0; i < childrenStr.length; i++) {
            const char = childrenStr[i];
            
            if (char === '(') {
              openCount++;
              currentChild += char;
            } else if (char === ')') {
              openCount--;
              currentChild += char;
            } else if (char === ',' && openCount === 0) {
              childStrings.push(currentChild);
              currentChild = '';
            } else {
              currentChild += char;
            }
          }
          
          if (currentChild) {
            childStrings.push(currentChild);
          }
          
          // Parse name and length from the remaining string
          const [name, lengthStr] = nameAndLength.split(':');
          
          // Create node with children
          const node: TreeNode = {
            id: name.trim() || id,
            name: name.trim() || id,
            length: lengthStr ? parseFloat(lengthStr) : undefined,
            children: childStrings.map((childStr, i) => parseSubtree(childStr, `${id}_${i}`))
          };
          
          return node;
        };
        
        return parseSubtree(cleaned);
      };

      const parsedTree = parseNewick(newickData);
      
      // Add count information to the tree nodes
      const addCountsToTree = (node: TreeNode): void => {
        // If this is a leaf node, try to match it with a species in the counts
        if (!node.children || node.children.length === 0) {
          const match = speciesCounts.find(
            s => s.species_name === node.name || s.species_id === node.name
          );
          if (match) {
            node.count = match.count;
          }
        }
        
        // Process children recursively
        if (node.children) {
          node.children.forEach(addCountsToTree);
        }
      };
      
      addCountsToTree(parsedTree);
      setTreeData(parsedTree);
    } catch (err) {
      console.error('Error parsing Newick data:', err);
      setError('Failed to parse tree data');
    } finally {
      setLoading(false);
    }
  }, [newickData, speciesCounts]);

  // Render the tree using D3
  useEffect(() => {
    if (!treeData || !svgRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 30, right: 120, bottom: 30, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create a hierarchical layout
    const root = d3.hierarchy(treeData);
    
    // Calculate the tree layout
    const treeLayout = d3.tree<TreeNode>()
      .size([innerHeight, innerWidth]);
    
    treeLayout(root);

    // Create the SVG container with zoom/pan behavior
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          g.attr('transform', `translate(${event.transform.x + margin.left},${event.transform.y + margin.top}) scale(${event.transform.k})`);
        })
    );

    // Add links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d => {
        const path = d3.linkHorizontal<d3.HierarchyLink<TreeNode>, any>()
          .x(d => d.y || 0)
          .y(d => d.x || 0);
        return path(d) || '';
      })
      .attr('fill', 'none')
      .attr('stroke', '#aaa')
      .attr('stroke-width', 1.5);

    // Add nodes
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`);

    // Add circles for nodes
    nodes.append('circle')
      .attr('r', d => {
        // Scale the circle radius based on the count (if available)
        const count = d.data.count || 0;
        return count > 0 ? Math.min(10, Math.max(4, Math.log(count + 1) * 3)) : 4;
      })
      .attr('fill', d => {
        // Color the nodes based on whether they have orthologues
        return d.data.count ? '#1976d2' : '#aaa';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add count labels for nodes with orthologues
    nodes.filter(d => typeof d.data.count === 'number' && d.data.count > 0)
      .append('text')
      .attr('dy', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#1976d2')
      .text(d => d.data.count !== undefined ? String(d.data.count) : '');

    // Add text labels
    nodes.append('text')
      .attr('dy', 3)
      .attr('x', d => d.children ? -8 : 8)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => {
        // Truncate long names
        const name = d.data.name;
        return name.length > 20 ? name.substring(0, 17) + '...' : name;
      })
      .attr('font-size', '10px')
      .attr('fill', '#333');

    // Add tooltips using title elements
    nodes.append('title')
      .text(d => {
        const count = d.data.count || 0;
        return `${d.data.name}${count ? ` (${count} orthologues)` : ''}`;
      });

  }, [treeData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!treeData) {
    return (
      <Box p={2}>
        <Typography>No tree data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%"
        style={{ cursor: 'grab' }}
      />
      <Typography 
        variant="caption" 
        component="div"
        sx={{ 
          position: 'absolute', 
          bottom: 5, 
          left: 5, 
          background: 'rgba(255,255,255,0.7)',
          padding: '2px 5px'
        }}
      >
        <strong>Note:</strong> Larger circles indicate more orthologues
      </Typography>
    </Box>
  );
};

export default PhylogeneticTreeView; 