import React, { useRef, useCallback, useMemo, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';

export default function RepoGraph3D({ graphData }) {
  const graphRef = useRef();
  // 1. NEW: A dummy state just to force React to re-calculate when we click
  const [pruneTrigger, setPruneTrigger] = useState(0);

  // 2. "Pruning" Logic: Recalculate visible nodes whenever graphData OR pruneTrigger changes
  const visibleData = useMemo(() => {
    if (!graphData.nodes.length) return { nodes: [], links: [] };

    const visibleNodes = new Set();
    const visibleLinks = [];

    // Traverse the tree starting from root
    const traverse = (nodeId) => {
      visibleNodes.add(nodeId);
      const node = graphData.nodes.find(n => n.id === nodeId);
      
      // Stop recursion if node doesn't exist OR is collapsed
      if (!node || node.collapsed) return; 

      // Find all links connecting FROM this node
      graphData.links.forEach(link => {
        // D3 converts IDs to objects, so we safely handle both
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        if (sourceId === nodeId) {
          visibleLinks.push(link);
          traverse(targetId); // Recursively visit the child
        }
      });
    };

    traverse('root'); // Start traversal
    
    return {
      nodes: graphData.nodes.filter(n => visibleNodes.has(n.id)),
      links: visibleLinks
    };
  }, [graphData, pruneTrigger]); // <--- Dependency array now includes the trigger

  // 3. Click Interaction (Smart Zoom)
  const handleNodeClick = useCallback(node => {
    // A. Toggle Collapse (Logic)
    if (node.childLinks && node.childLinks.length > 0) {
        node.collapsed = !node.collapsed;
        setPruneTrigger(t => t + 1);
    }
    
    // B. Smart Camera Zoom
    // 1. Determine "Shot Distance" based on type
    //    Folders need space (150) to show children. Files can be closer (40).
    const distance = node.group === 'folder' ? 150 : 40;
    
    // 2. Calculation: Keep the current angle, just adjust distance
    //    We explicitly use the Three.js camera object to get current coordinates
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

    // Default to a safe viewing angle if the node is exactly at (0,0,0)
    const newPos = node.x || node.y || node.z
      ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
      : { x: 0, y: 0, z: distance }; // Handle Root Node case perfectly

    graphRef.current.cameraPosition(
      newPos, // Move camera here
      node,   // Look exactly at the node
      3000    // Animation time (ms) - 3 seconds for smooth flight
    );
  }, [graphRef]);

  return (
    <ForceGraph3D
      ref={graphRef}
      graphData={visibleData}
      
      // --- VISUALS ---
      backgroundColor="#0f172a"
      nodeLabel="name"
      // Color logic: Red Root, Blue Folders, Yellow JS, Green Files
      nodeColor={node => {
        if (node.id === 'root') return '#ef4444'; 
        if (node.group === 'folder') return '#3b82f6'; 
        if (String(node.name).endsWith('.js') || String(node.name).endsWith('.tsx')) return '#eab308'; 
        return '#10b981'; 
      }}
      // Size logic: Folders are bigger
      nodeVal={node => node.group === 'folder' ? 15 : 5} 
      
      // --- LINKS ---
      linkWidth={link => link.type === 'dependency' ? 0.5 : 1.5}
      linkColor={link => link.type === 'dependency' ? '#f472b6' : '#64748b'}
      linkDirectionalParticles={link => link.type === 'dependency' ? 4 : 0}
      linkDirectionalParticleSpeed={0.005}
      
      // --- INTERACTION ---
      onNodeClick={handleNodeClick}
      
      // --- LABELS ---
      nodeThreeObjectExtend={true}
      nodeThreeObject={node => {
        // Only show text for Folders (to reduce clutter)
        if (node.group === 'folder' && !node.collapsed) {
             const sprite = new SpriteText(node.name);
             sprite.color = 'white';
             sprite.textHeight = 4; // Adjust size if too big
             sprite.position.y = 12; // Move text higher up
             return sprite;
        }
      }}
    />
  );
}