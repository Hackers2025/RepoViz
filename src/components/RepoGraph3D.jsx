import * as THREE from 'three'; 
import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';

export default function RepoGraph3D({ graphData, onNodeSelect }) {
  const graphRef = useRef();
  const containerRef = useRef(); 
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 }); 
  const [pruneTrigger, setPruneTrigger] = useState(0);
  const [hoverNode, setHoverNode] = useState(null);

  // --- 1. STARFIELD BACKGROUND (Increased to 5000 stars) ---
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;

    // Clear old stars if any
    fg.scene().children = fg.scene().children.filter(c => c.type !== 'Points');

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 15000; // INCREASED DENSITY
    const posArray = new Float32Array(starCount * 3); 

    for(let i = 0; i < starCount * 3; i++) {
      // Spread stars over a larger area (3000 units) for depth
      posArray[i] = (Math.random() - 0.5) * 3000; 
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.5, // Slightly smaller stars for realism
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true // Makes distant stars smaller
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    fg.scene().add(stars);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    fg.scene().add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(100, 100, 100);
    fg.scene().add(dirLight);

  }, []); 

  // --- 2. PATH FINDING HELPER ---
  const getPathToRoot = useCallback((node) => {
    const path = new Set();
    let currentId = node.id;
    let attempts = 0;
    while (currentId && attempts < 100) {
      path.add(currentId); 
      if (currentId === 'root') break; 
      const parentLink = graphData.links.find(l => 
          (typeof l.target === 'object' ? l.target.id : l.target) === currentId
      );
      if (parentLink) {
          currentId = typeof parentLink.source === 'object' ? parentLink.source.id : parentLink.source;
      } else {
          break; 
      }
      attempts++;
    }
    return path;
    }, [graphData]);

  // --- 3. RESIZE HANDLER ---
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

  // --- 4. DATA FILTERING (EXPAND ON CLICK) ---
  const visibleData = useMemo(() => {
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
  }, [graphData, pruneTrigger]);

  // --- 5. CLICK HANDLER ---
  const handleNodeClick = useCallback(node => {
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
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph3D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        
        graphData={visibleData}
        backgroundColor="#000000" 
        nodeLabel="name"
        nodeVal={0} 
        nodeOpacity={0}

        // --- CUSTOM RENDERER (Spheres Only) ---
        nodeThreeObject={node => {
            const group = new THREE.Group();
            
            // Determine Color
            let color = '#10b981'; // Default Green (File)
            if (node.id === 'root') color = '#ef4444'; // Red
            else if (node.group === 'folder') color = '#3b82f6'; // Blue
            else if (String(node.name).endsWith('.js') || String(node.name).endsWith('.tsx')) color = '#eab308'; // Yellow

            // Determine Size
            const size = node.group === 'root' ? 10 : (node.group === 'folder' ? 6 : 4);

            // Create Sphere
            const geometry = new THREE.SphereGeometry(size, 16, 16);
            const material = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.9 });
            group.add(new THREE.Mesh(geometry, material));

            // Add Text Label (Only for folders/root or if expanded)
            if ((node.group === 'folder' || node.group === 'root') && !node.collapsed) {
                const sprite = new SpriteText(node.name);
                sprite.color = 'white';
                sprite.textHeight = 4;
                sprite.position.y = size + 4; // Float above node
                group.add(sprite);
            }
            return group;
        }}
        
        onNodeHover={setHoverNode}
        
        // --- PATH HIGHLIGHTING ---
        nodeColor={node => {
          let color = '#eab308';
          if (node.id === 'root') color = '#ef4444';
          else if (node.group === 'folder') color = '#3b82f6';

          if (hoverNode) {
            const path = getPathToRoot(hoverNode);
            if (!path.has(node.id)) return '#1e293b'; // Dim if not in path
          }
          return color;
        }}

        linkColor={link => {
            if (hoverNode) {
               const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
               const targetId = typeof link.target === 'object' ? link.target.id : link.target;
               const path = getPathToRoot(hoverNode);
               
               if (path.has(sourceId) && path.has(targetId)) return '#60a5fa'; 
               return 'rgba(0,0,0,0)'; 
            }
            return '#334155'; 
        }}
          
        linkWidth={link => {
            if (hoverNode) {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                const path = getPathToRoot(hoverNode);
                if (path.has(sourceId) && path.has(targetId)) return 3; 
            }
            return link.type === 'dependency' ? 0.5 : 1.5;
        }}
        
        linkOpacity={0.3}
        linkDirectionalParticles={link => link.type === 'dependency' ? 4 : 0}
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick}
        nodeThreeObjectExtend={true}
      />
    </div>
  );
}