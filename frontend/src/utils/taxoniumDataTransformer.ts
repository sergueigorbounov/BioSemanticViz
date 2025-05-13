/**
 * Utilities for transforming hierarchical tree data to Taxonium format
 */

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  species?: string;
  orthogroup_id?: string;
  [key: string]: any; // For other properties
}

interface TaxoniumNode {
  name: string;
  node_id: string;
  parent?: string;
  branch_length?: number;
  species?: string;
  orthogroup_id?: string;
  [key: string]: any;
}

interface TaxoniumData {
  meta: {
    colorBy: string[];
    nodeFields: string[];
  };
  tree: {
    nodes: TaxoniumNode[];
  };
}

/**
 * Converts hierarchical tree data to Taxonium's expected flat format
 * @param rootNode - The root node of the hierarchical tree
 * @returns Data in Taxonium format
 */
export const transformToTaxoniumFormat = (rootNode: TreeNode): TaxoniumData => {
  const nodes: TaxoniumNode[] = [];
  
  // Recursively process each node
  const processNode = (node: TreeNode, parentId?: string, depth: number = 0): void => {
    const taxoniumNode: TaxoniumNode = {
      name: node.name,
      node_id: node.id,
      parent: parentId,
      branch_length: 1, // Default branch length, adjust as needed
      species: node.species,
      orthogroup_id: node.orthogroup_id,
      node_attrs: {
        depth: depth
      }
    };
    
    nodes.push(taxoniumNode);
    
    // Process children recursively
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        processNode(child, node.id, depth + 1);
      });
    }
  };
  
  // Start processing from the root
  processNode(rootNode);
  
  return {
    meta: {
      colorBy: ["none", "species", "orthogroup"],
      nodeFields: ["name", "species", "orthogroup_id"],
    },
    tree: {
      nodes: nodes
    }
  };
};

/**
 * Converts Newick format string to Taxonium format
 * For future implementation if needed
 */
export const convertNewickToTaxonium = (newickString: string): TaxoniumData => {
  // This is a placeholder for future implementation
  // Would need to parse Newick string and convert to Taxonium format
  throw new Error("Newick to Taxonium conversion not yet implemented");
}; 