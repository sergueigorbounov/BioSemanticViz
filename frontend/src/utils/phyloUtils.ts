/**
 * Converts a Newick tree string to Taxonium format
 * This is a simplified conversion - Taxonium requires a specific JSON structure
 * @param newickString The Newick tree in string format
 * @returns Taxonium compatible data structure
 */
export function convertNewickToTaxoniumFormat(newickString: string) {
  try {
    // Parse the Newick tree using a simple recursive approach
    const nodes: any[] = [];
    
    // Start parsing from the root
    parseNewickForTaxonium(newickString, null, nodes, 0);
    
    // Convert to Taxonium format
    return {
      nodes: nodes.map(node => ({
        id: node.id,
        parentId: node.parentId === null ? undefined : node.parentId,
        name: node.name,
        branch_length: node.branch_length,
        children: node.children,
        metadata: node.metadata,
        x: 0, // These will be calculated by Taxonium
        y: 0
      })),
      metadata: {
        colorings: [{
          name: 'orthologueCount',
          type: 'continuous'
        }]
      }
    };
  } catch (error) {
    console.error('Error converting Newick to Taxonium:', error);
    throw new Error('Failed to convert Newick tree to Taxonium format');
  }
}

// Utility functions for phylogenetics
import * as d3 from 'd3';

interface TreeNode {
  id: number;
  name: string;
  parent: number | null;
  children?: number[];
  x?: number;
  y?: number;
}

/**
 * Parse a Newick tree string for Taxonium format
 * @param str Newick tree string
 * @param parentId Parent node ID
 * @param nodes Array to store nodes
 * @param nodeId Current node ID
 * @returns The current node ID
 */
function parseNewickForTaxonium(
  str: string, 
  parentId: number | null = null, 
  nodes: any[] = [], 
  nodeId: number = 0
): number {
  str = str.trim();
  
  // Current node data
  const currentNodeId = nodeId++;
  const node: any = {
    id: currentNodeId,
    parentId: parentId,
    name: '',
    branch_length: 0,
    children: [],
    metadata: {}
  };
  
  nodes.push(node);
  
  // Simple case: Leaf node without children
  if (!str.includes('(') && !str.includes(')')) {
    // Extract name and branch length
    const parts = str.split(':');
    node.name = parts[0].trim();
    if (parts.length > 1) {
      node.branch_length = parseFloat(parts[1]);
    }
    return currentNodeId;
  }
  
  // Find the balanced parentheses for all child groups
  let childrenStr = '';
  let i = 0;
  if (str[0] === '(') {
    let depth = 1;
    i = 1;
    while (depth > 0 && i < str.length) {
      if (str[i] === '(') depth++;
      if (str[i] === ')') depth--;
      i++;
    }
    childrenStr = str.substring(1, i - 1);
  }
  
  // Get the rest of the string (node info)
  const nodeInfo = str.substring(i).trim();
  
  // Extract name and branch length from node info
  if (nodeInfo) {
    const parts = nodeInfo.split(':');
    if (parts[0]) {
      node.name = parts[0].trim();
    }
    if (parts.length > 1) {
      node.branch_length = parseFloat(parts[1]);
    }
  }
  
  // Process children
  if (childrenStr) {
    let childStrings: string[] = [];
    let start = 0;
    let depth = 0;
    
    // Split the children string by commas, but only at the top level
    for (let i = 0; i < childrenStr.length; i++) {
      if (childrenStr[i] === '(') depth++;
      else if (childrenStr[i] === ')') depth--;
      else if (childrenStr[i] === ',' && depth === 0) {
        childStrings.push(childrenStr.substring(start, i));
        start = i + 1;
      }
    }
    childStrings.push(childrenStr.substring(start));
    
    // Process each child
    for (const childStr of childStrings) {
      if (childStr.trim()) {
        const childId = parseNewickForTaxonium(childStr, currentNodeId, nodes, nodeId);
        node.children.push(childId);
      }
    }
  }
  
  return currentNodeId;
}

// Helper function to parse Newick string
function parseNewick(str: string, parentId: number | null = null): number {
  str = str.trim();
  
  // Current node data
  let id = 0;
  let name = '';
  let children: number[] = [];
    
  // Handle internal node with children
  if (str.startsWith('(')) {
    // Find the matching closing parenthesis
    let parenthesisCount = 0;
    let splitPoints: number[] = [];
    
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '(') parenthesisCount++;
      else if (str[i] === ')') parenthesisCount--;
      else if (str[i] === ',' && parenthesisCount === 1) splitPoints.push(i);
      
      if (parenthesisCount === 0 && str[i] === ')') {
        // End of the children section
        const closingPos = i;
        
        // Process children
        let lastPos = 1; // Start after the opening parenthesis
        for (const pos of splitPoints) {
          const childStr = str.substring(lastPos, pos);
          const childId = parseNewick(childStr, id);
          children.push(childId);
          lastPos = pos + 1;
        }
        
        // Process the last child
        const childStr = str.substring(lastPos, closingPos);
        const childId = parseNewick(childStr, id);
        children.push(childId);
        
        // Process node name if any
        if (closingPos + 1 < str.length) {
          name = str.substring(closingPos + 1);
        }
        
        break;
      }
    }
  } else {
    // Leaf node
    name = str;
  }
  
  // Create node
  const node: TreeNode = {
    id,
    name,
    parent: parentId,
    children: children.length > 0 ? children : undefined
  };
  
  // Store in nodes array
  return id;
}

// Convert Newick string to D3 hierarchy
export function newickToD3(newickString: string) {
  let nodeId = 0;
  const nodesMap: { [key: number]: TreeNode } = {};
  
  // Process the Newick string
  const rootId = parseNewick(newickString);
  
  // Convert to D3 hierarchical structure
  function buildHierarchy(nodeId: number) {
    const node = nodesMap[nodeId];
    const result: any = { name: node.name };
    
    if (node.children && node.children.length > 0) {
      result.children = node.children.map(childId => buildHierarchy(childId));
    }
    
    return result;
  }
  
  // Return the root of the hierarchy
  return buildHierarchy(rootId);
}

export default {
  newickToD3,
  convertNewickToTaxoniumFormat
}; 