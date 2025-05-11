// Type definitions for biological data structures

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  orthogroups?: string[];
}

export interface GeneNode {
  id: string;
  name: string;
  function?: string;
  orthogroup?: string;
  children?: GeneNode[];
}

export interface ProteinDomain {
  name: string;
  start: number;
  end: number;
  function: string;
}

export interface Gene {
  id: string;
  name: string;
  symbol?: string;
  species: string;
  description?: string;
  sequence?: string;
  functions?: string[];
  goTerms?: GoTerm[];
  orthogroups?: Orthogroup[];
}

export interface GoTerm {
  id: string;
  name: string;
  category: 'biological_process' | 'molecular_function' | 'cellular_component';
}

export interface Orthogroup {
  id: string;
  species_count: number;
  gene_count: number;
}

export interface Species {
  id: string;
  name: string;
  taxonId: string;
  rank: string;
  children?: Species[];
  orthogroups?: string[];
}

export interface SpeciesTreeData {
  id: string;
  name: string;
  type: 'species' | 'orthogroup';
  children?: SpeciesTreeData[];
} 