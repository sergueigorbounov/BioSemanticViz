// Species data for the orthologue search interface
export interface Species {
  id: string;
  name: string;
  abbreviation?: string;
}

// Common species for search
export const species: Species[] = [
  { id: 'hsap', name: 'Homo sapiens', abbreviation: 'Human' },
  { id: 'mmus', name: 'Mus musculus', abbreviation: 'Mouse' },
  { id: 'dmel', name: 'Drosophila melanogaster', abbreviation: 'Fruit fly' },
  { id: 'cele', name: 'Caenorhabditis elegans', abbreviation: 'Nematode' },
  { id: 'scer', name: 'Saccharomyces cerevisiae', abbreviation: 'Yeast' },
  { id: 'atha', name: 'Arabidopsis thaliana', abbreviation: 'Thale cress' },
  { id: 'ecol', name: 'Escherichia coli', abbreviation: 'E. coli' },
  { id: 'drer', name: 'Danio rerio', abbreviation: 'Zebrafish' },
  { id: 'xtro', name: 'Xenopus tropicalis', abbreviation: 'Frog' },
  { id: 'ggal', name: 'Gallus gallus', abbreviation: 'Chicken' },
  { id: 'btau', name: 'Bos taurus', abbreviation: 'Cow' },
  { id: 'cfam', name: 'Canis familiaris', abbreviation: 'Dog' },
  { id: 'sscr', name: 'Sus scrofa', abbreviation: 'Pig' },
  { id: 'osat', name: 'Oryza sativa', abbreviation: 'Rice' },
  { id: 'zmay', name: 'Zea mays', abbreviation: 'Corn' }
];

export default species; 