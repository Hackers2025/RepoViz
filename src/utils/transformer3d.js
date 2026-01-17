export const generate3DTree = (fileList) => {
  // 1. Create the Root Node
  const root = { 
    id: 'root', 
    name: 'Repository', 
    group: 'root', 
    collapsed: false, // Root is open
    childLinks: [] 
  };
  
  const nodes = { 'root': root };
  const links = [];

  // 2. Build the Tree
  fileList.forEach((file) => {
    // path: "src/components/Button.js"
    const parts = file.path.split('/');
    
    let currentPath = '';
    let parentId = 'root';

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const id = currentPath ? `${currentPath}/${part}` : part;
      
      if (!nodes[id]) {
        // Create Node
        nodes[id] = {
          id,
          name: part,
          group: isLast ? (file.type === 'tree' ? 'folder' : 'file') : 'folder',
          collapsed: true, // ALL folders start collapsed
          childLinks: [],
          size: (isLast && file.size) ? file.size : 0
        };

        // Link to Parent
        links.push({
          source: parentId,
          target: id
        });
        
        // Track children for the collapse logic
        nodes[parentId].childLinks.push(id);
      }
      
      // Heuristic: If we find a .css and .js with same name in same folder, link them!
      // (Simple dependency visualization)
      if (isLast && part.endsWith('.css')) {
          const jsVersion = id.replace('.css', '.js');
          const tsVersion = id.replace('.css', '.tsx');
          if (nodes[jsVersion]) links.push({ source: id, target: jsVersion, type: 'dependency' });
          if (nodes[tsVersion]) links.push({ source: id, target: tsVersion, type: 'dependency' });
      }

      parentId = id;
      currentPath = id;
    });
  });

  return { nodes: Object.values(nodes), links };
};