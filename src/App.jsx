import React, { useState } from 'react';
import { fetchRepoTree, fetchFileContent } from './github'; 
import { generateFolderSummary, generateFileExplanation } from './utils/ai'; // <--- IMPORT AI
import { generate3DTree } from './utils/transformer3d'; 
import RepoGraph3D from './components/RepoGraph3D'; 
import Sidebar from './components/Sidebar';
import { Loader2, Search, Github } from 'lucide-react';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // --- NEW STATE FOR AI & CONTEXT ---
  const [rawTreeList, setRawTreeList] = useState([]); // Context for AI
  const [sidebarData, setSidebarData] = useState({ description: '', code: '' }); // Content for Sidebar
  const [aiLoading, setAiLoading] = useState(false); // Spinner for Sidebar

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const cleanUrl = repoUrl.replace('https://github.com/', '');
      const parts = cleanUrl.split('/');
      if (parts.length < 2) throw new Error("Invalid URL. Format: owner/repo");

      const rawTree = await fetchRepoTree(parts[0], parts[1]);
      
      // 1. SAVE RAW LIST FOR AI CONTEXT
      setRawTreeList(rawTree.map(item => item.path));

      const graphData = generate3DTree(rawTree); 
      setData(graphData); 
      setSelectedNode(null); 
      setSidebarData({ description: '', code: '' }); // Reset sidebar
      
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: HANDLE NODE CLICKS (AI TRIGGER) ---
  const handleNodeSelect = async (node) => {
    setSelectedNode(node);
    if (!node) return;

    setAiLoading(true);
    // Initialize with empty object
    setSidebarData({ summary: '', detail: '', code: '' }); 

    try {
      // CASE 1: FOLDER
      if (node.group === 'folder' || node.group === 'root') {
        const childrenIds = node.childLinks || [];
        const folderFileNames = childrenIds.map(id => id.split('/').pop());
        
        // Returns { summary, detail }
        const aiResult = await generateFolderSummary(node.name, folderFileNames, rawTreeList);
        
        setSidebarData({ 
            summary: aiResult.summary, 
            detail: aiResult.detail,
            code: '' 
        });
      } 
      // CASE 2: FILE
      else {
        const cleanUrl = repoUrl.replace('https://github.com/', '');
        const parts = cleanUrl.split('/');
        
        const code = await fetchFileContent(parts[0], parts[1], node.id);
        const aiResult = await generateFileExplanation(node.name, code, rawTreeList);

        setSidebarData({ 
            summary: aiResult.summary, 
            detail: aiResult.detail,
            code: code 
        });
      }
    } catch (err) {
      console.error(err);
      setSidebarData({ summary: "Failed to generate insight.", detail: "", code: "" });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden text-slate-200 font-sans">
      
      {/* HEADER */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 z-50 shadow-md">
        <div className="flex items-center gap-2 text-blue-400">
          <Github className="w-6 h-6" />
          <h1 className="font-bold text-lg tracking-wider text-slate-100">REPO<span className="text-blue-500">VIZ</span></h1>
        </div>

        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 w-96 transition-colors focus-within:border-blue-500">
          <Search className="w-4 h-4 text-slate-500 mr-2" />
          <input 
            className="bg-transparent outline-none text-sm w-full placeholder:text-slate-600 text-white"
            placeholder="owner/repo (e.g. facebook/react)"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          />
        </div>

        <button 
           onClick={handleAnalyze} 
           disabled={loading}
           className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4"/> : 'Visualize'}
        </button>
      </div>

      {/* CONTENT SPLIT */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        
        {/* GRAPH AREA */}
        <div className="w-[70%] h-full relative bg-black">
          <div className="w-full h-full">
            <RepoGraph3D 
              graphData={data} 
              onNodeSelect={handleNodeSelect} // <--- PASS THE NEW HANDLER
            />
          </div>
          
          {data.nodes.length === 0 && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30 select-none">
              <div className="w-64 h-64 border border-dashed border-slate-600 rounded-full flex items-center justify-center animate-pulse">
                <Github className="w-24 h-24 text-slate-600" />
              </div>
              <p className="mt-8 text-slate-500 font-mono">WAITING FOR DATA STREAM...</p>
            </div>
          )}

          {data.nodes.length > 0 && (
             <div className="absolute bottom-6 left-6 pointer-events-none select-none">
                <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-4 rounded-lg shadow-xl text-xs space-y-2">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div> Root</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div> Folder</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div> File</div>
                </div>
             </div>
          )}
        </div>

        {/* SIDEBAR AREA */}
        <div className="w-[30%] h-full border-l border-slate-800 bg-slate-900 relative z-20">
           <Sidebar 
              repoData={data} 
              selectedNode={selectedNode} 
              aiData={sidebarData}   // <--- PASS DATA
              isAiLoading={aiLoading} // <--- PASS LOADING STATE
           />
        </div>

      </div>
    </div>
  );
}

export default App;