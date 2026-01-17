export const generateGraphElements = (treeData) => {
  const nodes = [];
  const edges = [];
  
  // 1. Create a Set for fast lookup of existing folders
  const folderSet = new Set();

  // Safety check
  if (!treeData || !Array.isArray(treeData)) {
    console.warn("Transformer received invalid data:", treeData);
    return { nodes: [], edges: [] };
  }

  treeData.forEach((item) => {
    if (!item || !item.path) {
      return; 
    }
    // item.path looks like "src/components/Button.jsx"
    const parts = item.path.split('/');
    const fileName = parts.pop(); // "Button.jsx"
    const folderPath = parts.join('/'); // "src/components"
    
    const isFolder = item.type === 'tree';
    
    // 2. Create the NODE
    nodes.push({
      id: item.path, // Unique ID is the full path
      type: 'default', 
      data: { 
        label: fileName,
        isFolder: isFolder,
        fileType: isFolder ? 'folder' : fileName.split('.').pop() // "js", "css", etc.
      },
      position: { x: 0, y: 0 }, // We will fix this in the next step
      style: {
        // Basic styling based on type
        backgroundColor: isFolder ? '#334155' : '#1e293b',
        color: '#fff',
        border: '1px solid #475569',
        borderRadius: isFolder ? '4px' : '12px',
        width: 150,
      }
    });

    // 3. Create the EDGE (Connect to parent)
    if (folderPath) {
      edges.push({
        id: `e-${folderPath}-${item.path}`,
        source: folderPath, // Connect from Parent
        target: item.path,  // To Child
        type: 'smoothstep', // Nice curved lines
        animated: true,
        style: { stroke: '#64748b' }
      });
    }
  });

  return { nodes, edges };
};