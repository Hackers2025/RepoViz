import React, { useState } from 'react';
import { fetchRepoTree } from './github'; // Keep existing fetcher
import { generate3DTree } from './utils/transformer3d'; // NEW 3D Logic
import RepoGraph3D from './components/RepoGraph3D'; // NEW 3D Component
import { Loader2, Search } from 'lucide-react';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const parts = repoUrl.replace('https://github.com/', '').split('/');
      if (parts.length < 2) throw new Error("Invalid URL");

      const rawTree = await fetchRepoTree(parts[0], parts[1]);
      const graphData = generate3DTree(rawTree); // Use 3D Transformer
      
      // Important: We must pass a new object reference to trigger updates
      setData(graphData); 
      
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* HEADER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-2 rounded-xl shadow-2xl flex gap-2 pointer-events-auto">
          <input 
            className="bg-transparent text-white outline-none w-64 px-2"
            placeholder="facebook/react"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
          />
          <button 
             onClick={handleAnalyze} 
             className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded-lg font-bold flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Search className="w-4 h-4"/>}
            Visualize
          </button>
        </div>
      </div>

      {/* 3D CANVAS */}
      <div className="flex-1">
        <RepoGraph3D graphData={data} />
      </div>
      
      {/* INSTRUCTIONS OVERLAY */}
      {data.nodes.length > 0 && (
         <div className="absolute bottom-8 left-8 text-slate-500 text-sm pointer-events-none">
            <p>🔴 Root Node</p>
            <p>🔵 Folder (Click to Expand)</p>
            <p>🟡 JavaScript File</p>
            <p>🟢 Other File</p>
            <p className="mt-2 text-white">Left Click: Rotate | Right Click: Pan | Scroll: Zoom</p>
         </div>
      )}
    </div>
  );
}

export default App;