import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';

export default function RepoGraph3D({ graphData, onNodeSelect }) {
  const graphRef = useRef();
  const containerRef = useRef(); // 1. Reference to the container div
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 }); // 2. State for size
  const [pruneTrigger, setPruneTrigger] = useState(0);

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
        nodeColor={node => {
            if (node.id === 'root') return '#ef4444'; 
            if (node.group === 'folder') return '#3b82f6'; 
            if (String(node.name).endsWith('.js') || String(node.name).endsWith('.tsx')) return '#eab308'; 
            return '#10b981'; 
        }}
        nodeVal={node => node.group === 'folder' ? 15 : 5} 
        linkWidth={link => link.type === 'dependency' ? 0.5 : 1.5}
        linkColor={link => link.type === 'dependency' ? '#f472b6' : '#64748b'}
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