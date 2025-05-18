import axios from 'axios';
import { fetchOrthologues, fetchNewickTree } from '../orthologueClient';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Orthologue API Client', () => {
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  describe('fetchOrthologues', () => {
    test('returns orthologue data on successful API response', async () => {
      // Mock data
      const mockResponse = {
        data: {
          success: true,
          counts_by_species: [
            { species_id: 'At', species_name: 'Arabidopsis thaliana', count: 10 }
          ]
        }
      };
      
      // Configure axios mock
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      // Call function with test parameters
      const result = await fetchOrthologues('AT1G01010');
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/orthologues'), 
        expect.objectContaining({
          params: { gene_id: 'AT1G01010' }
        })
      );
      
      expect(result).toEqual(mockResponse.data);
    });
    
    test('handles API errors gracefully', async () => {
      // Mock a network error
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      
      // Call function with test parameters
      const result = await fetchOrthologues('AT1G01010');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        error: expect.any(String)
      });
    });
  });
  
  describe('fetchNewickTree', () => {
    test('returns newick tree string on successful API response', async () => {
      // Mock data
      const mockNewickTree = '((A:0.1,B:0.2):0.3,C:0.4);';
      const mockResponse = {
        data: mockNewickTree
      };
      
      // Configure axios mock
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      // Call function
      const result = await fetchNewickTree();
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/phylogenetic_tree')
      );
      
      expect(result).toBe(mockNewickTree);
    });
    
    test('returns null when API request fails', async () => {
      // Mock a network error
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      
      // Call function
      const result = await fetchNewickTree();
      
      // Assertions
      expect(result).toBeNull();
    });
  });
}); 