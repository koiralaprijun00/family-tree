'use client';

import React, { useEffect, useRef } from 'react';
import * as go from 'gojs';
import { FamilyMember } from '../../../types/familymember';

interface FamilyTreeProps {
  data: FamilyMember;
}

// Custom styling for individual person nodes
const PERSON_TEMPLATE = () => {
  const $ = go.GraphObject.make;
  return $(
    go.Node,
    'Auto',
    { 
      click: (e: go.InputEvent, obj: go.GraphObject) => {
        const member = obj.part?.data?.member;
        const event = new CustomEvent('nodeClick', {
          detail: { member }
        });
        window.dispatchEvent(event);
      }
    },
    $(
      go.Shape,
      'RoundedRectangle',
      {
        fill: '#ffffff',
        stroke: '#ddd',
        strokeWidth: 1,
        parameter1: 5 // corner radius
      },
      new go.Binding('fill', 'gender', (gender) => 
        gender === 'Male' ? '#e6f7ff' : '#fff0f6'
      )
    ),
    $(
      go.Panel,
      'Vertical',
      { padding: 10, minSize: new go.Size(120, NaN) },
      $(
        go.TextBlock,
        {
          font: 'bold 12pt sans-serif',
          margin: new go.Margin(0, 0, 5, 0),
          textAlign: 'center'
        },
        new go.Binding('text', 'name')
      ),
      $(
        go.TextBlock,
        {
          font: '10pt sans-serif',
          textAlign: 'center'
        },
        new go.Binding('text', 'living', (living) => living ? 'Living' : 'Deceased'),
        new go.Binding('stroke', 'living', (living) => living ? 'green' : 'gray')
      )
    )
  );
};

// Group template for couples (member + spouse)
const COUPLE_TEMPLATE = () => {
  const $ = go.GraphObject.make;
  return $(
    go.Group,
    'Horizontal',
    {
      layout: $(go.GridLayout, { wrappingColumn: 2, spacing: new go.Size(20, 0) }),
      click: (e: go.InputEvent, obj: go.GraphObject) => {
        // Prevent group click from interfering with node clicks
        e.handled = true;
      }
    },
    $(
      go.Placeholder,
      { padding: 10 }
    )
  );
};

const FamilyTreeVisualization: React.FC<FamilyTreeProps> = ({ data }) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const diagram = useRef<go.Diagram | null>(null);

  // Initialize GoJS diagram
  useEffect(() => {
    if (!diagramRef.current) return;

    const $ = go.GraphObject.make;
    diagram.current = $(go.Diagram, diagramRef.current, {
      initialContentAlignment: go.Spot.Center,
      layout: $(go.TreeLayout, {
        angle: 90,
        layerSpacing: 80,
        nodeSpacing: 40,
        alignment: go.TreeLayout.AlignmentCenterChildren,
      }),
      'undoManager.isEnabled': true
    });

    // Set node template for individual persons
    diagram.current.nodeTemplate = PERSON_TEMPLATE();

    // Set group template for couples
    diagram.current.groupTemplate = COUPLE_TEMPLATE();

    // Set link template for parent-child relationships
    diagram.current.linkTemplate = $(
      go.Link,
      { routing: go.Link.Orthogonal, corner: 5 },
      $(go.Shape, { strokeWidth: 1, stroke: '#555' }),
      $(go.Shape, { toArrow: 'Standard', stroke: null, fill: '#555' })
    );

    // Define a new link template for spouse relationships (no arrow)
    diagram.current.linkTemplateMap.add(
      'spouse',
      $(
        go.Link,
        { routing: go.Link.Normal }, // Simple straight line for spouse connection
        $(go.Shape, { strokeWidth: 1, stroke: '#555' }) // No arrow, just a line
      )
    );

    // Clean up on unmount
    return () => {
      if (diagram.current) {
        diagram.current.div = null;
      }
    };
  }, []);

  // Update diagram with family data
  useEffect(() => {
    if (!diagram.current) return;

    // Clean processed flags
    const cleanProcessedSpouseFlags = (member: FamilyMember) => {
      if (member.processedSpouse) delete member.processedSpouse;
      if (member.spouse?.processedSpouse) delete member.spouse.processedSpouse;
      if (member.children) {
        member.children.forEach(cleanProcessedSpouseFlags);
      }
    };

    cleanProcessedSpouseFlags(data);

    // Generate node, group, and link data
    const nodeDataArray: any[] = [];
    const linkDataArray: any[] = [];

    const traverse = (member: FamilyMember, parentKey: string | null = null) => {
      let nodeKey = member.id;
      let groupKey: string | null = null;
    
      // If the member has a spouse, create a group for the couple
      if (member.spouse && !member.spouse.processedSpouse) {
        groupKey = `group-${member.id}`;
        nodeDataArray.push({
          key: groupKey,
          isGroup: true,
        });
    
        // Add the member to the group
        nodeDataArray.push({
          key: nodeKey,
          group: groupKey,
          name: member.name,
          gender: member.gender,
          living: member.living,
          member: member,
        });
    
        // Add the spouse to the group
        const spouseKey = member.spouse.id;
        nodeDataArray.push({
          key: spouseKey,
          group: groupKey,
          name: member.spouse.name,
          gender: member.spouse.gender,
          living: member.spouse.living,
          member: member.spouse,
        });
    
        // Add a link between the member and spouse to visually connect them
        linkDataArray.push({
          from: nodeKey,
          to: spouseKey,
          category: 'spouse', // Use the spouse link template
          key: `${nodeKey}-${spouseKey}-spouse`
        });
    
        member.spouse.processedSpouse = true;
      } else {
        // No spouse, just add the member as a standalone node
        nodeDataArray.push({
          key: nodeKey,
          name: member.name,
          gender: member.gender,
          living: member.living,
          member: member,
        });
      }
    
      // Link to parent (if any)
      if (parentKey) {
        // Link to the child node directly (nodeKey), not the group
        linkDataArray.push({
          from: parentKey,
          to: nodeKey, // Always link to the child node, not the group
        });
      }
    
      // Process children
      if (member.children) {
        member.children.forEach((child) => {
          traverse(child, nodeKey); // Pass the child nodeKey as the parentKey for the next level
        });
      }
    };

    traverse(data);

    // Update the model
    const $ = go.GraphObject.make;
    diagram.current.model = $(go.GraphLinksModel, {
      linkKeyProperty: 'key',
      nodeDataArray,
      linkDataArray: linkDataArray.map(link => ({
        ...link,
        key: link.key || `${link.from}-${link.to}`
      }))
    });
  }, [data]);

  return (
    <div 
      ref={diagramRef} 
      style={{ 
        width: '100%', 
        height: '800px', 
        border: '1px solid #ddd' 
      }} 
    />
  );
};

export default FamilyTreeVisualization;