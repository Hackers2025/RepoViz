// src/App.jsx
import { useState } from 'react';
import { fetchRepoTree } from './github';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  
  const handleAnalyze = async () => {
    // Extract owner/name from URL (e.g., "facebook/react")
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return alert("Invalid GitHub URL");
    
    const [_, owner, repo] = match;
    console.log(`Fetching ${owner}/${repo}...`);
    
    const data = await fetchRepoTree(owner, repo);
    console.log("THE DATA IS HERE:", data); // <--- Watch the Console
    alert("Check your Console (F12) to see the file tree!");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-10">
      <h1 className="text-4xl font-bold mb-8">Repo Visualizer Debugger</h1>
      <div className="flex gap-4">
        <input 
          type="text" 
          placeholder="https://github.com/facebook/react"
          className="p-3 rounded text-black w-96"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
        <button 
          onClick={handleAnalyze}
          className="bg-blue-500 px-6 py-3 rounded font-bold hover:bg-blue-600"
        >
          Fetch Data
        </button>
      </div>
    </div>
  );
}

export default App;