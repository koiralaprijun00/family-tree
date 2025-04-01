'use client'

import React from 'react';
import { FamilyMember } from '../../../types/familymember';

interface MemberDetailsProps {
  member: FamilyMember;
}

const MemberDetails: React.FC<MemberDetailsProps> = ({ member }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return isNaN(date.getTime()) 
      ? dateString 
      : date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
  };

  return (
    <div className="member-details">
      <div className="flex items-center mb-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          member.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
        }`}>
          {member.imageUrl ? (
            <img 
              src={member.imageUrl} 
              alt={member.name} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold">{member.name.charAt(0)}</span>
          )}
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-bold">{member.name}</h3>
          <p className={`text-sm ${member.living ? 'text-green-600' : 'text-gray-500'}`}>
            {member.living ? 'Living' : 'Deceased'}
          </p>
        </div>
      </div>

      <div className="member-info space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Birth Date:</span>
          <span className="font-medium">{formatDate(member.birthDate)}</span>
        </div>
        
        {!member.living && member.deathDate && (
          <div className="flex justify-between">
            <span className="text-gray-600">Death Date:</span>
            <span className="font-medium">{formatDate(member.deathDate)}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600">Gender:</span>
          <span className="font-medium">{member.gender}</span>
        </div>
        
        {member.birthPlace && (
          <div className="flex justify-between">
            <span className="text-gray-600">Birth Place:</span>
            <span className="font-medium">{member.birthPlace}</span>
          </div>
        )}
        
        {member.occupation && (
          <div className="flex justify-between">
            <span className="text-gray-600">Occupation:</span>
            <span className="font-medium">{member.occupation}</span>
          </div>
        )}
        
        {member.spouseId && (
          <div className="flex justify-between">
            <span className="text-gray-600">Marital Status:</span>
            <span className="font-medium">Married</span>
          </div>
        )}
        
        {member.children && member.children.length > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Children:</span>
            <span className="font-medium">{member.children.length}</span>
          </div>
        )}
      </div>
      
      {member.bio && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-700 italic">{member.bio}</p>
        </div>
      )}
    </div>
  );
};

export default MemberDetails;