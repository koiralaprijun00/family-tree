// Enhanced FamilyMember interface with additional fields for more comprehensive profiles
export interface FamilyMember {
  // Basic identification
  id: string;
  name: string;
  
  // Basic information
  gender: string;
  birthDate: string;
  living: boolean;
  // Extended information
  birthPlace?: string;
  deathDate?: string;
  leafCount?: number; // Added property to store the number of leaf nodes
  deathPlace?: string;
  occupation?: string;
  education?: string;
  bio?: string;
  imageUrl?: string;
  marriageDate?: string; // Added marriageDate property
  
  // Relationships
  parentId?: string;
  spouseId?: string;
  spouse?: FamilyMember;
  children?: FamilyMember[];
  
  // Utility fields (not stored, used during processing)
  processedSpouse?: boolean; 
}

export default FamilyMember;