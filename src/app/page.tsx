// src/app/[locale]/family-tree/page.tsx
'use client'
import React, { useState, useEffect } from 'react';
import FamilyTreeVisualization from './components/family-tree-components/FamilyTreeViz';
import AddRelativeForm from './components/family-tree-components/AddRelativeForm';
import sampleFamilyData from './data/familySample';
import { FamilyMember } from '../types/familymember';
import { processSpouseRelationships, loadFamilyTreeData } from '../utils/familyTreeUtils';

const FamilyTreePage = () => {
  const [familyData, setFamilyData] = useState<FamilyMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingRelative, setAddingRelative] = useState<'parent' | 'child' | 'spouse' | 'sibling' | null>(null);
  const [treeKey, setTreeKey] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const removeCircularReferences = (node: FamilyMember): any => {
    if (!node) return null;
    const copy = { ...node };
    if (copy.spouse) {
      copy.spouse = { ...copy.spouse };
      delete copy.spouse.spouse;
    }
    if (copy.children) {
      copy.children = copy.children.map(child => removeCircularReferences(child));
    }
    return copy;
  };

  useEffect(() => {
    const fetchFamilyData = () => {
      try {
        const processedData = loadFamilyTreeData(sampleFamilyData.nuclear);
        setFamilyData(processedData);
      } catch (error) {
        console.error('Error processing family data:', error);
        const processedData = processSpouseRelationships(sampleFamilyData.nuclear);
        setFamilyData(processedData);
      } finally {
        setLoading(false);
      }
    };

    const handleNodeClick = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.member) {
        setSelectedMember(customEvent.detail.member);
        setAddingRelative(null);
        setDeleteConfirmOpen(false);
      }
    };

    window.addEventListener('nodeClick', handleNodeClick);
    setTimeout(fetchFamilyData, 500);
    return () => window.removeEventListener('nodeClick', handleNodeClick);
  }, []);

  const findMemberById = (tree: FamilyMember, id: string): FamilyMember | null => {
    if (tree.id === id) return tree;
    if (tree.spouse?.id === id) return tree.spouse;
    for (const child of tree.children || []) {
      const found = findMemberById(child, id);
      if (found) return found;
    }
    return null;
  };

  const handleAddRelative = (type: 'parent' | 'child' | 'spouse' | 'sibling') => {
    setAddingRelative(type);
    setDeleteConfirmOpen(false);
  };

  const handleDeleteMember = () => {
    if (!selectedMember || !familyData) return;

    if (selectedMember.id === familyData.id) {
      alert('Cannot delete the root member of the family tree.');
      return;
    }

    const cleanedFamilyData = removeCircularReferences(familyData);
    const updatedFamilyData = JSON.parse(JSON.stringify(cleanedFamilyData));

    if (familyData.spouse && selectedMember.id === familyData.spouse.id) {
      delete updatedFamilyData.spouse;
      delete updatedFamilyData.spouseId;
      const processedData = processSpouseRelationships(updatedFamilyData);
      setFamilyData(processedData);
      setSelectedMember(null);
      setTreeKey(k => k + 1);
      setDeleteConfirmOpen(false);
      const cleanedForStorage = removeCircularReferences(processedData);
      localStorage.setItem('familyTreeData', JSON.stringify(cleanedForStorage));
      return;
    }

    const removeMember = (node: FamilyMember): boolean => {
      if (node.children) {
        const childIndex = node.children.findIndex(child => child.id === selectedMember.id);
        if (childIndex !== -1) {
          const child = node.children[childIndex];
          if (child.spouseId) {
            const spouseIndex = node.children.findIndex(c => c.id === child.spouseId);
            if (spouseIndex !== -1) {
              delete node.children[spouseIndex].spouseId;
              delete node.children[spouseIndex].spouse;
            }
          }
          node.children.splice(childIndex, 1);
          if (node.children.length === 0) {
            delete node.children;
          }
          return true;
        }

        for (let i = 0; i < node.children.length; i++) {
          if (node.children[i].spouse?.id === selectedMember.id) {
            delete node.children[i].spouse;
            delete node.children[i].spouseId;
            return true;
          }
        }

        return node.children.some(child => removeMember(child));
      }
      return false;
    };

    const success = removeMember(updatedFamilyData);

    if (!success) {
      console.error('Failed to find and delete the selected member:', selectedMember.id);
      return;
    }

    const processedData = processSpouseRelationships(updatedFamilyData);
    setFamilyData(processedData);
    setSelectedMember(null);
    setTreeKey(k => k + 1);
    setDeleteConfirmOpen(false);
    const cleanedForStorage = removeCircularReferences(processedData);
    localStorage.setItem('familyTreeData', JSON.stringify(cleanedForStorage));
  };

  const handleSaveRelative = (newRelativeData: Omit<FamilyMember, 'id'>) => {
    if (!selectedMember || !familyData) return;

    const newId = `member-${Date.now()}`;
    const newRelative: FamilyMember = { ...newRelativeData, id: newId };
    const cleanedFamilyData = removeCircularReferences(familyData);
    const updatedFamilyData = JSON.parse(JSON.stringify(cleanedFamilyData));

    const addChildTo = (member: FamilyMember) => {
      if (!member.children) member.children = [];
      member.children.push(newRelative);
    };

    const addParentOf = (targetId: string) => {
      if (targetId === familyData.id) {
        const newParent = { ...newRelative };
        if (!newParent.children) newParent.children = [];
        newParent.children.push(updatedFamilyData);
        updatedFamilyData.parentId = newParent.id;
        const processedData = processSpouseRelationships(newParent);
        setFamilyData(processedData);
        setSelectedMember(processedData);
        setTreeKey(k => k + 1);
        setAddingRelative(null);
        const cleanedForStorage = removeCircularReferences(processedData);
        localStorage.setItem('familyTreeData', JSON.stringify(cleanedForStorage));
        return true;
      }
      return false;
    };

    const updateSpouse = (memberId: string, spouse: FamilyMember, node: FamilyMember): boolean => {
      if (node.id === memberId) {
        node.spouse = spouse;
        node.spouseId = spouse.id;
        spouse.spouse = node;
        spouse.spouseId = node.id;
        return true;
      }
      if (node.spouse?.id === memberId) {
        node.spouse!.spouse = spouse;
        node.spouse!.spouseId = spouse.id;
        spouse.spouse = node.spouse;
        spouse.spouseId = node.spouse.id;
        return true;
      }
      if (node.children) {
        return node.children.some(child => updateSpouse(memberId, spouse, child));
      }
      return false;
    };

    const addChild = (memberId: string, child: FamilyMember, node: FamilyMember): boolean => {
      if (node.id === memberId || node.spouse?.id === memberId) {
        if (!node.children) node.children = [];
        child.parentId = node.id;
        node.children.push(child);
        return true;
      }
      if (node.children) {
        return node.children.some(childNode => addChild(memberId, child, childNode));
      }
      return false;
    };

    const addSibling = (memberId: string, sibling: FamilyMember, node: FamilyMember): boolean => {
      if (node.children) {
        const childIndex = node.children.findIndex(child => child.id === memberId);
        if (childIndex !== -1) {
          sibling.parentId = node.id;
          node.children.push(sibling);
          return true;
        }
      }

      if (node.children) {
        return node.children.some(child => addSibling(memberId, sibling, child));
      }
      return false;
    };

    let success = false;

    if (addingRelative === 'spouse') {
      success = updateSpouse(selectedMember.id, newRelative, updatedFamilyData);
      if (!success) {
        alert("Failed to add spouse.");
        return;
      }
    }

    if (addingRelative === 'child') {
      success = addChild(selectedMember.id, newRelative, updatedFamilyData);
      if (!success) {
        alert("Failed to add child.");
        return;
      }
    }

    if (addingRelative === 'parent') {
      success = addParentOf(selectedMember.id);
      if (success) return;
      const findAndUpdateParent = (node: FamilyMember): boolean => {
        if (node.id === selectedMember.id) {
          const newParent = { ...newRelative };
          if (!newParent.children) newParent.children = [];
          if (node.parentId) {
            const findParentAndUpdateChild = (parentNode: FamilyMember): boolean => {
              if (parentNode.id === node.parentId) {
                if (parentNode.children) {
                  const childIndex = parentNode.children.findIndex(c => c.id === node.id);
                  if (childIndex !== -1) {
                    newParent.children = newParent.children || [];
                    newParent.children.push(node);
                    parentNode.children[childIndex] = newParent;
                    return true;
                  }
                }
              }
              if (parentNode.children) {
                return parentNode.children.some(findParentAndUpdateChild);
              }
              return false;
            };
            success = findParentAndUpdateChild(updatedFamilyData);
            if (!success) {
              alert("Failed to add parent - couldn't find the parent-child relationship.");
              return false;
            }
          } else {
            alert("Failed to add parent - the selected member has no parent ID.");
            return false;
          }
          return true;
        }
        if (node.children) {
          return node.children.some(findAndUpdateParent);
        }
        return false;
      };
      if (!findAndUpdateParent(updatedFamilyData)) {
        alert("Failed to add parent - couldn't find the selected member in the tree.");
        return;
      }
    }

    if (addingRelative === 'sibling') {
      if (selectedMember.id === familyData.id) {
        alert("The root member cannot have a sibling without a parent. Please add a parent first.");
        return;
      }

      success = addSibling(selectedMember.id, newRelative, updatedFamilyData);
      if (!success) {
        alert("Failed to add sibling - couldn't find the parent of the selected member.");
        return;
      }
    }

    const processedData = processSpouseRelationships(updatedFamilyData);
    setFamilyData(processedData);
    setTreeKey(k => k + 1);
    setAddingRelative(null);

    const updated = findMemberById(processedData, selectedMember.id);
    if (updated) setSelectedMember(updated);
    const cleanedForStorage = removeCircularReferences(processedData);
    localStorage.setItem('familyTreeData', JSON.stringify(cleanedForStorage));
  };

  const handleResetToSample = () => {
    if (confirm('This will reset your family tree to the sample data. Are you sure?')) {
      const processedData = processSpouseRelationships(sampleFamilyData.nuclear);
      setFamilyData(processedData);
      setTreeKey(k => k + 1);
      setSelectedMember(null);
      const cleanedForStorage = removeCircularReferences(processedData);
      localStorage.setItem('familyTreeData', JSON.stringify(cleanedForStorage));
    }
  };

  const selectRootNode = () => {
    if (!familyData) return;
    setSelectedMember(familyData);
    setAddingRelative(null);
    setDeleteConfirmOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Vansha: Your Family Tree</h1>
          <div className="flex space-x-2">
            <button 
              onClick={selectRootNode}
              className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition"
            >
              Select Root
            </button>
            <button 
              onClick={handleResetToSample}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            >
              Reset
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-3/4 mb-6 lg:mb-0 lg:pr-6">
              {familyData && (
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <FamilyTreeVisualization
                    key={treeKey}
                    data={familyData} 
                  />
                </div>
              )}
            </div>
            
            <div className="lg:w-1/4">
              {selectedMember ? (
                <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Selected Member</h3>
                    <button 
                      onClick={() => setSelectedMember(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <>
                    <p className="text-gray-700"><strong>Name:</strong> {selectedMember.name}</p>
                    {/* Add more member details here as needed */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleAddRelative('parent')}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        Add Parent
                      </button>
                      {!selectedMember.spouse && (
                        <button 
                          onClick={() => handleAddRelative('spouse')}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                        >
                          Add Spouse
                        </button>
                      )}
                      <button 
                        onClick={() => handleAddRelative('child')}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                      >
                        Add Child
                      </button>
                      <button 
                        onClick={() => handleAddRelative('sibling')}
                        className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition"
                      >
                        Add Sibling
                      </button>
                      {selectedMember.id !== familyData?.id && (
                        <button 
                          onClick={() => setDeleteConfirmOpen(true)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </>
                  
                  {deleteConfirmOpen && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 mb-2">Are you sure you want to delete this member?</p>
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => setDeleteConfirmOpen(false)}
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleDeleteMember}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                  <p className="text-gray-500 text-center">Select a family member to view details</p>
                </div>
              )}
              
              {addingRelative && selectedMember && (
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <AddRelativeForm 
                    type={addingRelative} 
                    onSave={handleSaveRelative}
                    onCancel={() => setAddingRelative(null)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyTreePage;