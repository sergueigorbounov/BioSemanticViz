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
  name?: string;
  label: string;
  species_id: string;
  species_name?: string;
  orthogroup_id?: string;
  description?: string;
  sequence?: string;
  functions?: string[];
  go_terms?: GoTerm[];
  po_terms?: PoTerm[];
  to_terms?: ToTerm[];
  external_links?: ExternalLink[];
  chromosome?: string;
  start?: number;
  end?: number;
  strand?: string;
}

export interface GoTerm {
  id: string;
  name: string;
  definition?: string;
  aspect: 'P' | 'F' | 'C'; // biological process, molecular function, cellular component
  evidence_code?: string;
}

export interface PoTerm {
  id: string;
  name: string;
  definition?: string;
  tissue_type?: string;
}

export interface ToTerm {
  id: string;
  name: string;
  definition?: string;
  trait_category?: string;
}

export interface ExternalLink {
  database: string;
  id: string;
  url: string;
  description?: string;
}

export interface Orthogroup {
  id: string;
  name: string;
  species: string[];
  genes: string[];
  description?: string;
}

export interface Species {
  id: string;
  name: string;
  taxon_id: string;
  common_name?: string;
  genome_assembly?: string;
}

export interface SpeciesTreeData {
  id: string;
  name: string;
  type: 'species' | 'orthogroup';
  children?: SpeciesTreeData[];
} 

// API response types
export interface BiologicalResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface SpeciesResponse extends BiologicalResponse<Species[]> {}
export interface OrthoGroupResponse extends BiologicalResponse<Orthogroup[]> {
  species_id?: string;
}
export interface GeneResponse extends BiologicalResponse<Gene[]> {
  orthogroup_id?: string;
}
export interface GeneDetailResponse extends BiologicalResponse<Gene> {} 