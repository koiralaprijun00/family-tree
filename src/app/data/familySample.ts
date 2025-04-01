// src/app/data/familyTreePresets.ts
import { FamilyMember } from '../../types/familymember';

// Preset to match the diagram
export const nuclearFamilyPreset: FamilyMember = {
  id: 'member-1',
  name: 'Fatheroo',
  gender: 'Male',
  birthDate: '1970-01-01',
  living: true,
  occupation: 'Doctor',
  bio: 'Family head',
  spouse: {
    id: 'member-2',
    name: 'Mother',
    gender: 'Female',
    birthDate: '1972-03-15',
    living: true,
    occupation: 'Teacher',
    bio: 'Loving mother',
  },
  children: [
    {
      id: 'member-3',
      name: 'Wowza Son',
      gender: 'Male',
      birthDate: '2005-03-12',
      living: true,
      spouse: {
        id: 'member-4',
        name: 'Spouse',
        gender: 'Female',
        birthDate: '2006-06-20',
        living: true,
      },
      children: [
        {
          id: 'member-5',
          name: 'C1',
          gender: 'Male',
          birthDate: '2025-01-01',
          living: true,
          spouse: {
            id: 'member-6',
            name: 'C1 Spouse',
            gender: 'Female',
            birthDate: '2025-02-01',
            living: true,
          },
        },
        {
          id: 'member-7',
          name: 'C2',
          gender: 'Male',
          birthDate: '2025-03-01',
          living: true,
          spouse: {
            id: 'member-8',
            name: 'C2 Spouse',
            gender: 'Female',
            birthDate: '2025-04-01',
            living: true,
          },
        },
        {
          id: 'member-9',
          name: 'C3',
          gender: 'Female',
          birthDate: '2025-05-01',
          living: true,
          spouse: {
            id: 'member-10',
            name: 'C3 Spouse',
            gender: 'Male',
            birthDate: '2025-06-01',
            living: true,
          },
        },
      ],
    },
  ],
};

// All presets in a map for easy access
export const familyTreePresets = {
  nuclear: nuclearFamilyPreset,
};

export default familyTreePresets;