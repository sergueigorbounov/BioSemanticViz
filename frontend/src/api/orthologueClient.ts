import axios from 'axios';

// Ensure we're using port 8002 where our server is running
const apiUrl = 'http://localhost:8002';

// Create API client with better error handling
const orthologueClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  timeout: 10000 // 10 second timeout
});

/**
 * Interface for orthologue data
 */
export interface OrthologueData {
  gene_id: string;
  species_id: string;
  species_name: string;
  orthogroup_id: string;
}

/**
 * Interface for species count data
 */
export interface OrthoSpeciesCount {
  species_id: string;
  species_name: string;
  count: number;
}

/**
 * Interface for orthologue search response
 */
export interface OrthologueSearchResponse {
  success: boolean;
  gene_id: string;
  orthogroup_id?: string;
  orthologues: OrthologueData[];
  counts_by_species: OrthoSpeciesCount[];
  newick_tree?: string;
  message?: string;
}

/**
 * Search for orthologues of a gene
 * @param gene_id - The gene ID to search for
 * @returns Promise resolving to the search results
 */
export const searchOrthologues = async (gene_id: string): Promise<OrthologueSearchResponse> => {
  try {
    const response = await orthologueClient.post('/api/orthologue/search', { 
      gene_id
    });
    return response.data;
  } catch (error) {
    console.error('Error searching orthologues:', error);
    throw error;
  }
};

/**
 * Get the species phylogenetic tree
 * @returns Promise resolving to the tree data
 */
export const getOrthologueTree = async (): Promise<{success: boolean, newick?: string, message?: string}> => {
  try {
    const response = await orthologueClient.get('/api/orthologue/tree');
    return response.data;
  } catch (error) {
    console.error('Error getting orthologue tree:', error);
    throw error;
  }
};

export default orthologueClient; 