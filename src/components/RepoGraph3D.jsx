import * as THREE from 'three'; // <--- Don't forget this!
import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';

// ---------------------------------------------------------
// 2. HELPER FUNCTION (Place createDuck here)
// ---------------------------------------------------------
const createDuck = (node) => {
  const group = new THREE.Group();

  // Scale logic: Big files = Big Ducks
  const baseSize = node.size && node.size > 0 ? Math.max(5, Math.log2(node.size) * 1.5) : 5;
  const scale = baseSize * 0.2; 

  // BODY
  const bodyGeo = new THREE.SphereGeometry(4 * scale, 16, 16);
  const bodyMat = new THREE.MeshLambertMaterial({ color: '#000000' }); 
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // HEAD
  const headGeo = new THREE.SphereGeometry(2.5 * scale, 16, 16);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.set(2.5 * scale, 3 * scale, 0); 
  group.add(head);

  // BEAK
  const beakGeo = new THREE.ConeGeometry(1 * scale, 2 * scale, 8);
  const beakMat = new THREE.MeshLambertMaterial({ color: '#f97316' }); 
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.rotation.z = -Math.PI / 2; 
  beak.position.set(5 * scale, 3 * scale, 0);
  group.add(beak);

  // EYES
  const eyeGeo = new THREE.SphereGeometry(0.4 * scale);
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#000000' });
  
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(3.5 * scale, 4 * scale, 1 * scale);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(3.5 * scale, 4 * scale, -1 * scale);
  group.add(rightEye);

  return group;
};

