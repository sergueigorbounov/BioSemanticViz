import React from 'react';
import { render, screen } from '@testing-library/react';
import PhylogeneticTreeView from '../PhylogeneticTreeView';

describe('PhylogeneticTreeView Component', () => {
  
  test('renders loading state correctly', () => {
    render(<PhylogeneticTreeView 
      orthologues={null} 
      newickTree={null} 
      loading={true} 
    />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('renders error state when tree fails to parse', () => {
    const mockOrthologues = {
      success: true,
      counts_by_species: [
        { species_id: 'test', species_name: 'Test Species', count: 5 }
      ]
    };
    
    // Invalid Newick tree that will cause parse error
    const invalidNewick = '((A:0.1,B:0.2)invalidformat';
    
    render(<PhylogeneticTreeView 
      orthologues={mockOrthologues} 
      newickTree={invalidNewick} 
      loading={false} 
    />);
    
    expect(screen.getByText(/failed to process/i)).toBeInTheDocument();
  });
  
  test('renders empty state with message when no data', () => {
    render(<PhylogeneticTreeView 
      orthologues={null} 
      newickTree={null} 
      loading={false} 
    />);
    
    expect(screen.getByText(/no phylogenetic data/i)).toBeInTheDocument();
  });
  
  // More complex tests would test the D3 rendering
  // Using a valid Newick string and checking for SVG elements
  // This would require mocking D3 or using a specialized library
}); 