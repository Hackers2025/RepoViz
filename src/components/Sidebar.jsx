import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FileCode, 
  Settings, 
  Box, 
  Folder, 
  File, 
  AlertCircle 
} from 'lucide-react';

export default function Sidebar({ repoData, selectedNode }) {
  const [activeTab, setActiveTab] = useState('overview');

  // --- 1. CALCULATE STATS (Memoized for performance) ---
  const stats = useMemo(() => {
    if (!repoData.nodes.length) return null;
    
    const nodes = repoData.nodes;
    const folders = nodes.filter(n => n.group === 'folder');
    const files = nodes.filter(n => n.group !== 'folder');
    
    // Simple extension counting
    const extensions = {};
    files.forEach(f => {
      const ext = f.name.split('.').pop();
      extensions[ext] = (extensions[ext] || 0) + 1;
    });

    // Sort top 3 languages
    const topLangs = Object.entries(extensions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      total: nodes.length,
      folderCount: folders.length,
      fileCount: files.length,
      topLangs
    };
  }, [repoData]);

  // --- IF NO DATA ---
  if (!repoData.nodes.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <Box className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-lg font-semibold mb-2">No Repository Loaded</h3>
        <p className="text-sm">Enter a GitHub URL above to generate the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 border-l border-slate-800 shadow-2xl">
      
      {/* --- TAB HEADER --- */}
      <div className="flex border-b border-slate-800 bg-slate-900/50">
        <TabButton 
          icon={<LayoutDashboard size={16}/>} 
          label="Overview" 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')} 
        />
        <TabButton 
          icon={<FileCode size={16}/>} 
          label="Inspector" 
          active={activeTab === 'inspector'} 
          onClick={() => setActiveTab('inspector')} 
        />
        <TabButton 
          icon={<Settings size={16}/>} 
          label="Settings" 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
        />
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto p-6 text-slate-300 scrollbar-thin scrollbar-thumb-slate-700">
        
        {/* === TAB 1: OVERVIEW === */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Project Stats</h2>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Real-time Analysis</p>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Nodes" value={stats.total} color="text-white" />
              <StatCard label="Folders" value={stats.folderCount} color="text-blue-400" />
              <StatCard label="Files" value={stats.fileCount} color="text-emerald-400" />
              <StatCard label="Depth" value="~5 Levels" color="text-purple-400" />
            </div>

            {/* Language Breakdown */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">Top Extensions</h3>
              <div className="space-y-3">
                {stats.topLangs.map(([ext, count], i) => (
                  <div key={ext} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-8">.{ext}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-blue-500' : 'bg-slate-500'}`} 
                        style={{ width: `${(count / stats.fileCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                <div className="flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                    <p className="text-xs text-blue-200 leading-relaxed">
                        Tip: Click on the <b>Blue</b> spheres in the graph to expand folders. The red sphere is the root of your project.
                    </p>
                </div>
            </div>
          </div>
        )}

        {/* === TAB 2: INSPECTOR === */}
        {activeTab === 'inspector' && (
          <div className="space-y-6 animate-fadeIn">
            {!selectedNode ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                <Box className="w-12 h-12 mb-2 opacity-50"/>
                <p className="text-sm">Select a node to inspect</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-lg ${selectedNode.group === 'folder' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {selectedNode.group === 'folder' ? <Folder size={24}/> : <File size={24}/>}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <h2 className="text-lg font-bold text-white truncate" title={selectedNode.name}>
                            {selectedNode.name}
                        </h2>
                        <p className="text-xs text-slate-500 font-mono">ID: {selectedNode.id}</p>
                    </div>
                </div>

                {/* Properties Table */}
                <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                    <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Node Properties</h3>
                    </div>
                    <div className="p-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Type</span>
                            <span className="text-white capitalize">{selectedNode.group}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Status</span>
                            <span className="text-white">{selectedNode.collapsed ? 'Collapsed' : 'Expanded'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Children</span>
                            <span className="text-white">{selectedNode.childLinks?.length || 0} items</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Depth</span>
                            <span className="text-white">Level {selectedNode.id.split('/').length}</span>
                        </div>
                    </div>
                </div>
                
                {/* Simulated AI Description */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Description</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        {selectedNode.group === 'folder' 
                            ? `This directory contains ${selectedNode.childLinks?.length || 0} files. It likely serves as a structural container for the project's ${selectedNode.name} logic.` 
                            : `This file appears to be a source code file. Based on the extension, it likely handles specific logic for the ${selectedNode.name.split('.')[0]} module.`}
                    </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* === TAB 3: SETTINGS === */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">View Settings</h2>
              <p className="text-xs text-slate-500">Customize display engine</p>
            </div>

            <div className="space-y-4">
               <ToggleRow label="Show Particles" active={true} />
               <ToggleRow label="3D Mode" active={true} />
               <ToggleRow label="Auto-Rotate" active={false} />
               <ToggleRow label="High Quality Textures" active={true} />
            </div>
            
            <div className="pt-6 border-t border-slate-800">
                <button className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-bold rounded transition-colors">
                    Reset Graph View
                </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS for cleaner code ---

function TabButton({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-medium transition-all relative
        ${active ? 'text-blue-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}
      `}
    >
      {icon}
      <span>{label}</span>
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
    </button>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-slate-800/40 p-3 rounded border border-slate-700/50 flex flex-col items-center justify-center text-center hover:border-slate-600 transition-colors">
      <span className={`text-2xl font-bold font-mono ${color}`}>{value}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{label}</span>
    </div>
  );
}

function ToggleRow({ label, active }) {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700 opacity-75 hover:opacity-100 transition-opacity cursor-pointer">
            <span className="text-sm text-slate-300">{label}</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${active ? 'bg-blue-600' : 'bg-slate-600'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${active ? 'left-4.5' : 'left-0.5'}`} />
            </div>
        </div>
    )
}