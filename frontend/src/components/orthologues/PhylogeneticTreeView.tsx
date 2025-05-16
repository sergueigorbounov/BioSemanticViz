import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Box, Typography, CircularProgress, Alert, FormControl, FormControlLabel, Switch } from '@mui/material';
import { OrthoSpeciesCount } from '../../api/orthologueClient';

interface PhylogeneticTreeViewProps {
  newickData: string;
  speciesCounts: OrthoSpeciesCount[];
  selectedSpecies?: string | null;
  onSpeciesSelected?: (speciesName: string | null) => void;
  onTreeDataLoad?: (loaded: boolean) => void;
}

interface TreeNode {
  id: string;
  name: string;
  length?: number;
  children?: TreeNode[];
  x?: number;
  y?: number;
  count?: number;
  depth?: number;
}

const PhylogeneticTreeView: React.FC<PhylogeneticTreeViewProps> = ({ 
  newickData, 
  speciesCounts,
  selectedSpecies,
  onSpeciesSelected,
  onTreeDataLoad
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  // Track selected node internally but also respect parent component selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Add state for visualization options
  const [useRadialLayout, setUseRadialLayout] = useState<boolean>(false);
  
  // Helper function to normalize species names for comparison
  const normalizeSpeciesName = useCallback((name: string): string => {
    return name.toLowerCase().trim().replace(/[_\s-]+/g, '');
  }, []);
  
  // Helper function to check if two species names match
  const doSpeciesNamesMatch = useCallback((name1: string, name2: string): boolean => {
    const normalized1 = normalizeSpeciesName(name1);
    const normalized2 = normalizeSpeciesName(name2);
    
    // Exact match
    if (normalized1 === normalized2) return true;
    
    // Check if one name contains the other
    if (normalized1.includes(normalized2)) return true;
    if (normalized2.includes(normalized1)) return true;
    
    // Check if one is the prefix of the other (for abbreviated species names)
    if (normalized1.startsWith(normalized2) || normalized2.startsWith(normalized1)) return true;
    
    return false;
  }, [normalizeSpeciesName]);
  
  // Function to get path from node to root
  const getPathToRoot = useCallback((node: d3.HierarchyNode<TreeNode> | null): string[] => {
    if (!node) return [];
    
    const path: string[] = [];
    let current: d3.HierarchyNode<TreeNode> | null = node;
    
    while (current) {
      path.push(current.data.id);
      current = current.parent;
    }
    
    return path;
  }, []);

  // Handle selected species from parent component
  useEffect(() => {
    if (!treeData || selectedSpecies === undefined) return;

    console.log("PhylogeneticTreeView - selectedSpecies prop changed:", selectedSpecies);
    
    if (selectedSpecies) {
      // Find the corresponding node in the tree
      const findNodeBySpeciesName = (node: TreeNode): TreeNode | null => {
        // Use the enhanced species name matching
        if (doSpeciesNamesMatch(node.name, selectedSpecies) || doSpeciesNamesMatch(node.id, selectedSpecies)) {
          console.log(`Found tree node matching selected species: ${selectedSpecies}`, node);
          return node;
        }
        
        if (node.children) {
          for (const child of node.children) {
            const found = findNodeBySpeciesName(child);
            if (found) return found;
          }
        }
        
        return null;
      };
      
      const foundNode = findNodeBySpeciesName(treeData);
      if (foundNode) {
        console.log(`Setting selectedNodeId to ${foundNode.id} for species: ${selectedSpecies}`);
        setSelectedNodeId(foundNode.id);
      } else {
        console.log(`Could not find node for species: ${selectedSpecies}`);
        // Try an alternative approach - check all species counts
        const speciesCountMatch = speciesCounts.find(
          sc => doSpeciesNamesMatch(sc.species_name, selectedSpecies) || doSpeciesNamesMatch(sc.species_id, selectedSpecies)
        );
        
        if (speciesCountMatch) {
          // Try finding by this alternative name
          const secondAttempt = findNodeBySpeciesName(treeData);
          if (secondAttempt) {
            console.log(`Found match on second attempt for: ${speciesCountMatch.species_name}`);
            setSelectedNodeId(secondAttempt.id);
            return;
          }
        }
        
        // Log available nodes for debugging
        const allNodes: TreeNode[] = [];
        const collectAllNodes = (node: TreeNode) => {
          allNodes.push(node);
          if (node.children) {
            node.children.forEach(collectAllNodes);
          }
        };
        collectAllNodes(treeData);
        
        console.log("Available tree nodes:", allNodes.map(n => ({ id: n.id, name: n.name })));
        console.log("Available species counts:", speciesCounts.map(s => ({ id: s.species_id, name: s.species_name })));
        
        setSelectedNodeId(null);
      }
    } else if (selectedSpecies === null) {
      // Clear selection if parent cleared it
      console.log("Clearing selectedNodeId as selectedSpecies is null");
      setSelectedNodeId(null);
    }
  }, [selectedSpecies, treeData, doSpeciesNamesMatch, speciesCounts]);

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
        const parseSubtree = (str: string, id = 'root', depth = 0): TreeNode => {
          // If there are no parentheses, this is a leaf node
          if (!str.includes('(')) {
            const [name, lengthStr] = str.split(':');
            return {
              id: name.trim() || id,
              name: name.trim() || id,
              length: lengthStr ? parseFloat(lengthStr) : undefined,
              depth: depth
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
            depth: depth,
            children: childStrings.map((childStr, i) => parseSubtree(childStr, `${id}_${i}`, depth + 1))
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
            s => doSpeciesNamesMatch(s.species_name, node.name) || doSpeciesNamesMatch(s.species_id, node.name)
          );
          if (match) {
            node.count = match.count;
          }
        } else {
          // For internal nodes, compute sum of children counts
          let totalCount = 0;
          if (node.children) {
            node.children.forEach(child => {
              addCountsToTree(child);
              totalCount += child.count || 0;
            });
          }
          // Only set non-zero counts
          if (totalCount > 0) {
            node.count = totalCount;
          }
        }
      };
      
      addCountsToTree(parsedTree);
      console.log("Parsed tree with counts:", parsedTree);
      setTreeData(parsedTree);
      
      // If selectedSpecies is already set, find and select the corresponding node
      if (selectedSpecies) {
        const findNodeBySpeciesName = (node: TreeNode): TreeNode | null => {
          if (doSpeciesNamesMatch(node.name, selectedSpecies)) {
            return node;
          }
          
          if (node.children) {
            for (const child of node.children) {
              const found = findNodeBySpeciesName(child);
              if (found) return found;
            }
          }
          
          return null;
        };
        
        const foundNode = findNodeBySpeciesName(parsedTree);
        if (foundNode) {
          setSelectedNodeId(foundNode.id);
        }
      }
    } catch (err) {
      console.error('Error parsing Newick data:', err);
      setError('Failed to parse tree data');
    } finally {
      setLoading(false);
    }
  }, [newickData, speciesCounts, selectedSpecies, doSpeciesNamesMatch]);

  // Update the renderTree function to add zoom/pan and improve layouts
  const renderTree = useCallback(() => {
    if (!svgRef.current || !treeData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;
    
    // Create a container for zooming/panning
    const container = svg
      .attr('width', width)
      .attr('height', height)
      .append('g');
      
    // Add zoom and pan behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5]) // Set min/max zoom scale
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Add a subtle background grid for better orientation during panning/zooming
    const grid = container.append('g').attr('class', 'grid');
    
    // Add some light grid lines
    const gridSize = 50;
    const numHorizontal = Math.ceil(width / gridSize);
    const numVertical = Math.ceil(height / gridSize);
    
    for (let i = 0; i <= numHorizontal; i++) {
      grid.append('line')
        .attr('x1', i * gridSize)
        .attr('y1', 0)
        .attr('x2', i * gridSize)
        .attr('y2', height)
        .attr('stroke', '#f0f0f0')
        .attr('stroke-width', 1);
    }
    
    for (let i = 0; i <= numVertical; i++) {
      grid.append('line')
        .attr('x1', 0)
        .attr('y1', i * gridSize)
        .attr('x2', width)
        .attr('y2', i * gridSize)
        .attr('stroke', '#f0f0f0')
        .attr('stroke-width', 1);
    }
    
    // Add a group for the visualization content
    const g = container.append('g');
    
    // Position differently based on layout type
    if (useRadialLayout) {
      // Center the radial tree
      g.attr('transform', `translate(${width / 2}, ${height / 2})`);
    } else {
      // Give the rectangular tree more space on the left for labels
      g.attr('transform', `translate(${width * 0.1}, ${height / 2})`);
    }

    // Create the hierarchy
    const root = d3.hierarchy(treeData) as d3.HierarchyNode<TreeNode>;

    // Configure the tree layout
    if (useRadialLayout) {
      // iTOL-style radial layout:
      // 1. Use cluster layout to position leaf nodes equidistant around the circle
      // 2. Apply proper spacing for the radial layout
      const radius = Math.min(width, height) * 0.4;
      
      // Use cluster instead of tree to get iTOL-style equal spacing of leaf nodes
      const treeLayout = d3.cluster<TreeNode>()
        .size([2 * Math.PI, radius])
        .separation((a, b) => {
          // Custom separation function for more iTOL-like spacing
          return (a.parent === b.parent ? 1 : 2);
        });
        
      treeLayout(root);
      
      // Convert to Cartesian coordinates for easy access later
      root.each(d => {
        // Store the original polar coordinates
        (d as any).polar = { angle: d.x, radius: d.y };
        // No need to modify d.x and d.y as we'll calculate cartesian coords when needed
      });
    } else {
      // Enhanced rectangular tree layout
      // Start with a standard tree layout
      const treeHeight = height * 0.9; // Use most of the height
      const treeWidth = width * 0.8;  // Use most of the width
      
      const treeLayout = d3.tree<TreeNode>()
        .size([treeHeight, treeWidth])
        .separation((a, b) => {
          // Increase separation between nodes based on their data
          return (a.parent === b.parent ? 1.2 : 2);
        });
      
      treeLayout(root);
      
      // Shift the tree to better center it vertically
      root.each(d => {
        if (d.x !== undefined) {
          d.x -= treeHeight / 2;
        }
      });
    }

    // Create a scale for node size based on count
    const nodeScale = d3.scaleLinear()
      .domain([0, d3.max(speciesCounts, d => d.count) || 1])
      .range([3, 10]);

    // Find the path from a selected node to the root
    const getHighlightedPathToRoot = (nodeId: string | null): string[] => {
      if (!nodeId) return [];
      
      const findNode = (node: d3.HierarchyNode<TreeNode>, id: string): d3.HierarchyNode<TreeNode> | null => {
        if (node.data.id === id) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNode(child, id);
            if (found) return found;
          }
        }
        return null;
      };
      
      const selectedNode = findNode(root, nodeId);
      return getPathToRoot(selectedNode);
    };
    
    const highlightedPath = getHighlightedPathToRoot(selectedNodeId);
    console.log("Path to highlight:", highlightedPath);

    // Draw links between nodes
    const links = g.append('g')
      .attr('class', 'links');
      
    if (useRadialLayout) {
      // iTOL-style radial links
      links.selectAll('.link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', (d: any) => {
          // Get polar coordinates
          const sourceAngle = d.source.x;
          const sourceRadius = d.source.y;
          const targetAngle = d.target.x;
          const targetRadius = d.target.y;
          
          // Convert to Cartesian coordinates
          const sourceX = sourceRadius * Math.sin(sourceAngle);
          const sourceY = -sourceRadius * Math.cos(sourceAngle);
          const targetX = targetRadius * Math.sin(targetAngle);
          const targetY = -targetRadius * Math.cos(targetAngle);
          
          // Use curved lines for radial layout
          // For iTOL-style, we want a combination of straight lines and arcs
          
          // First calculate an intermediate point (same angle as source, same radius as target)
          const midX = targetRadius * Math.sin(sourceAngle);
          const midY = -targetRadius * Math.cos(sourceAngle);
          
          // For small angle differences, just use a simple curve
          if (Math.abs(sourceAngle - targetAngle) < 0.1) {
            return `M${sourceX},${sourceY} L${targetX},${targetY}`;
          }
          
          // For larger angles, create an iTOL-style path with straight line + arc
          return `M${sourceX},${sourceY} 
                  L${midX},${midY} 
                  A${targetRadius},${targetRadius} 0 
                  ${Math.abs(targetAngle - sourceAngle) > Math.PI ? 1 : 0} 
                  ${targetAngle > sourceAngle ? 1 : 0} 
                  ${targetX},${targetY}`;
        })
        .attr('fill', 'none')
        .attr('stroke', (d: any) => {
          const isHighlighted = highlightedPath.includes(d.source.data.id) && 
                             highlightedPath.includes(d.target.data.id);
          return isHighlighted ? '#1976d2' : '#ccc';
        })
        .attr('stroke-width', (d: any) => {
          const isHighlighted = highlightedPath.includes(d.source.data.id) && 
                             highlightedPath.includes(d.target.data.id);
          return isHighlighted ? 2 : 1;
        })
        .attr('stroke-opacity', 0.8);
        
      // Add circular guide lines (like iTOL)
      const guideCircles = [0.25, 0.5, 0.75, 1.0];
      const maxRadius = d3.max(root.descendants(), d => d.y) || 0;
      
      guideCircles.forEach(percent => {
        g.append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', maxRadius * percent)
          .attr('fill', 'none')
          .attr('stroke', '#eaeaea')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3');
      });
    } else {
      // Enhanced rectangular tree links with right-angled connections
      links.selectAll('.link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', (d: any) => {
          // Create a right-angled path between nodes
          return `M${d.source.y},${d.source.x}
                  L${d.source.y},${d.target.x}
                  L${d.target.y},${d.target.x}`;
        })
        .attr('fill', 'none')
        .attr('stroke', (d: any) => {
          const isHighlighted = highlightedPath.includes(d.source.data.id) && 
                             highlightedPath.includes(d.target.data.id);
          return isHighlighted ? '#1976d2' : '#ccc';
        })
        .attr('stroke-width', (d: any) => {
          const isHighlighted = highlightedPath.includes(d.source.data.id) && 
                             highlightedPath.includes(d.target.data.id);
          return isHighlighted ? 2 : 1;
        })
        .attr('stroke-opacity', 0.8);
        
      // Add horizontal guide lines for rectangular layout
      const depths = Array.from(
        new Set(root.descendants().map(d => d.y).filter((y): y is number => y !== undefined))
      ).sort((a, b) => a - b);
      depths.forEach(depth => {
        g.append('line')
          .attr('x1', depth)
          .attr('y1', -height/2)
          .attr('x2', depth)
          .attr('y2', height/2)
          .attr('stroke', '#eaeaea')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3');
      });
    }

    // Create node groups that contain the circle and text
    const nodes = g.append('g')
      .attr('class', 'nodes')
      .selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => {
        if (useRadialLayout) {
          // For radial layout, convert from polar to cartesian coordinates
          const x = d.y * Math.sin(d.x);
          const y = -d.y * Math.cos(d.x);
          return `translate(${x},${y})`;
        } else {
          // For rectangular layout
          return `translate(${d.y},${d.x})`;
        }
      })
      .style('cursor', 'pointer')
      .style('opacity', 1);

    // Draw the node circles with enhanced styling
    nodes.append('circle')
      .attr('r', (d: any) => {
        const isLeaf = !d.children || d.children.length === 0;
        // Larger circles for nodes with orthologue counts
        if (isLeaf && d.data.count) {
          return nodeScale(d.data.count);
        }
        return isLeaf ? 4 : 2;
      })
      .attr('fill', (d: any) => {
        // Selected node in blue, nodes with orthologues in green, others in gray
        if (d.data.id === selectedNodeId) {
          return '#1976d2'; // Primary blue for selected node
        } else if (highlightedPath.includes(d.data.id)) {
          return '#90caf9'; // Lighter blue for nodes in the path
        } else if (d.data.count && d.data.count > 0) {
          return '#4caf50'; // Green for nodes with orthologues
        }
        return '#9e9e9e'; // Gray for others
      })
      .attr('stroke', (d: any) => {
        if (d.data.id === selectedNodeId) {
          return '#0d47a1'; // Darker blue border for selected node
        } else if (highlightedPath.includes(d.data.id)) {
          return '#42a5f5'; // Medium blue border for path nodes
        }
        return d.data.count && d.data.count > 0 ? '#2e7d32' : '#616161';
      })
      .attr('stroke-width', (d: any) => d.data.id === selectedNodeId ? 2 : 1)
      .on('mouseover', function() {
        d3.select(this).transition().duration(200).attr('r', function(d: any) {
          const currentRadius = parseFloat(d3.select(this).attr('r'));
          return currentRadius * 1.3;
        });
      })
      .on('mouseout', function() {
        d3.select(this).transition().duration(200).attr('r', function(d: any) {
          const isLeaf = !d.children || d.children.length === 0;
          if (isLeaf && d.data.count) {
            return nodeScale(d.data.count);
          }
          return isLeaf ? 4 : 2;
        });
      });

    // Add labels to nodes with iTOL-style positioning
    nodes.append('text')
      .attr('dy', '.31em')
      .attr('x', (d: any) => {
        if (useRadialLayout) {
          // Place labels radially
          const angle = d.x;
          return angle > Math.PI / 2 && angle < Math.PI * 3 / 2 ? -15 : 15; 
        } else {
          // Place labels based on node type
          const isLeaf = !d.children || d.children.length === 0;
          return isLeaf ? 8 : -8;
        }
      })
      .attr('text-anchor', (d: any) => {
        if (useRadialLayout) {
          // Place text on the appropriate side based on position around circle
          const angle = d.x;
          return angle > Math.PI / 2 && angle < Math.PI * 3 / 2 ? 'end' : 'start';
        } else {
          // For rectangular layout
          const isLeaf = !d.children || d.children.length === 0;
          return isLeaf ? 'start' : 'end';
        }
      })
      .attr('transform', (d: any) => {
        if (useRadialLayout) {
          // Rotate text to be tangent to the circle (iTOL style)
          const angle = d.x * 180 / Math.PI;
          const rotation = angle > 90 && angle < 270 ? angle + 180 : angle;
          return `rotate(${rotation - 90})`;
        }
        return null;
      })
      .text((d: any) => {
        const isLeaf = !d.children || d.children.length === 0;
        
        // Show names for leaf nodes and selected path
        if (isLeaf || d.data.id === selectedNodeId || highlightedPath.includes(d.data.id)) {
          // Truncate long names
          const name = d.data.name;
          const displayName = name.length > 20 ? name.substring(0, 18) + '...' : name;
          return displayName + (d.data.count ? ` (${d.data.count})` : '');
        }
        
        return '';
      })
      .attr('fill', (d: any) => {
        if (d.data.id === selectedNodeId) {
          return '#1976d2'; // Blue for selected node
        } else if (highlightedPath.includes(d.data.id)) {
          return '#1976d2'; // Blue for path nodes
        }
        return '#333';
      })
      .attr('font-weight', (d: any) => {
        return d.data.id === selectedNodeId || highlightedPath.includes(d.data.id)
          ? 'bold'
          : 'normal';
      })
      .attr('font-size', '12px');

    // Add tooltips to nodes
    nodes.append('title')
      .text((d: any) => {
        const count = d.data.count || 0;
        return `${d.data.name} (${count} orthologue${count !== 1 ? 's' : ''})`;
      });
      
    // Add click handler to nodes for selection
    nodes.on('click', (event, d) => {
      // Toggle node selection
      event.stopPropagation();
      const newSelectedId = d.data.id === selectedNodeId ? null : d.data.id;
      console.log(`Node clicked: ${d.data.name} (${d.data.id}), was selected: ${d.data.id === selectedNodeId}`);
      setSelectedNodeId(newSelectedId);
      
      // Notify parent component about species selection for two-way binding
      if (onSpeciesSelected) {
        const speciesName = newSelectedId === null ? null : d.data.name;
        console.log(`Notifying parent of species selection: ${speciesName}`);
        onSpeciesSelected(speciesName);
      }
    });

    // Add a click handler to clear selection when clicking on the background
    svg.on('click', (event: MouseEvent) => {
      if (event.target === svg.node()) {
        console.log("Background clicked, clearing selection");
        setSelectedNodeId(null);
        if (onSpeciesSelected) {
          onSpeciesSelected(null);
        }
      }
    });
    
    // Add double click to reset zoom
    svg.on('dblclick', () => {
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
    });
    
    // Notify that tree data is loaded and rendered
    if (onTreeDataLoad) {
      onTreeDataLoad(true);
    }
  }, [treeData, svgRef, selectedNodeId, useRadialLayout, speciesCounts, getPathToRoot, onSpeciesSelected, onTreeDataLoad]);

  // Add useEffect to call renderTree when dependencies change
  useEffect(() => {
    renderTree();
  }, [renderTree]);

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
      {/* Tree Display Controls */}
      <Box sx={{ 
        position: 'absolute', 
        top: 5, 
        right: 5, 
        zIndex: 10,
        background: 'rgba(255,255,255,0.85)',
        padding: '5px 10px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="caption" display="block" gutterBottom>
          View Options
        </Typography>
        <FormControlLabel
          control={
            <Switch 
              size="small"
              checked={useRadialLayout}
              onChange={(e) => setUseRadialLayout(e.target.checked)}
            />
          }
          label={<Typography variant="caption">{useRadialLayout ? "Radial" : "Rectangular"}</Typography>}
        />
      </Box>
      
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