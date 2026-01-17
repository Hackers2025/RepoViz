import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';

export default function RepoGraph3D({ graphData, onNodeSelect }) {
  const graphRef = useRef();
  const containerRef = useRef(); // 1. Reference to the container div
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 }); // 2. State for size
  const [pruneTrigger, setPruneTrigger] = useState(0);
  const [hoverNode, setHoverNode] = useState(null);

  const getNeighbors = useCallback((node) => {
    const neighbors = new Set();
    // Loop through links to find connections
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      // If this link touches our node, add the OTHER end to neighbors
      if (sourceId === node.id) neighbors.add(targetId);
      if (targetId === node.id) neighbors.add(sourceId);
    });
    return neighbors;
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
        nodeVal={node => {
          // 1. Root and Folders: Use fixed sizes (Like your original code)
          if (node.id === 'root') return 30;
          if (node.group === 'folder') return 20;

          // 2. Files: Check if we actually have a valid size
          if (!node.size || node.size <= 0) {
              return 5; // FALLBACK: If no size data, look like a normal file
          }

          // 3. If size exists, calculate the Heatmap size
          // Math.max(5, ...) ensures even tiny files are at least size 5
          console.log(node.size);
          return Math.max(5, Math.log2(node.size) * 1.5);
        }}
        // 3. Capture Hover Events
        onNodeHover={setHoverNode}

        // 4. Dynamic Node Color (The Spotlight Logic)
        nodeColor={node => {
            // Define standard colors
            const standardColor = 
                node.id === 'root' ? '#ef4444' : 
                node.group === 'folder' ? '#3b82f6' : 
                (String(node.name).endsWith('.js') || String(node.name).endsWith('.tsx')) ? '#eab308' : 
                '#10b981';

            // LOGIC: If hovering AND this node is not the target AND not a neighbor...
            if (hoverNode && hoverNode.id !== node.id && !getNeighbors(hoverNode).has(node.id)) {
                return '#1e293b'; // ...Turn it Dark Grey (Ghost Mode)
            }
            return standardColor;
        }}

        // 5. Dynamic Link Transparency
        linkColor={link => {
            if (hoverNode) {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                
                // If link is NOT connected to the hovered node, hide it completely
                if (sourceId !== hoverNode.id && targetId !== hoverNode.id) {
                    return 'rgba(0,0,0,0)'; // Invisible
                }
            }
            return '#334155'; // Default Grey
        }}
        
        // 6. Adjust Opacity (Optional: makes ghosts see-through)
        nodeOpacity={1} 
        linkOpacity={0.3}
        linkWidth={link => link.type === 'dependency' ? 0.5 : 1.5}
        linkDirectionalParticles={link => link.type === 'dependency' ? 4 : 0}
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick}
        nodeThreeObjectExtend={true}
        nodeThreeObject={node => {
            if (node.group === 'folder' && !node.collapsed) {
                const sprite = new SpriteText(node.name);
                sprite.color = 'white';
                sprite.textHeight = 4; 
                sprite.position.y = 12; 
                return sprite;
            }
        }}
      />
    </div>
  );
}