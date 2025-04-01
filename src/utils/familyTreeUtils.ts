import { FamilyMember } from '../types/familymember';

/**
 * Processes spouse relationships in a family tree to ensure bidirectional references
 * This function creates a map of all members and then links spouses
 * 
 * @param data The root family member of the tree
 * @returns The processed family tree with all spouse relationships linked
 */
export function processSpouseRelationships(data: FamilyMember): FamilyMember {
  // Create a map to store all members for quick lookup
  const memberMap = new Map<string, FamilyMember>();
  
  // Helper function to add members to the map recursively
  const addMembersToMap = (member: FamilyMember) => {
    // Skip if already processed to avoid infinite loops
    if (memberMap.has(member.id)) return;
    
    // Add this member to the map
    memberMap.set(member.id, member);
    
    // Process children recursively
    if (member.children && member.children.length > 0) {
      member.children.forEach(addMembersToMap);
    }
  };
  
  // Start by adding all members to the map
  addMembersToMap(data);
  
  // Process spouse relationships
  memberMap.forEach(member => {
    // Only process if this member has a spouseId but no spouse reference
    if (member.spouseId && !member.spouse) {
      const spouse = memberMap.get(member.spouseId);
      
      // If the spouse exists in our map
      if (spouse) {
        // Link this member to spouse
        member.spouse = spouse;
        
        // Link spouse back to this member if needed
        if (!spouse.spouseId) {
          spouse.spouseId = member.id;
        }
        
        if (!spouse.spouse) {
          spouse.spouse = member;
        }
      }
    }
  });
  
  return data;
}

/**
 * Ensures all members in a family tree have valid birthDate properties
 * 
 * @param member The family member to process
 * @returns The processed family member with valid birthDate properties
 */
export function ensureBirthDateString(member: FamilyMember): FamilyMember {
  // Set default value for birthDate if it's null or undefined
  member.birthDate = member.birthDate ?? '';
  
  // Process children recursively
  if (member.children) {
    member.children = member.children.map(ensureBirthDateString);
  }
  
  return member;
}

/**
 * Safely loads family tree data from localStorage with fallback to sample data
 * 
 * @param sampleData Default sample data to use if localStorage data is invalid
 * @returns Processed family tree data
 */
export function loadFamilyTreeData(sampleData: FamilyMember): FamilyMember {
  try {
    const savedData = localStorage.getItem('familyTreeData');
    let dataToProcess = savedData ? JSON.parse(savedData) : sampleData;
    const processedData = processSpouseRelationships(dataToProcess);
    return ensureBirthDateString(processedData);
  } catch (error) {
    console.error('Error processing family data:', error);
    return ensureBirthDateString(processSpouseRelationships(sampleData));
  }
}