export default function RepoGraph3D({ graphData, onNodeSelect }) {
  const graphRef = useRef();
  const containerRef = useRef(); // 1. Reference to the container div
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 }); // 2. State for size
  const [pruneTrigger, setPruneTrigger] = useState(0);
  const [hoverNode, setHoverNode] = useState(null);

  const getPathToRoot = useCallback((node) => {
    const path = new Set();
    let currentId = node.id;

    // Safety: Limit loop to 100 levels deep to prevent crashes
    let attempts = 0;
    while (currentId && attempts < 100) {
      path.add(currentId); // Add current node to the "lit up" list
      
      if (currentId === 'root') break; // Stop if we hit the top

      // Find the link where "Target" == Current Node (so "Source" is the Parent)
      const parentLink = graphData.links.find(l => 
          (typeof l.target === 'object' ? l.target.id : l.target) === currentId
      );
      
      // Move up to the parent
      if (parentLink) {
          currentId = typeof parentLink.source === 'object' ? parentLink.source.id : parentLink.source;
      } else {
          break; // No parent found (detached node)
      }
      attempts++;
    }
    return path;
    }, [graphData]);

  // 3. Measure the container size on load and resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const visibleData = useMemo(() => {
    // ... (Keep your existing visibleData logic exactly the same) ...
    if (!graphData.nodes.length) return { nodes: [], links: [] };

    const visibleNodes = new Set();
    const visibleLinks = [];

    const traverse = (nodeId) => {
      visibleNodes.add(nodeId);
      const node = graphData.nodes.find(n => n.id === nodeId);
      if (!node || node.collapsed) return; 
      graphData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        if (sourceId === nodeId) {
          visibleLinks.push(link);
          traverse(targetId); 
        }
      });
    };

    traverse('root'); 
    return {
      nodes: graphData.nodes.filter(n => visibleNodes.has(n.id)),
      links: visibleLinks
    };
    // ...
  }, [graphData, pruneTrigger]);

  const handleNodeClick = useCallback(node => {
     // ... (Keep your existing handleNodeClick logic) ...
     if (onNodeSelect) onNodeSelect(node);
     if (node.childLinks?.length) {
        node.collapsed = !node.collapsed;
        setPruneTrigger(t => t + 1);
     }
     const distance = node.group === 'folder' ? 150 : 40;
     const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
     const newPos = node.x || node.y || node.z
      ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
      : { x: 0, y: 0, z: distance }; 

    graphRef.current.cameraPosition(newPos, node, 3000);
  }, [graphRef, onNodeSelect]);

  return (
    // 4. Wrap everything in a div with width/height 100% and the ref
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph3D
        ref={graphRef}
        // 5. Pass the measured dimensions here
        width={dimensions.width}
        height={dimensions.height}
        
        graphData={visibleData}
        backgroundColor="#0f172a"
        nodeLabel="name"
        // nodeVal={node => {
        //   // 1. Root and Folders: Use fixed sizes (Like your original code)
        //   if (node.id === 'root') return 30;
        //   if (node.group === 'folder') return 20;

        //   // 2. Files: Check if we actually have a valid size
        //   if (!node.size || node.size <= 0) {
        //       return 5; // FALLBACK: If no size data, look like a normal file
        //   }

        //   // 3. If size exists, calculate the Heatmap size
        //   // Math.max(5, ...) ensures even tiny files are at least size 5
        //   console.log(node.size);
        //   return Math.max(5, Math.log2(node.size) * 1.5);
        // }}
        nodeVal={0} 
    nodeOpacity={0}

    // CUSTOM RENDERER
    nodeThreeObject={node => {
        // CASE 1: FOLDERS (Keep as Text Labels + Blue Sphere)
        if (node.group === 'folder' || node.group === 'root') {
            const group = new THREE.Group();
            
            // The Blue/Red Sphere
            const color = node.id === 'root' ? '#ef4444' : '#3b82f6';
            const geometry = new THREE.SphereGeometry(node.group === 'root' ? 10 : 6);
            const material = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.8 });
            group.add(new THREE.Mesh(geometry, material));

            // The Text Label (Only if expanded)
            if (!node.collapsed) {
                const sprite = new SpriteText(node.name);
                sprite.color = 'white';
                sprite.textHeight = 4;
                sprite.position.y = 12;
                group.add(sprite);
            }
            return group;
        }

        // CASE 2: FILES -> BECOME DUCKS 🦆
        return createDuck(node);
    }}
        // 3. Capture Hover Events
        onNodeHover={setHoverNode}

        // 1. Highlight the full Path
        nodeColor={node => {
          const standardColor = 
          node.id === 'root' ? '#ef4444' : 
          node.group === 'folder' ? '#3b82f6' : 
          (String(node.name).endsWith('.js') || String(node.name).endsWith('.tsx')) ? '#eab308' : 
          '#10b981';

          // LOGIC: If hovering...
          if (hoverNode) {
            const path = getPathToRoot(hoverNode);
            // If this node is NOT in the path, dim it
            if (!path.has(node.id)) {
                return '#1e293b'; // Ghost Mode
            }
          }
          return standardColor;
        }}

          // 2. Highlight only links ON the path
        
          linkColor={link => {
            if (hoverNode) {
               const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
               const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                  
               const path = getPathToRoot(hoverNode);
               // Show link ONLY if both ends are part of the path
               if (path.has(sourceId) && path.has(targetId)) {
                return '#60a5fa'; // Bright Blue line for the active path
                } else {
                  return 'rgba(0,0,0,0)'; // Invisible
                }
              }
              return '#334155'; // Default color when not hovering
          }}
          
          // Make the active path slightly thicker
          linkWidth={link => {
              if (hoverNode) {
                  const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                  const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                  const path = getPathToRoot(hoverNode);
                  if (path.has(sourceId) && path.has(targetId)) return 3; // Thick line
              }
              return link.type === 'dependency' ? 0.5 : 1.5;
          }}
        
        // 6. Adjust Opacity (Optional: makes ghosts see-through)
        // nodeOpacity={0} 
        linkOpacity={0.3}
 
        linkDirectionalParticles={link => link.type === 'dependency' ? 4 : 0}
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick}
        nodeThreeObjectExtend={true}
        // nodeThreeObject={node => {
        //     if (node.group === 'folder' && !node.collapsed) {
        //         const sprite = new SpriteText(node.name);
        //         sprite.color = 'white';
        //         sprite.textHeight = 4; 
        //         sprite.position.y = 12; 
        //         return sprite;
        //     }
        // }}
      />
    </div>
  );
}