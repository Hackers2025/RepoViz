import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileCode, 
  Settings, 
  Box, 
  Folder, 
  File, 
  AlertCircle,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function Sidebar({ repoData, selectedNode, aiData, isAiLoading }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expansion when node changes
  useEffect(() => {
     setIsExpanded(false);
  }, [selectedNode]);

  // Switch to Inspector tab automatically when a node is selected
  useEffect(() => {
    if (selectedNode) setActiveTab('inspector');
  }, [selectedNode]);

  // --- 1. CALCULATE STATS ---
  const stats = useMemo(() => {
    if (!repoData.nodes.length) return null;
    const nodes = repoData.nodes;
    const folders = nodes.filter(n => n.group === 'folder');
    const files = nodes.filter(n => n.group !== 'folder');
    
    const extensions = {};
    files.forEach(f => {
      const ext = f.name.split('.').pop();
      extensions[ext] = (extensions[ext] || 0) + 1;
    });

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

  if (!repoData.nodes.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <Box className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-lg font-semibold mb-2">No Repository Loaded</h3>
        <p className="text-sm">Enter a GitHub URL above.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 border-l border-slate-800 shadow-2xl">
      
      {/* TAB HEADER */}
      <div className="flex border-b border-slate-800 bg-slate-900/50">
        <TabButton icon={<LayoutDashboard size={16}/>} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <TabButton icon={<FileCode size={16}/>} label="Inspector" active={activeTab === 'inspector'} onClick={() => setActiveTab('inspector')} />
        <TabButton icon={<Settings size={16}/>} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6 text-slate-300 scrollbar-thin scrollbar-thumb-slate-700">
        
        {/* === TAB 1: OVERVIEW === */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Project Stats</h2>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Real-time Analysis</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Nodes" value={stats.total} color="text-white" />
              <StatCard label="Folders" value={stats.folderCount} color="text-blue-400" />
              <StatCard label="Files" value={stats.fileCount} color="text-emerald-400" />
              <StatCard label="Depth" value="~5 Levels" color="text-purple-400" />
            </div>
            {/* Language Bar */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
               <h3 className="text-sm font-semibold text-white mb-3">Top Extensions</h3>
               <div className="space-y-3">
                 {stats.topLangs.map(([ext, count], i) => (
                   <div key={ext} className="flex items-center gap-3">
                     <span className="text-xs font-mono text-slate-400 w-8">.{ext}</span>
                     <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                       <div className={`h-full rounded-full ${i===0?'bg-yellow-500':i===1?'bg-blue-500':'bg-slate-500'}`} style={{ width: `${(count / stats.fileCount) * 100}%` }} />
                     </div>
                     <span className="text-xs font-bold text-white">{count}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* === TAB 2: INSPECTOR (AI INTEGRATION) === */}
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
                        <p className="text-xs text-slate-500 font-mono break-all">{selectedNode.id}</p>
                    </div>
                </div>

                {/* AI INSIGHT BOX */}
                <div className="bg-slate-800/80 rounded-lg overflow-hidden border border-slate-600 shadow-md transition-all duration-300">
                    
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">AI Analysis</h3>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {isAiLoading ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-2">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                <span className="text-xs text-slate-500"> analyzing...</span>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                
                                {/* The Concise Summary */}
                                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                    {aiData.summary || "No analysis available."}
                                </p>

                                {/* The Hidden Detailed Section */}
                                {isExpanded && (
                                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                                        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-mono">
                                            {/* Added 'whitespace-pre-wrap' and 'font-mono' */}
                                            {aiData.detail || "No further details available."}
                                        </p>
                                    </div>
                                )}

                                {/* The Toggle Button */}
                                {aiData.detail && aiData.detail.length > 5 && (
                                    <button 
                                      onClick={() => setIsExpanded(!isExpanded)}
                                      className="mt-3 flex items-center gap-1 text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        {isExpanded ? (
                                            <>Read Less <ChevronUp size={12} /></>
                                        ) : (
                                            <>Read More <ChevronDown size={12} /></>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* CODE PREVIEW (Only if code exists) */}
                {aiData.code && !isAiLoading && (
                    <div className="flex flex-col gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Source Code Preview</h3>
                        <div className="bg-black/50 rounded-lg border border-slate-800 p-4 overflow-x-auto">
                            <pre className="text-xs font-mono text-gray-300">
                                <code>{aiData.code.length > 1000 ? aiData.code.substring(0, 1000) + '...\n(Truncated)' : aiData.code}</code>
                            </pre>
                        </div>
                    </div>
                )}
              </>
            )}
          </div>
        )}

        {/* === TAB 3: SETTINGS === */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
             <div className="space-y-4">
                <ToggleRow label="Show Particles" active={true} />
                <ToggleRow label="3D Mode" active={true} />
             </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Helpers... (TabButton, StatCard, ToggleRow same as before)
function TabButton({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-medium transition-all relative ${active ? 'text-blue-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}>
      {icon} <span>{label}</span>
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
    </button>
  );
}
function StatCard({ label, value, color }) {
  return (
    <div className="bg-slate-800/40 p-3 rounded border border-slate-700/50 flex flex-col items-center justify-center text-center">
      <span className={`text-2xl font-bold font-mono ${color}`}>{value}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{label}</span>
    </div>
  );
}
function ToggleRow({ label, active }) {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700 opacity-75">
            <span className="text-sm text-slate-300">{label}</span>
            <div className={`w-8 h-4 rounded-full relative ${active ? 'bg-blue-600' : 'bg-slate-600'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${active ? 'left-4.5' : 'left-0.5'}`} />
            </div>
        </div>
    )
}