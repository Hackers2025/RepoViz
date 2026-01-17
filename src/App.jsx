import React, { useState } from 'react';
import { fetchRepoTree, fetchFileContent } from './github';
import { 
  generateFolderSummary, 
  generateFileExplanation, 
  resetBrain 
} from './utils/ai/orchestrator'; 
import { generate3DTree } from './utils/transformer3d'; 
import RepoGraph3D from './components/RepoGraph3D'; 
import Sidebar from './components/Sidebar';
import { Loader2, Search, Github } from 'lucide-react';
import { findImports } from './utils/ai';
import repovizLogo from "./assets/repobiz.jpg";

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // --- STATE FOR AI & CONTEXT ---
  const [rawTreeList, setRawTreeList] = useState([]); // Context for AI
  const [sidebarData, setSidebarData] = useState({ summary: '', detail: '', code: '' }); // Content for Sidebar
  const [aiLoading, setAiLoading] = useState(false); // Spinner for Inspector

  // Helper to extract owner/repo for the Chat Agent
  const getRepoDetails = () => {
    if (!repoUrl) return { owner: '', repo: '' };
    const parts = repoUrl.replace('https://github.com/', '').split('/');
    return { owner: parts[0], repo: parts[1] };
  };
  const { owner, repo } = getRepoDetails();

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const cleanUrl = repoUrl.replace('https://github.com/', '');
      const parts = cleanUrl.split('/');
      if (parts.length < 2) throw new Error("Invalid URL. Format: owner/repo");

      // 1. RESET AI MEMORY (New Repo = New Brain)
      resetBrain();

      const rawTree = await fetchRepoTree(parts[0], parts[1]);
      
      // 2. SAVE RAW LIST FOR AI CONTEXT
      setRawTreeList(rawTree.map(item => item.path));

      const graphData = generate3DTree(rawTree); 
      setData(graphData); 
      setSelectedNode(null); 
      setSidebarData({ summary: '', detail: '', code: '' }); // Reset sidebar
      
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLE NODE CLICKS (INSPECTOR TRIGGER) ---
  const handleNodeSelect = async (node) => {
    setSelectedNode(node);
    if (!node) return;

    setData(prevData => ({
        ...prevData,
        links: prevData.links.filter(l => l.type !== 'dependency') // Remove old pink lines
    }));

    setAiLoading(true);
    setSidebarData({ summary: '', detail: '', code: '' }); // Clear previous data

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
        const parts = repoUrl.replace('https://github.com/', '').split('/');
        
        // A. Fetch Real Code
        const code = await fetchFileContent(parts[0], parts[1], node.id);
        
        // --- NEW: DEPENDENCY VISUALIZATION ---
        // 1. Find imported files
        const importIds = findImports(code, data.nodes);
        
        // 2. Create new pink links
        const newLinks = importIds.map(targetId => ({
            source: node.id,
            target: targetId,
            type: 'dependency' // Mark as special
        }));

        // 3. Inject into Graph Data
        if (newLinks.length > 0) {
            setData(prevData => ({
                ...prevData,
                links: [...prevData.links, ...newLinks]
            }));
        }

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
          <img 
            src={repovizLogo} 
            alt="RepoViz Logo" 
            className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
          />
          <h1 className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            REPOVIZ
          </h1>
        </div>

        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 w-96 transition-colors focus-within:border-blue-500">
          <Search className="w-4 h-4 text-slate-500 mr-2" />
          <input 
            className="bg-transparent outline-none text-sm w-full placeholder:text-slate-600 text-white"
            placeholder="GitHub repo URL (e.g. https://github.com/facebook/react)"
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
              onNodeSelect={handleNodeSelect} 
            />
          </div>
          
          {data.nodes.length === 0 && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30 select-none">
              <div className="w-64 h-64 border border-dashed border-slate-600 rounded-full flex items-center justify-center animate-pulse">
                <Github className="w-24 h-24 text-white" />
              </div>
              <p className="mt-8 text-white font-mono">WAITING FOR DATA STREAM...</p>
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
              aiData={sidebarData}   
              isAiLoading={aiLoading}
              
              // --- PROPS FOR CHAT AGENT ---
              rawTreeList={rawTreeList}
              repoOwner={owner}
              repoName={repo}
           />
        </div>

      </div>
    </div>
  );
}

export default App;