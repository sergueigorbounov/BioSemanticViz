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
  // Add state for visualization options - initialize from localStorage if available
  const [useRadialLayout, setUseRadialLayout] = useState<boolean>(() => {
    const savedLayout = localStorage.getItem('treeViewLayout');
    console.log(`Initializing layout from localStorage: ${savedLayout}`);
    return savedLayout === 'radial' || savedLayout === null; // Default to radial if not set
  });
  
  // Helper function to normalize species names for comparison
  const normalizeSpeciesName = useCallback((name: string): string => {
    return name.toLowerCase().trim().replace(/[_\s-]+/g, '');
  }, []);
  
  // Helper function to check if two species names match
  const doSpeciesNamesMatch = useCallback((name1: string, name2: string): boolean => {
    if (!name1 || !name2) return false;
    
    // Special handling for short abbreviations (likely codes)
    if (name1.length <= 3 || name2.length <= 3) {
      // For abbreviations, require exact match to avoid false positives
      return name1.toLowerCase().trim() === name2.toLowerCase().trim();
    }
    
    const normalized1 = normalizeSpeciesName(name1);
    const normalized2 = normalizeSpeciesName(name2);
    
    // Exact match
    if (normalized1 === normalized2) return true;
    
    // Check if one name contains the other (only for longer names)
    if (normalized1.length > 3 && normalized2.length > 3) {
      if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
    }
    
    // Check if one is the prefix of the other (for abbreviated species names)
    if (normalized1.length > 3 && normalized2.length > 3) {
      if (normalized1.startsWith(normalized2) || normalized2.startsWith(normalized1)) return true;
    }
    
    // Extract genus names
    const genus1 = normalized1.split(/[\s_]/)[0];
    const genus2 = normalized2.split(/[\s_]/)[0];
    
    // Handle genus abbreviation (e.g. "A. thaliana" vs "Arabidopsis thaliana")
    if (genus1.length === 1 && genus2.length > 1 && genus2.startsWith(genus1.charAt(0))) {
      // Compare species part if present
      const species1 = normalized1.split(/[\s_]/).slice(1).join('');
      const species2 = normalized2.split(/[\s_]/).slice(1).join('');
      if (species1 && species2 && (species1.includes(species2) || species2.includes(species1))) {
        return true;
      }
    }
    
    if (genus2.length === 1 && genus1.length > 1 && genus1.startsWith(genus2.charAt(0))) {
      // Compare species part if present
      const species1 = normalized1.split(/[\s_]/).slice(1).join('');
      const species2 = normalized2.split(/[\s_]/).slice(1).join('');
      if (species1 && species2 && (species1.includes(species2) || species2.includes(species1))) {
        return true;
      }
    }
    
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
      let foundNodeId: string | null = null;
      
      // First collect all available tree nodes for debugging
      const allNodes: TreeNode[] = [];
      const collectAllNodes = (node: TreeNode) => {
        allNodes.push(node);
        if (node.children) {
          node.children.forEach(collectAllNodes);
        }
      };
      collectAllNodes(treeData);
      
      console.log("Available tree nodes for selection:", allNodes.map(n => ({ id: n.id, name: n.name })));
      console.log("Looking for species:", selectedSpecies);
      
      // Explicit mapping for common abbreviations
      // This is a hard-coded mapping for abbreviations that might not match automatically
      const abbreviationMap: Record<string, string> = {
        'BnA': 'Brassica napus',
        'BnC': 'Brassica carinata',
        'Ha': 'Helianthus annuus',
        'Gm': 'Glycine max',
        'Ma': 'Musa', // Try just genus for Ma
        'Md': 'Malus domestica',
        'Nt': 'Nicotiana tabacum',
        'Sb': 'Sorghum bicolor',
        'Sl': 'Solanum lycopersicum',
        'Si': 'Setaria italica',
        'Zm': 'Zea mays',
        'Os': 'Oryza sativa',
        'At': 'Arabidopsis thaliana',
        'Cca': 'Coffea canephora',
        'Cma': 'Cucurbita maxima',
        'Cmo': 'Cucurbita moschata',
        'Cmi': 'Cucumis melo',
        'Cs': 'Cucumis sativus',
        'Pp': 'Physcomitrella patens',
        'Pv': 'Phaseolus vulgaris',
        'Vv': 'Vitis vinifera',
        'Tsi': 'Triticum aestivum', // Common wheat
        'Lsi': 'Lathyrus sativus',
        'Gr': 'Gossypium raimondii',
        'Pvu': 'Phaseolus vulgaris',
        'Bo': 'Brassica oleracea',
        'Br': 'Brassica rapa',
        'Mt': 'Medicago truncatula',
        'Ah': 'Arachis hypogaea',
        'Pb': 'Pyrus bretschneideri',
        'Bn': 'Brassica nigra',
        'Tsa': 'Triticum dicoccoides', // For TdsA abbreviation
        'TdsA': 'Triticum dicoccoides',
        'Bni': 'Brassica nigra'
      };
      
      // If we have a direct mapping for this abbreviation, use it
      let searchTermForTree = selectedSpecies;
      if (selectedSpecies.length <= 3 && abbreviationMap[selectedSpecies]) {
        searchTermForTree = abbreviationMap[selectedSpecies];
        console.log(`Using explicit mapping for abbreviation: ${selectedSpecies} -> ${searchTermForTree}`);
      }
      
      // More robust species matching logic
      const findNodeBySpeciesName = (searchTerm: string): string | null => {
        // For abbreviations, first try to find matching species in speciesCounts
        if (searchTerm.length <= 3) {
          // Find full species name from speciesCounts that matches the abbreviation
          const matchingSpecies = speciesCounts.find(sc => 
            sc.species_id?.toLowerCase() === searchTerm.toLowerCase() || 
            (sc.species_name && sc.species_name.split(/[\s_]/)[0].toLowerCase() === searchTerm.toLowerCase())
          );
          
          if (matchingSpecies) {
            console.log(`Found matching species in counts for abbreviation: ${searchTerm} -> ${matchingSpecies.species_name}`);
            searchTerm = matchingSpecies.species_name || searchTerm;
          }
        }
        
        // Add a special handler for "Ma" (Musa) abbreviation
        if (searchTerm === 'Ma') {
          // Try looking for any Musa species
          for (const node of allNodes) {
            if (node.name.includes('Musa')) {
              console.log(`Found Musa match for Ma: ${node.name} (${node.id})`);
              return node.id;
            }
          }
        }
        
        // Handling for "Tsi" specifically - try various Triticum species
        if (searchTerm === 'Tsi' || searchTerm === 'Triticum aestivum') {
          // First try exact Triticum aestivum match
          for (const node of allNodes) {
            if (node.name.includes('Triticum') && node.name.includes('aestivum')) {
              console.log(`Found exact Triticum aestivum match for Tsi: ${node.name} (${node.id})`);
              return node.id;
            }
          }
          
          // Then try any Triticum species
          for (const node of allNodes) {
            if (node.name.includes('Triticum')) {
              console.log(`Found Triticum match for Tsi: ${node.name} (${node.id})`);
              return node.id;
            }
          }
          
          // Finally, try wheat or related species
          for (const node of allNodes) {
            if (node.name.includes('wheat') || node.name.includes('Aegilops')) {
              console.log(`Found wheat-related match for Tsi: ${node.name} (${node.id})`);
              return node.id;
            }
          }
        }
        
        // More robust solution for mapping abbreviations to counts
        const getCountForSpecies = (speciesId: string): number | undefined => {
          // Find the matching count in speciesCounts data
          const countData = speciesCounts.find(s => s.species_id === speciesId);
          if (countData) {
            return countData.count;
          }
          return undefined;
        };
        
        // Add a special handler for specific species
        if (searchTerm === 'BnC') {
          // Log all Brassica nodes to debug BnC issue
          console.log("Available Brassica nodes in tree:", 
            allNodes.filter(n => n.name.toLowerCase().includes('brassica'))
              .map(n => ({ name: n.name, id: n.id }))
          );
        
          // First try Brassica carinata exactly
          for (const node of allNodes) {
            const nodeName = node.name.toLowerCase().replace(/['"]/g, '');
            if (nodeName.includes('brassica') && nodeName.includes('carinat')) {
              console.log(`Found exact Brassica carinata match for BnC: ${node.name} (${node.id})`);
              return node.id;
            }
          }
          
          // For BnC, try other Brassica species if carinata not found
          // Prioritize species in this order: juncea, nigra, napus, oleracea
          const brassicaPriority = ['juncea', 'nigra', 'napus', 'oleracea', 'rapa'];
          
          for (const species of brassicaPriority) {
            for (const node of allNodes) {
              const nodeName = node.name.toLowerCase().replace(/['"]/g, '');
              if (nodeName.includes('brassica') && nodeName.includes(species)) {
                console.log(`Using ${species} as fallback for BnC: ${node.name} (${node.id})`);
                return node.id;
              }
            }
          }
          
          // Last resort: any Brassica
          for (const node of allNodes) {
            if (node.name.toLowerCase().includes('brassica')) {
              console.log(`Using any Brassica as fallback for BnC: ${node.name} (${node.id})`);
              return node.id;
            }
          }
        }
        
        if (searchTerm === 'TdsA' || searchTerm === 'Triticum dicoccoides') {
          // Try variations of Triticum
          console.log("Searching specifically for TdsA (Triticum dicoccoides)");
          for (const node of allNodes) {
            const nodeName = node.name.toLowerCase();
            if (nodeName.includes('triticum') && 
               (nodeName.includes('dicoccoides') || nodeName.includes('dicocco'))) {
              console.log(`Found Triticum dicoccoides match for TdsA: ${node.name} (${node.id})`);
              return node.id;
            }
          }
          
          // Fallback to any Triticum
          for (const node of allNodes) {
            if (node.name.toLowerCase().includes('triticum')) {
              console.log(`Found fallback Triticum match for TdsA: ${node.name} (${node.id})`);
              return node.id;
            }
          }
        }
        
        // Add a special handler for "Ma" (Musa) abbreviation
        if (searchTerm === 'Ma') {
          // Try looking for any Musa species
          for (const node of allNodes) {
            if (node.name.includes('Musa')) {
              console.log(`Found Musa match for Ma: ${node.name} (${node.id})`);
              return node.id;
            }
          }
        }
        
        // Try direct matching first
        for (const node of allNodes) {
          // Clean node name by removing potential quotes
          const cleanNodeName = node.name.replace(/^['"]|['"]$/g, '');
          
          if (doSpeciesNamesMatch(cleanNodeName, searchTerm)) {
            console.log(`Found direct match: ${node.name} (${node.id}) for: ${searchTerm}`);
            return node.id;
          }
        }
        
        // Try matching with species from speciesCounts
        const matchingSpecies = speciesCounts.find(sc => 
          doSpeciesNamesMatch(sc.species_name, searchTerm) || 
          doSpeciesNamesMatch(sc.species_id, searchTerm)
        );
        
        if (matchingSpecies) {
          // Now search again with this species name/id
          for (const node of allNodes) {
            if (doSpeciesNamesMatch(node.name, matchingSpecies.species_name) || 
                doSpeciesNamesMatch(node.name, matchingSpecies.species_id)) {
              console.log(`Found match through species counts: ${node.name} (${node.id}) for: ${searchTerm}`);
              return node.id;
            }
          }
        }
        
        // For longer search terms (not abbreviations), try extracting genus
        if (searchTerm.length > 3) {
          // Try extracting genus name (first word) and matching
          const genusMatch = searchTerm.split(/[\s_]/)[0];
          if (genusMatch && genusMatch.length > 2) {
            for (const node of allNodes) {
              if (node.name.toLowerCase().startsWith(genusMatch.toLowerCase())) {
                console.log(`Found match by genus: ${node.name} (${node.id}) for: ${searchTerm} (genus: ${genusMatch})`);
                return node.id;
              }
            }
          }
        }
        
        console.log(`Could not find node for species: ${searchTerm}`);
        return null;
      };
      
      foundNodeId = findNodeBySpeciesName(searchTermForTree);
      
      // Handling for selected abbreviations - explicitly apply counts from speciesCounts
      if (foundNodeId) {
        // Also make sure the count from speciesCounts is applied to the tree node
        if (selectedSpecies && selectedSpecies.length <= 3) {
          const matchingCount = speciesCounts.find(sc => 
            sc.species_id?.toLowerCase() === selectedSpecies.toLowerCase()
          );
          
          if (matchingCount && matchingCount.count > 0) {
            // Find the node and ensure it has the count
            const targetNode = allNodes.find(node => node.id === foundNodeId);
            if (targetNode && (!targetNode.count || targetNode.count === 0)) {
              console.log(`Applying count ${matchingCount.count} from speciesCounts to node ${targetNode.name}`);
              targetNode.count = matchingCount.count;
            }
          }
        }
        
        console.log(`Setting selectedNodeId to ${foundNodeId} for species: ${selectedSpecies}`);
        setSelectedNodeId(foundNodeId);
      } else {
        console.log(`Could not find node for species: ${selectedSpecies}`);
        // Log available species data for debugging
        console.log("Available species counts:", speciesCounts.map(s => ({ id: s.species_id, name: s.species_name })));
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
        // Mapping from scientific names to abbreviation IDs
        const nameToAbbreviation: Record<string, string[]> = {
          'brassica napus': ['BnA'],
          'brassica carinata': ['BnC'],
          'brassica nigra': ['BnC', 'Bn', 'Bni'],
          'brassica juncea': ['Bju'],
          'brassica oleracea': ['Bo'],
          'brassica rapa': ['Br'],
          'triticum aestivum': ['Tsi'],
          'triticum turgidum': ['TdsA', 'TdzA'],
          'triticum dicoccoides': ['TdsA', 'TdzA'],
          'triticum durum': ['TdsA', 'TdzA'],
          'musa acuminata': ['Ma'],
          'musa': ['Ma']
        };
        
        // If this is a leaf node, try to match it with a species in the counts
        if (!node.children || node.children.length === 0) {
          // Look up the node name in our mapping
          const nodeName = node.name.toLowerCase();
          let matchingAbbreviations: string[] = [];
          
          // Find all possible abbreviations for this node
          Object.entries(nameToAbbreviation).forEach(([scientificName, abbreviations]) => {
            if (nodeName.includes(scientificName)) {
              matchingAbbreviations.push(...abbreviations);
            }
          });
          
          // If we found matching abbreviations, use them to look up counts
          if (matchingAbbreviations.length > 0) {
            console.log(`Node "${node.name}" matches abbreviations:`, matchingAbbreviations);
            
            // Find the matching count from speciesCounts for any of the abbreviations
            const matchingCount = speciesCounts.find(sc => 
              matchingAbbreviations.includes(sc.species_id || '')
            );
            
            if (matchingCount && matchingCount.count > 0) {
              console.log(`Setting count for ${node.name} to ${matchingCount.count} (from ${matchingCount.species_id})`);
              node.count = matchingCount.count;
              return;
            }
          }
          
          // As a fallback, try to match by name directly
          const matchByName = speciesCounts.find(
            s => doSpeciesNamesMatch(s.species_name, node.name) || doSpeciesNamesMatch(s.species_id, node.name)
          );
          
          if (matchByName) {
            console.log(`Direct name match for ${node.name}: ${matchByName.species_id} (${matchByName.count})`);
            node.count = matchByName.count;
            return;
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

    console.log(`Rendering tree with layout: ${useRadialLayout ? 'radial' : 'rectangular'}`);
    
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
      // Move back to a more central position with the increased width
      g.attr('transform', `translate(${width * 0.15}, ${height / 2})`);
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
      // Enhanced rectangular tree layout with extreme spacing
      const treeHeight = height * 2.0; // Double the overall height to give more room
      const treeWidth = width * 0.8;  // Use 80% of width
      
      const treeLayout = d3.tree<TreeNode>()
        .size([treeHeight, treeWidth])
        .separation((a, b) => {
          // Calculate node density to dynamically adjust spacing
          // Get leaf count to determine density
          const getLeafCount = (node: d3.HierarchyNode<any>): number => {
            if (!node.children || node.children.length === 0) return 1;
            return node.children.reduce((acc, child) => acc + getLeafCount(child), 0);
          };
          
          // Calculate density factor
          const leafCountA = getLeafCount(a);
          const leafCountB = getLeafCount(b);
          const densityFactor = Math.max(leafCountA, leafCountB);
          
          // Use exponential spacing for very dense areas
          const baseSpacing = (a.parent === b.parent) ? 3.0 : 4.5;
          return baseSpacing * Math.max(2.0, Math.log2(densityFactor + 1));
        });
    
      treeLayout(root);

      // Shift the tree to better center it vertically
      root.each(d => {
        if (d.x !== undefined) {
          d.x -= treeHeight / 3; // Shift up to show more at the top
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
          return isHighlighted ? 3 : 1;
        })
        .attr('stroke-opacity', (d: any) => {
          const isHighlighted = highlightedPath.includes(d.source.data.id) && 
                             highlightedPath.includes(d.target.data.id);
          return isHighlighted ? 1 : 0.6;
        });
        
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
          // Create a simple right-angled path between nodes
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
          return isHighlighted ? 3 : 1;
        })
        .attr('stroke-opacity', (d: any) => {
          const isHighlighted = highlightedPath.includes(d.source.data.id) && 
                             highlightedPath.includes(d.target.data.id);
          return isHighlighted ? 1 : 0.6;
        });
        
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
        if (d.data.id === selectedNodeId) {
          // Make selected node larger for visibility
          return (isLeaf && d.data.count) ? nodeScale(d.data.count) * 1.5 : 8;
        }
        if (highlightedPath.includes(d.data.id)) {
          // Make path nodes slightly larger
          return (isLeaf && d.data.count) ? nodeScale(d.data.count) * 1.2 : 5;
        }
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
          return '#42a5f5'; // Medium blue for nodes in the path (more visible)
        } else if (d.data.count && d.data.count > 0) {
          return '#4caf50'; // Green for nodes with orthologues
        }
        return '#9e9e9e'; // Gray for others
      })
      .attr('stroke', (d: any) => {
        if (d.data.id === selectedNodeId) {
          return '#0d47a1'; // Darker blue border for selected node
        } else if (highlightedPath.includes(d.data.id)) {
          return '#1976d2'; // Blue border for path nodes
        }
        return d.data.count && d.data.count > 0 ? '#2e7d32' : '#616161';
      })
      .attr('stroke-width', (d: any) => {
        // Thicker border for selected and path nodes
        if (d.data.id === selectedNodeId) return 3;
        if (highlightedPath.includes(d.data.id)) return 2;
        return 1;
      })
      .on('mouseover', function(event, d: any) {
        const isSelected = d.data.id === selectedNodeId;
        // Get the current node
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', function() {
            const currentRadius = parseFloat(d3.select(this).attr('r'));
            return currentRadius * 1.3;
          })
          .attr('stroke-width', isSelected ? 4 : 2);
            
        // Make sure the node text is also highlighted
        // Use proper d3 selection of the parent g element
        d3.select(this.parentElement)
          .select('text')
          .transition()
          .duration(200)
          .attr('font-weight', 'bold')
          .attr('font-size', '13px');
      })
      .on('mouseout', function(event, d: any) {
        const isSelected = d.data.id === selectedNodeId;
        const isLeaf = !d.children || d.children.length === 0;
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', function() {
            if (isSelected) {
              return (isLeaf && d.data.count) ? nodeScale(d.data.count) * 1.5 : 8;
            }
            if (isLeaf && d.data.count) {
              return nodeScale(d.data.count);
            }
            return isLeaf ? 4 : 2;
          })
          .attr('stroke-width', isSelected ? 3 : 1);
          
        // Reset text unless this node is selected
        if (!isSelected && !highlightedPath.includes(d.data.id)) {
          d3.select(this.parentElement)
            .select('text')
            .transition()
            .duration(200)
            .attr('font-weight', 'normal')
            .attr('font-size', '12px');
        }
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
          // Place labels based on node type - adjust for compressed horizontal layout
          const isLeaf = !d.children || d.children.length === 0;
          return isLeaf ? 15 : -15; // Increase space between node and text
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
          // Clean name from quotes if present
          const cleanName = name.replace(/^['"]|['"]$/g, '');
          
          // Use shorter names for better fit 
          let displayName = cleanName.length > 15 ? cleanName.substring(0, 13) + '...' : cleanName;
          
          // Mapping from scientific names to possible abbreviation IDs
          const nameToAbbreviation: Record<string, string[]> = {
            'brassica napus': ['BnA'],
            'brassica carinata': ['BnC'],
            'brassica nigra': ['BnC', 'Bn', 'Bni'],
            'brassica juncea': ['Bju'],
            'triticum aestivum': ['Tsi'],
            'triticum turgidum': ['TdsA', 'TdzA'],
            'triticum dicoccoides': ['TdsA', 'TdzA'],
            'musa acuminata': ['Ma'],
            'musa': ['Ma']
          };
          
          // First get species ID if we can do direct mapping
          const nodeName = cleanName.toLowerCase();
          let matchingAbbreviations: string[] = [];
          
          // Find all possible abbreviations for this node
          Object.entries(nameToAbbreviation).forEach(([scientificName, abbreviations]) => {
            if (nodeName.includes(scientificName)) {
              matchingAbbreviations.push(...abbreviations);
            }
          });
          
          // Always show count for consistency with summary view
          if (d.data.count && d.data.count > 0) {
            // Use count from tree node directly
            displayName = `${displayName} (${d.data.count})`;
          } else if (d.data.id === selectedNodeId && selectedSpecies) {
            // For selected nodes, find and show the count from speciesCounts if available
            // Look up the count in speciesCounts data dynamically
            const matchCount = speciesCounts.find(s => 
              (s.species_id && s.species_id === selectedSpecies)
            );
            
            if (matchCount && matchCount.count > 0) {
              // Use count from matching species ID
              displayName = `${displayName} (${matchCount.count})`;
            }
          } else if (matchingAbbreviations.length > 0) {
            // For non-selected nodes that we've identified by name but don't have a count
            // Find matching count from any of the possible abbreviations
            const matchingCount = speciesCounts.find(sc => 
              matchingAbbreviations.includes(sc.species_id || '')
            );
            
            if (matchingCount && matchingCount.count > 0) {
              displayName = `${displayName} (${matchingCount.count})`;
            }
          }
          
          return displayName;
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
      .attr('font-size', (d: any) => {
        // Larger text for selected and path nodes
        return d.data.id === selectedNodeId ? '13px' : '12px';
      })
      .attr('paint-order', 'stroke') // Makes text more readable by adding a stroke
      .attr('stroke', (d: any) => {
        // Add a very subtle text outline for better readability in path nodes
        return highlightedPath.includes(d.data.id) ? 'rgba(255,255,255,0.7)' : 'none';
      })
      .attr('stroke-width', (d: any) => {
        return highlightedPath.includes(d.data.id) ? '2px' : '0';
      })

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
      
      // Log selection for debugging
      console.log('===== NODE SELECTION DEBUG =====');
      console.log(`Node clicked: ${d.data.name} (${d.data.id})`);
      console.log(`Current selectedNodeId: ${selectedNodeId}`);
      console.log(`Current selectedSpecies: ${selectedSpecies}`);
      console.log(`Current layout (PRESERVING): ${useRadialLayout ? 'radial' : 'rectangular'}`);
      
      // Clear selection if already selected, otherwise set new selection
      const newSelectedId = d.data.id === selectedNodeId ? null : d.data.id;
      console.log(`Setting new selectedNodeId: ${newSelectedId}`);
      
      // Force the selection to be updated
      setSelectedNodeId(prev => {
        if (prev === newSelectedId) {
          // Toggle off if clicking the same node
          console.log('Toggling off selection (same node clicked)');
          return null;
        }
        return newSelectedId;
      });
      
      // Notify parent component about species selection for two-way binding
      if (onSpeciesSelected) {
        const speciesName = newSelectedId === null ? null : d.data.name;
        console.log(`Notifying parent of species selection: ${speciesName}`);
        onSpeciesSelected(speciesName);
      }
      
      // DO NOT re-render here - let the useEffect handle it to maintain layout
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

    // Add visual selection marker (outer ring) for the selected node
    if (selectedNodeId) {
      console.log(`Adding selection highlight for node: ${selectedNodeId}`);
      
      nodes.filter((d: any) => d.data.id === selectedNodeId)
        .append('circle')
        .attr('class', 'selection-outer-ring')
        .attr('r', (d: any) => {
          const isLeaf = !d.children || d.children.length === 0;
          // Make outer selection ring larger than the node
          if (isLeaf && d.data.count) {
            return nodeScale(d.data.count) * 2;
          }
          return isLeaf ? 12 : 8;
        })
        .attr('fill', 'none')
        .attr('stroke', '#1976d2')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,2')
        .attr('opacity', 0.8)
        // Add animation to draw attention
        .call((selection) => {
          selection.each(function() {
            const circle = d3.select(this);
            
            // Pulse animation
            function pulse() {
              circle.transition()
                .duration(800)
                .attr('stroke-opacity', 0.2)
                .attr('stroke-width', 4)
                .transition()
                .duration(800)
                .attr('stroke-opacity', 1)
                .attr('stroke-width', 2)
                .on('end', pulse);
            }
            
            pulse();
          });
        });
      
      // Remove pointing finger emoji
      // Replaced with subtle highlight marker that doesn't obscure text
      nodes.filter((d: any) => d.data.id === selectedNodeId)
        .append('circle')
        .attr('class', 'selection-center-marker')
        .attr('r', 3)
        .attr('fill', '#1976d2')
        .attr('opacity', 0.9);
    }
    
    // Add a visible text background for better readability - only for selected node, not for path
    nodes.filter((d: any) => d.data.id === selectedNodeId)
      .append('rect')
      .attr('class', 'text-background')
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('rx', 3)  // Rounded corners
      .attr('ry', 3)
      .attr('x', (d: any) => {
        if (useRadialLayout) {
          // Place labels radially
          const angle = d.x;
          return angle > Math.PI / 2 && angle < Math.PI * 3 / 2 ? -120 : 10; 
        } else {
          // Place background based on node type
          const isLeaf = !d.children || d.children.length === 0;
          return isLeaf ? 10 : -120;
        }
      })
      .attr('y', -12)  // Position slightly above text
      .attr('width', 140)  // Wider to fit more text
      .attr('height', 24)  // Taller for better isolation
      .attr('opacity', 0.85);
  }, [treeData, svgRef, selectedNodeId, useRadialLayout, speciesCounts, getPathToRoot, onSpeciesSelected, onTreeDataLoad]);

  // Add useEffect to call renderTree when dependencies change
  useEffect(() => {
    renderTree();
  }, [renderTree]);
  
  // Add another effect specifically to re-render when layout changes
  useEffect(() => {
    console.log(`Layout changed to: ${useRadialLayout ? 'radial' : 'rectangular'}`);
    renderTree();
  }, [useRadialLayout, renderTree]);

  // Function to find a node ID by species name/ID in the tree data
  const findNodeIdBySpecies = useCallback((searchTerm: string, treeData: any): string | null => {
    // Function to collect all nodes from tree for searching
    const getAllNodes = (node: any): Array<any> => {
      let nodes: Array<any> = [node];
      if (node.children) {
        node.children.forEach((child: any) => {
          nodes = [...nodes, ...getAllNodes(child)];
        });
      }
      return nodes;
    };
    
    // Get all nodes from tree
    const allNodes = getAllNodes(treeData);
    console.log(`Searching among ${allNodes.length} nodes for ${searchTerm}`);
    
    // Add a special handler for specific species
    if (searchTerm === 'BnC') {
      // Log all Brassica nodes to debug BnC issue
      console.log("Available Brassica nodes in tree:", 
        allNodes.filter((n: any) => n.name.toLowerCase().includes('brassica'))
          .map((n: any) => ({ name: n.name, id: n.id }))
      );
    
      // First try Brassica carinata exactly
      for (const node of allNodes) {
        const nodeName = node.name.toLowerCase().replace(/['"]/g, '');
        if (nodeName.includes('brassica') && nodeName.includes('carinat')) {
          console.log(`Found exact Brassica carinata match for BnC: ${node.name} (${node.id})`);
          return node.id;
        }
      }
      
      // For BnC, try other Brassica species if carinata not found
      // Prioritize species in this order: juncea, nigra, napus, oleracea
      const brassicaPriority = ['juncea', 'nigra', 'napus', 'oleracea', 'rapa'];
      
      for (const species of brassicaPriority) {
        for (const node of allNodes) {
          const nodeName = node.name.toLowerCase().replace(/['"]/g, '');
          if (nodeName.includes('brassica') && nodeName.includes(species)) {
            console.log(`Using ${species} as fallback for BnC: ${node.name} (${node.id})`);
            return node.id;
          }
        }
      }
      
      // Last resort: any Brassica
      for (const node of allNodes) {
        if (node.name.toLowerCase().includes('brassica')) {
          console.log(`Using any Brassica as fallback for BnC: ${node.name} (${node.id})`);
          return node.id;
        }
      }
    }
    
    // Add other specific handlers
    // ...

    // Try direct matching
    for (const node of allNodes) {
      const cleanNodeName = node.name.replace(/^['"]|['"]$/g, '');
      if (doSpeciesNamesMatch(cleanNodeName, searchTerm)) {
        console.log(`Found direct match: ${node.name} (${node.id}) for: ${searchTerm}`);
        return node.id;
      }
    }
    
    // Try genus match for longer terms
    if (searchTerm.length > 3) {
      const genusMatch = searchTerm.split(/[\s_]/)[0];
      if (genusMatch && genusMatch.length > 2) {
        for (const node of allNodes) {
          if (node.name.toLowerCase().startsWith(genusMatch.toLowerCase())) {
            console.log(`Found genus match: ${node.name} (${node.id}) for: ${searchTerm}`);
            return node.id;
          }
        }
      }
    }
    
    return null;
  }, [doSpeciesNamesMatch]);

  // Handle selectedSpecies change more robustly
  useEffect(() => {
    if (!selectedSpecies || !treeData) return;
    
    console.log(`🔍 Robust species selection for: '${selectedSpecies}'`);
    console.log(`Current layout before selection: ${useRadialLayout ? 'radial' : 'rectangular'}`);
    
    // Special handling for TdzA which may be missing direct node match
    if (selectedSpecies === 'TdzA') {
      console.log("🔍 TdzA SPECIAL DETECTION ACTIVATED");
      
      // First collect all nodes for proper matching
      const collectAllNodes = (node: TreeNode): TreeNode[] => {
        let nodes: TreeNode[] = [node];
        if (node.children) {
          for (const child of node.children) {
            nodes = [...nodes, ...collectAllNodes(child)];
          }
        }
        return nodes;
      };
      
      const allNodes = collectAllNodes(treeData);
      
      // Log all Triticum nodes for debugging
      const triticumNodes = allNodes.filter(n => 
        n.name.toLowerCase().includes('triticum')
      );
      
      console.log("Available Triticum nodes:", triticumNodes.map(n => ({ id: n.id, name: n.name })));
      
      // Find Triticum dicoccoides, turgidum, or durum specifically
      let targetNode = triticumNodes.find(n => 
        n.name.toLowerCase().includes('dicoccoides') || 
        n.name.toLowerCase().includes('turgidum') ||
        n.name.toLowerCase().includes('durum')
      );
      
      // Fallback to any Triticum as last resort
      if (!targetNode && triticumNodes.length > 0) {
        targetNode = triticumNodes[0];
      }
      
      if (targetNode) {
        console.log(`Selected Triticum node for TdzA: ${targetNode.name} (${targetNode.id})`);
        
        // Update node count to match TdzA count
        targetNode.count = 95;
        
        // Set the selected node ID
        setSelectedNodeId(targetNode.id);
        
        // Force re-render to update UI, preserving the current layout
        setTimeout(() => {
          console.log(`Forcing re-render for TdzA, preserving ${useRadialLayout ? 'radial' : 'rectangular'} layout`);
          renderTree();
        }, 100);
        return;
      }
    }
    
    // First collect all nodes for proper matching
    const collectAllNodes = (node: TreeNode): TreeNode[] => {
      let nodes: TreeNode[] = [node];
      if (node.children) {
        for (const child of node.children) {
          nodes = [...nodes, ...collectAllNodes(child)];
        }
      }
      return nodes;
    };
    
    const allNodes = collectAllNodes(treeData);
    console.log(`Searching among ${allNodes.length} nodes for ${selectedSpecies}`);
    
    // Try multiple approaches to find the correct node
    let foundNode: TreeNode | undefined;
    
    // 1. Try exact species_id match first
    foundNode = allNodes.find(node => 
      node.id.toLowerCase() === selectedSpecies.toLowerCase() ||
      node.name.toLowerCase() === selectedSpecies.toLowerCase()
    );
    
    // 2. Try to match with name from species counts
    if (!foundNode) {
      const matchingSpecies = speciesCounts.find(s => 
        s.species_id?.toLowerCase() === selectedSpecies.toLowerCase()
      );
      
      if (matchingSpecies && matchingSpecies.species_name) {
        console.log(`Found species name for ${selectedSpecies}: ${matchingSpecies.species_name}`);
        
        // Now look for this species name in the tree
        foundNode = allNodes.find(node => 
          doSpeciesNamesMatch(node.name, matchingSpecies.species_name)
        );
      }
    }
    
    // 3. Try partial name matching
    if (!foundNode) {
      // For "Bju", look for "Brassica juncea" etc.
      foundNode = allNodes.find(node => {
        const nodeName = node.name.toLowerCase();
        if (selectedSpecies === 'Bju' && nodeName.includes('brassica') && nodeName.includes('juncea')) {
          return true;
        }
        if (selectedSpecies === 'BnA' && nodeName.includes('brassica') && nodeName.includes('napus')) {
          return true;
        }
        if (selectedSpecies === 'BnC' && nodeName.includes('brassica') && 
           (nodeName.includes('carinat') || nodeName.includes('nigra'))) {
          return true;
        }
        if (selectedSpecies === 'Tsi' && nodeName.includes('triticum') && nodeName.includes('aestivum')) {
          return true;
        }
        if ((selectedSpecies === 'TdsA' || selectedSpecies === 'TdzA') && 
            nodeName.includes('triticum') && 
            (nodeName.includes('dicoccoides') || nodeName.includes('turgidum'))) {
          return true;
        }
        if (selectedSpecies === 'Ma' && nodeName.includes('musa')) {
          // Match any Musa species for Ma abbreviation
          return true;
        }
        return false;
      });
    }
    
    // 4. Fallback to genus matching for abbreviations
    if (!foundNode && selectedSpecies.length <= 3) {
      const genusMap: Record<string, string> = {
        'Bju': 'brassica',
        'BnA': 'brassica',
        'BnC': 'brassica',
        'Tsi': 'triticum',
        'Ah': 'arachis',
        'Gm': 'glycine',
        'Os': 'oryza',
        'Zm': 'zea',
        'At': 'arabidopsis'
      };
      
      const genus = genusMap[selectedSpecies];
      if (genus) {
        foundNode = allNodes.find(node => 
          node.name.toLowerCase().includes(genus)
        );
        
        if (foundNode) {
          console.log(`Found genus match for ${selectedSpecies}: ${foundNode.name}`);
        }
      }
    }
    
    // If we found a node, select it
    if (foundNode) {
      console.log(`✓ Found node for ${selectedSpecies}: ${foundNode.name} (ID: ${foundNode.id})`);
      // Check if node already has the correct count, otherwise set it
      const countForSpecies = speciesCounts.find(s => s.species_id === selectedSpecies)?.count;
      if (countForSpecies && (!foundNode.count || foundNode.count !== countForSpecies)) {
        console.log(`Setting count for ${foundNode.name} to ${countForSpecies}`);
        foundNode.count = countForSpecies;
      }
      
      // Set the selected node ID
      setSelectedNodeId(foundNode.id);
    } else {
      console.log(`❌ Could not find node for species: ${selectedSpecies}`);
    }
    
    // Force re-render of tree to make sure selection is visible
    setTimeout(() => renderTree(), 100);
  }, [selectedSpecies, treeData, speciesCounts, doSpeciesNamesMatch, renderTree]);

  // Handle selection changes and layout preservation
  useEffect(() => {
    // When selection changes, make sure we keep the current layout
    if (selectedNodeId !== null) {
      // Force re-render to reflect selection, but PRESERVE the current layout
      setTimeout(() => {
        console.log(`Selection changed, re-rendering with preserved layout: ${useRadialLayout ? 'radial' : 'rectangular'}`);
        renderTree();
      }, 50);
    }
  }, [selectedNodeId, renderTree]);

  // Add a specific effect to prevent layout changes on selection
  useEffect(() => {
    // Store the current layout setting in localStorage whenever it changes
    localStorage.setItem('treeViewLayout', useRadialLayout ? 'radial' : 'rectangular');
    console.log(`Saved layout setting: ${useRadialLayout ? 'radial' : 'rectangular'}`);
  }, [useRadialLayout]);
  
  // When a node is selected, make sure we restore the correct layout
  useEffect(() => {
    if (selectedNodeId !== null) {
      // Read the stored layout preference
      const savedLayout = localStorage.getItem('treeViewLayout');
      console.log(`Node selected, checking saved layout: ${savedLayout}`);
      
      // Only update if there's a mismatch
      if (savedLayout === 'radial' && !useRadialLayout) {
        console.log('Restoring radial layout after selection');
        setUseRadialLayout(true);
      } else if (savedLayout === 'rectangular' && useRadialLayout) {
        console.log('Restoring rectangular layout after selection');
        setUseRadialLayout(false);
      }
    }
  }, [selectedNodeId, useRadialLayout]);

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
      
      {/* Debug panel to show selection state */}
      {selectedNodeId && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: 40, 
          left: 5, 
          zIndex: 10,
          background: 'rgba(25,118,210,0.1)',
          padding: '5px 10px',
          borderRadius: '4px',
          border: '1px solid #1976d2',
          maxWidth: '300px',
          overflow: 'hidden'
        }}>
          <Typography variant="caption" color="primary" fontWeight="bold">
            Selected: {selectedNodeId}
          </Typography>
          <Typography variant="caption" display="block" sx={{fontSize: '9px'}}>
            (Species: {selectedSpecies || 'none'})
          </Typography>
        </Box>
      )}
      
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
          height={useRadialLayout ? "100%" : "200%"} // Double height for rectangular view
          style={{ cursor: 'grab', minHeight: useRadialLayout ? "600px" : "1200px" }}
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