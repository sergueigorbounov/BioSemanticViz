import axios from 'axios';

// Ensure we're using port 8003 where our server is running
const apiUrl = 'http://localhost:8003';

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
  message?: string;
  data?: Array<string>;
  counts_by_species?: Array<OrthoSpeciesCount>;
  orthogroup_id?: string;
  total_count?: number;
  taxonium_tree?: any; // For Taxonium visualizations
}

/**
 * Interface for Taxonium-compatible search response
 */
export interface OrthologueSearchTaxoniumResponse extends OrthologueSearchResponse {
  taxonium_tree?: {
    nodes: any[];
    metadata: any;
  };
}

/**
 * Search for orthologues of a gene
 * @param searchTerm - The gene ID or query to search for
 * @param speciesFilter - Optional array of species IDs to filter results
 * @returns Promise resolving to the search results
 */
export const searchOrthologues = async (
  searchTerm: string,
  speciesFilter?: string[]
): Promise<OrthologueSearchResponse> => {
  try {
    const response = await orthologueClient.post('/api/orthologue/search', {
      gene_id: searchTerm,
      species_filter: speciesFilter,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Return error from the server
      return {
        success: false,
        message: error.response.data?.message || 'Error searching orthologues',
      };
    }
    // Generic error handling
    return {
      success: false,
      message: 'Error connecting to the server',
    };
  }
};

/**
 * Search for orthologues with Taxonium-compatible tree
 * @param searchTerm - The gene ID or query to search for
 * @param speciesFilter - Optional array of species IDs to filter results
 * @returns Promise resolving to the search results with Taxonium tree
 */
export const searchOrthologuesTaxonium = async (
  searchTerm: string,
  speciesFilter?: string[]
): Promise<OrthologueSearchResponse> => {
  try {
    const response = await orthologueClient.post('/api/orthologue/search_taxonium', {
      gene_id: searchTerm,
      species_filter: speciesFilter,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Return error from the server
      return {
        success: false,
        message: error.response.data?.message || 'Error generating Taxonium data',
      };
    }
    // Generic error handling
    return {
      success: false,
      message: 'Error connecting to the server',
    };
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

const API_BASE_URL = '/api';

interface OrthologueSearchParams {
  species?: string;
  gene?: string;
  orthogroup?: string;
  limit?: number;
  offset?: number;
}

interface OrthologueSearchResult {
  results: Array<{
    id: string;
    name: string;
    gene_count: number;
    species: string[];
    genes?: string[];
  }>;
  total: number;
  limit: number;
  offset: number;
}

/**
 * Search for orthogroups based on various criteria
 * @param params Search parameters
 */
export const searchOrthologue = async (
  params: OrthologueSearchParams
): Promise<OrthologueSearchResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/orthologue/search`, params);
    return response.data;
  } catch (error) {
    console.error('Error searching orthogroups:', error);
    throw error;
  }
};

/**
 * Get Taxonium-compatible tree data for orthogroups
 * @param params Search parameters
 */
export const getOrthologueTaxoniumTree = async (
  params: OrthologueSearchParams
): Promise<{ tree: any; newick: string }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/orthologue/search_taxonium`, params);
    return response.data;
  } catch (error) {
    console.error('Error getting orthologue taxonium data:', error);
    throw error;
  }
};

/**
 * Get gene tree for a specific orthogroup
 * @param orthogroupId Orthogroup ID
 */
export const getGeneTree = async (orthogroupId: string): Promise<{ tree: any; newick: string }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orthologue/gene_tree/${orthogroupId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting gene tree:', error);
    throw error;
  }
};

/**
 * Get details for a specific orthogroup
 * @param orthogroupId Orthogroup ID
 */
export const getOrthogroupDetails = async (orthogroupId: string): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orthologue/details/${orthogroupId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting orthogroup details:', error);
    throw error;
  }
};

export default orthologueClient; 