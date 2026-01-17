import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  FileCode, 
  MessageSquare, // Chat Icon
  Box, 
  Folder, 
  File, 
  Sparkles,
  Loader2,
  Send,
  User,
  Bot,
  ChevronDown,
  ChevronUp,
  Compass, // Navigator Icon
  Hammer,  // Architect Icon
  Cpu      // System Icon
} from 'lucide-react';
// IMPORT THE AGENT ORCHESTRATOR
import { askRepoQuestion } from '../utils/ai/orchestrator';
import TypewriterMarkdown from './TypewriterMarkdown';

export default function Sidebar({ repoData, selectedNode, aiData, isAiLoading, repoOwner, repoName, rawTreeList }) {
  const [activeTab, setActiveTab] = useState('overview');

  // --- INSPECTOR STATE ---
  const [isExpanded, setIsExpanded] = useState(false);

  // --- CHAT STATE ---
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', content: 'Hi! I am your Repo Assistant. Ask me anything about this codebase.' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState(null); // { agent: 'Navigator', message: '...' }
  const chatEndRef = useRef(null);

  // Auto-switch to inspector when node selected
  useEffect(() => {
    if (selectedNode) {
        setActiveTab('inspector');
        setIsExpanded(false); // Reset read more
    }
  }, [selectedNode]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeTab]);

  // --- STATS CALCULATION ---
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

    return { total: nodes.length, folderCount: folders.length, fileCount: files.length, topLangs };
  }, [repoData]);

  // --- CHAT HANDLER ---
  const handleSend = async () => {
    if (!input.trim() || isChatLoading) return;

    const userMsg = input;
    setInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    
    setIsChatLoading(true);
    setAgentStatus({ agent: 'System', message: 'Initializing agents...' });

    try {
      // Call the Orchestrator with the Callback
      const answer = await askRepoQuestion(
        userMsg, 
        rawTreeList, 
        repoOwner, 
        repoName,
        (agent, message) => setAgentStatus({ agent, message }), // Update UI Status
        chatHistory
      );
      
      setChatHistory(prev => [...prev, { role: 'ai', content: answer }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I crashed." }]);
    } finally {
      setIsChatLoading(false);
      setAgentStatus(null);
    }
  };

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
      
      {/* TABS */}
      <div className="flex border-b border-slate-800 bg-slate-900/50">
        <TabButton icon={<LayoutDashboard size={16}/>} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <TabButton icon={<FileCode size={16}/>} label="Inspector" active={activeTab === 'inspector'} onClick={() => setActiveTab('inspector')} />
        <TabButton icon={<MessageSquare size={16}/>} label="Ask AI" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* === OVERVIEW TAB === */}
        {activeTab === 'overview' && stats && (
          <div className="p-6 overflow-y-auto h-full text-slate-300 space-y-6 animate-fadeIn">
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

        {/* === INSPECTOR TAB === */}
        {activeTab === 'inspector' && (
          <div className="p-6 overflow-y-auto h-full text-slate-300 space-y-6 animate-fadeIn">
            {!selectedNode ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                <Box className="w-12 h-12 mb-2 opacity-50"/>
                <p className="text-sm">Select a node to inspect</p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-lg ${selectedNode.group === 'folder' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {selectedNode.group === 'folder' ? <Folder size={24}/> : <File size={24}/>}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <h2 className="text-lg font-bold text-white truncate" title={selectedNode.name}>{selectedNode.name}</h2>
                        <p className="text-xs text-slate-500 font-mono break-all">{selectedNode.id}</p>
                    </div>
                </div>

                {/* AI INSIGHT BOX */}
                <div className="bg-slate-800/80 rounded-lg overflow-hidden border border-slate-600 shadow-md transition-all duration-300">
                    <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">AI Analysis</h3>
                        </div>
                    </div>
                    <div className="p-4">
                        {isAiLoading ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-2">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                <span className="text-xs text-slate-500">analyzing...</span>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                    {aiData.summary || "No analysis available."}
                                </p>
                                {isExpanded && aiData.detail && (
                                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                                        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap font-mono">
                                            {aiData.detail}
                                        </p>
                                    </div>
                                )}
                                {aiData.detail && (
                                    <button 
                                      onClick={() => setIsExpanded(!isExpanded)}
                                      className="mt-3 flex items-center gap-1 text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        {isExpanded ? <>Read Less <ChevronUp size={12} /></> : <>Read More <ChevronDown size={12} /></>}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* CODE PREVIEW */}
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

        {/* === ASK AI TAB === */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full bg-slate-900">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                    {msg.role === 'user' ? <User size={14}/> : <Bot size={14}/>}
                  </div>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed overflow-hidden ${msg.role === 'user' ? 'bg-blue-600/20 text-blue-100 rounded-tr-none' : 'bg-slate-800 text-slate-300 rounded-tl-none'}`}>
                    {msg.role === 'ai' && idx === chatHistory.length - 1 && !agentStatus ? (
                         <TypewriterMarkdown content={msg.content} speed={3} />
                    ) : (
                         // Render static markdown for old messages or user messages
                         <TypewriterMarkdown content={msg.content} speed={0} />
                    )}
                  </div>
                </div>
              ))}
              
              {/* AGENT VISUALIZER */}
              {isChatLoading && agentStatus && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 ml-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-10">
                        {agentStatus.agent === 'Navigator' && <Compass size={12} className="text-blue-400" />}
                        {agentStatus.agent === 'Architect' && <Hammer size={12} className="text-purple-400" />}
                        {agentStatus.agent === 'System' && <Cpu size={12} className="text-emerald-400" />}
                        <span>{agentStatus.agent} Agent</span>
                    </div>
                    <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse ${
                            agentStatus.agent==='Navigator'?'bg-blue-600':agentStatus.agent==='Architect'?'bg-purple-600':'bg-emerald-600'
                        }`}><Bot size={14}/></div>
                        <div className="bg-slate-800 rounded-2xl p-3 rounded-tl-none border border-slate-700/50 flex items-center gap-3 shadow-lg">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            <span className="text-sm text-slate-300 font-mono">{agentStatus.message}</span>
                        </div>
                    </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900">
                <div className="relative">
                    <input 
                        className="w-full bg-slate-800 border border-slate-700 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
                        placeholder="Ask about code, files, or features..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isChatLoading}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isChatLoading}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Helpers
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