import React, { useState } from 'react';
import { fetchRepoTree } from './github'; 
import { generate3DTree } from './utils/transformer3d'; 
import RepoGraph3D from './components/RepoGraph3D'; 
import Sidebar from './components/Sidebar';
import { Loader2, Search, Github } from 'lucide-react';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // Basic validation
      const cleanUrl = repoUrl.replace('https://github.com/', '');
      const parts = cleanUrl.split('/');
      if (parts.length < 2) throw new Error("Invalid URL. Format: owner/repo");

      const rawTree = await fetchRepoTree(parts[0], parts[1]);
      const graphData = generate3DTree(rawTree); 
      setData(graphData); 
      setSelectedNode(null); 
      
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // MAIN LAYOUT: Vertical Stack (Header on Top, Content Below)
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden text-slate-200 font-sans">
      
      {/* --- AREA 1: TOP HEADER (Fixed Height) --- */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 z-50 shadow-md">
        
        {/* Logo / Title */}
        <div className="flex items-center gap-2 text-blue-400">
          <Github className="w-6 h-6" />
          <h1 className="font-bold text-lg tracking-wider text-slate-100">REPO<span className="text-blue-500">VIZ</span></h1>
        </div>

        {/* Central Search Bar */}
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

        {/* Action Button */}
        <button 
           onClick={handleAnalyze} 
           disabled={loading}
           className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4"/> : 'Visualize'}
        </button>
      </div>


      {/* --- BOTTOM AREA: Split 7:3 --- */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        
        {/* --- AREA 2: 3D GRAPH (70%) --- */}
        <div className="w-[70%] h-full relative bg-black">
          
          {/* The Graph Component */}
          <div className="w-full h-full">
            <RepoGraph3D 
              graphData={data} 
              onNodeSelect={setSelectedNode} 
            />
          </div>
          
          {/* Empty State / Welcome Message */}
          {data.nodes.length === 0 && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30 select-none">
              <div className="w-64 h-64 border border-dashed border-slate-600 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-48 h-48 border border-slate-700 rounded-full flex items-center justify-center">
                  <Github className="w-24 h-24 text-slate-600" />
                </div>
              </div>
              <p className="mt-8 text-slate-500 font-mono">WAITING FOR DATA STREAM...</p>
            </div>
          )}

          {/* Graph Legend (Bottom Left Overlay) */}
          {data.nodes.length > 0 && (
             <div className="absolute bottom-6 left-6 pointer-events-none select-none">
                <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-4 rounded-lg shadow-xl text-xs space-y-2">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div> Root</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div> Folder</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div> JS/TS File</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> Other</div>
                  <div className="h-px bg-slate-700 my-2"></div>
                  <p className="text-slate-400">Left Click: Focus & Expand</p>
                  <p className="text-slate-400">Right Click: Pan</p>
                  <p className="text-slate-400">Scroll: Zoom</p>
                </div>
             </div>
          )}
        </div>

        {/* --- AREA 3: DASHBOARD / SIDEBAR (30%) --- */}
        <div className="w-[30%] h-full border-l border-slate-800 bg-slate-900 relative z-20">
           {/* Passing 'w-full' to make sure Sidebar fills this container */}
           <Sidebar repoData={data} selectedNode={selectedNode} />
        </div>

      </div>
    </div>
  );
}

export default App;