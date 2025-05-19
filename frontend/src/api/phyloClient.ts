import axios from 'axios';

// Ensure we're using port 8002 where our server is running
const apiUrl = 'http://localhost:8002';

// Create API client with better error handling
const phyloClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  timeout: 10000 // 10 second timeout
});

/**
 * Interface for phylogenetic node data
 */
export interface PhyloNodeData {
  id: string;
  name: string;
  length?: number;
  branch_length?: number;
  support?: number;
  children?: PhyloNodeData[];
}

/**
 * Convert Newick string to JSON format
 * @param newick - The Newick format string
 * @returns Promise resolving to the converted tree
 */
export const convertNewickToJson = async (newick: string): Promise<PhyloNodeData> => {
  try {
    const response = await phyloClient.post('/api/phylo/newick-to-json', { 
      newick 
    });
    return response.data;
  } catch (error) {
    console.error('Error converting Newick to JSON:', error);
    throw error;
  }
};

/**
 * Reroot a phylogenetic tree
 * @param newick - The Newick format string
 * @param outgroup - Array of node names to use as outgroup
 * @returns Promise resolving to the rerooted tree
 */
export const rerootTree = async (newick: string, outgroup: string[]): Promise<{newick: string, tree: PhyloNodeData}> => {
  try {
    const response = await phyloClient.post('/api/phylo/reroot', {
      newick,
      outgroup
    });
    return response.data;
  } catch (error) {
    console.error('Error rerooting tree:', error);
    throw error;
  }
};

/**
 * Annotate a phylogenetic tree with metadata
 * @param newick - The Newick format string
 * @param annotations - Object with node annotations
 * @returns Promise resolving to the annotated tree
 */
export const annotateTree = async (
  newick: string, 
  annotations: Record<string, Record<string, any>>
): Promise<{newick: string, tree: PhyloNodeData}> => {
  try {
    const response = await phyloClient.post('/api/phylo/annotate', {
      newick,
      annotations
    });
    return response.data;
  } catch (error) {
    console.error('Error annotating tree:', error);
    throw error;
  }
};

/**
 * Compare two phylogenetic trees
 * @param newick1 - First tree in Newick format
 * @param newick2 - Second tree in Newick format
 * @returns Promise resolving to comparison metrics
 */
export const compareTrees = async (
  newick1: string, 
  newick2: string
): Promise<{
  rf_distance: number,
  max_rf: number,
  normalized_rf: number,
  common_leaves: number,
  percent_common_leaves: number
}> => {
  try {
    const response = await phyloClient.post('/api/phylo/compare', {
      newick1,
      newick2
    });
    return response.data;
  } catch (error) {
    console.error('Error comparing trees:', error);
    throw error;
  }
};

/**
 * Upload a tree file
 * @param formData - The form data containing the tree file
 * @returns Promise resolving to the parsed tree
 */
export const uploadTreeFile = async (formData: FormData): Promise<{
  newick: string,
  tree: PhyloNodeData,
  num_leaves: number,
  num_nodes: number
}> => {
  try {
    const response = await phyloClient.post('/api/phylo/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading tree file:', error);
    throw error;
  }
};

/**
 * Get an example tree for testing
 * @returns Promise resolving to the example tree
 */
export const getExampleTree = async (): Promise<{
  newick: string,
  tree: PhyloNodeData,
  num_leaves: number,
  num_nodes: number
}> => {
  try {
    const response = await phyloClient.get('/api/phylo/example');
    return response.data;
  } catch (error) {
    console.error('Error getting example tree:', error);
    throw error;
  }
};

export default phyloClient; 