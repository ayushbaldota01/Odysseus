
import React, { useState, useEffect } from 'react';
import { BrainItem, DailyUpload } from '../types';
import { processBrainDump, generateDailyProtocol } from '../services/geminiService';
import VoiceInputButton from './VoiceInputButton';

interface KnowledgeHubProps {
  brainItems: BrainItem[];
  setBrainItems: React.Dispatch<React.SetStateAction<BrainItem[]>>;
  dailyUploads: DailyUpload[];
  setDailyUploads: React.Dispatch<React.SetStateAction<DailyUpload[]>>;
}

const KnowledgeHub: React.FC<KnowledgeHubProps> = ({ brainItems, setBrainItems, dailyUploads, setDailyUploads }) => {
  const [activeTab, setActiveTab] = useState<'PROTOCOL' | 'OPEN_BOX'>('PROTOCOL');
  
  // Inbox State
  const [dumpInput, setDumpInput] = useState('');
  const [isProcessingDump, setIsProcessingDump] = useState(false);

  // Daily State
  const [todaysUpload, setTodaysUpload] = useState<DailyUpload | null>(null);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);

  useEffect(() => {
    // Check if we have a daily upload for today
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = dailyUploads.find(d => d.date === todayStr);
    
    if (existing) {
      setTodaysUpload(existing);
    } else {
      handleGenerateDaily(todayStr);
    }
  }, []);

  const handleGenerateDaily = async (dateStr: string) => {
    setIsLoadingDaily(true);
    // Get last 5 topics to avoid repetition
    const recentTopics = dailyUploads.slice(0, 5).map(d => d.topic);
    
    const result = await generateDailyProtocol(recentTopics);
    
    const newUpload: DailyUpload = {
      id: Date.now().toString(),
      date: dateStr,
      completed: false,
      ...result
    };
    
    setDailyUploads(prev => [newUpload, ...prev]);
    setTodaysUpload(newUpload);
    setIsLoadingDaily(false);
  };

  const handleDumpSubmit = async () => {
    if (!dumpInput.trim()) return;
    setIsProcessingDump(true);
    
    const processedItems = await processBrainDump(dumpInput);
    
    const newItems: BrainItem[] = processedItems.map((item, index) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + index,
      addedAt: new Date().toLocaleDateString(),
      status: 'NEW',
      originalText: dumpInput,
      ...item
    }));

    setBrainItems(prev => [...newItems, ...prev]);
    setDumpInput('');
    setIsProcessingDump(false);
  };

  const toggleItemStatus = (id: string) => {
    setBrainItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: item.status === 'NEW' ? 'CONSUMED' : 'NEW' } : item
    ));
  };

  const markDailyComplete = () => {
    if (!todaysUpload) return;
    const updated = { ...todaysUpload, completed: true };
    setDailyUploads(prev => prev.map(u => u.id === todaysUpload.id ? updated : u));
    setTodaysUpload(updated);
  };

  const renderCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'READ': return 'menu_book';
      case 'WATCH': return 'play_circle';
      case 'TOOL': return 'build';
      case 'CONCEPT': return 'lightbulb';
      default: return 'article';
    }
  };

  const renderCategoryColor = (cat: string) => {
    switch(cat) {
      case 'READ': return 'text-blue-400';
      case 'WATCH': return 'text-red-400';
      case 'TOOL': return 'text-orange-400';
      case 'CONCEPT': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <header className="flex justify-between items-end border-b border-slate-700 pb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-400 font-mono">SECOND_BRAIN</h2>
          <p className="text-slate-400 text-xs md:text-sm">Knowledge Ingestion & Daily Upgrades</p>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <button 
                onClick={() => setActiveTab('PROTOCOL')}
                className={`px-3 md:px-4 py-1.5 rounded text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'PROTOCOL' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                PROTOCOL <span className="material-icons-round text-xs hidden md:block">update</span>
            </button>
            <button 
                onClick={() => setActiveTab('OPEN_BOX')}
                className={`px-3 md:px-4 py-1.5 rounded text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'OPEN_BOX' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                OPEN_BOX <span className="material-icons-round text-xs hidden md:block">all_inbox</span>
            </button>
        </div>
      </header>

      {activeTab === 'PROTOCOL' && (
        <div className="flex-1 overflow-y-auto px-1">
          <div className="max-w-4xl mx-auto space-y-8 pb-6">
            {/* Today's Card */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-slate-900 border border-slate-700 rounded-xl p-4 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-6">
                        <div>
                            <span className="text-[10px] md:text-xs font-mono text-emerald-500 uppercase tracking-widest mb-1 block">
                                Daily Download • {new Date().toLocaleDateString()}
                            </span>
                            {isLoadingDaily ? (
                                <div className="h-8 w-48 bg-slate-800 rounded animate-pulse"></div>
                            ) : (
                                <h2 className="text-2xl md:text-4xl font-bold text-white mt-2 leading-tight">{todaysUpload?.topic}</h2>
                            )}
                        </div>
                        <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 self-start">
                            <span className="text-[10px] md:text-xs font-bold text-slate-300">
                                {todaysUpload?.niche || 'Loading...'}
                            </span>
                        </div>
                    </div>

                    {isLoadingDaily ? (
                        <div className="space-y-3">
                            <div className="h-4 w-full bg-slate-800 rounded animate-pulse"></div>
                            <div className="h-4 w-5/6 bg-slate-800 rounded animate-pulse"></div>
                            <div className="h-4 w-4/6 bg-slate-800 rounded animate-pulse"></div>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm md:prose-base max-w-none">
                            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {todaysUpload?.content}
                            </div>
                            
                            <div className="mt-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-lg">
                                <div className="w-full md:w-auto">
                                    <span className="text-xs font-bold text-emerald-400 uppercase block mb-1">Go Deeper</span>
                                    {todaysUpload?.actionableResource?.startsWith('http') ? (
                                       <a 
                                         href={todaysUpload.actionableResource} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="text-sm text-emerald-300 hover:text-emerald-200 font-mono underline truncate block"
                                       >
                                          {todaysUpload.actionableResource} <span className="material-icons-round text-[10px]">open_in_new</span>
                                       </a>
                                    ) : (
                                       <p className="text-sm text-slate-300 font-mono">{todaysUpload?.actionableResource}</p>
                                    )}
                                </div>
                                <button 
                                    onClick={markDailyComplete}
                                    disabled={todaysUpload?.completed}
                                    className={`w-full md:w-auto justify-center px-6 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${todaysUpload?.completed ? 'bg-emerald-600/20 text-emerald-400 cursor-default' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}
                                >
                                    {todaysUpload?.completed ? (
                                        <>INSTALLED <span className="material-icons-round">check</span></>
                                    ) : (
                                        <>MARK LEARNED <span className="material-icons-round">download_done</span></>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* History */}
            <div className="pt-8 border-t border-slate-800">
                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-4">Knowledge Stack History</h3>
                <div className="grid gap-4">
                    {dailyUploads.slice(1).map(upload => (
                        <div key={upload.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-800 opacity-75 hover:opacity-100 transition-opacity">
                             <div className={`w-2 h-2 rounded-full hidden md:block ${upload.completed ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                             <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-1">
                                     <span className="text-xs text-emerald-400 font-mono">{upload.date}</span>
                                     <span className="text-xs text-slate-500">•</span>
                                     <span className="text-xs text-slate-400 uppercase">{upload.niche}</span>
                                 </div>
                                 <h4 className="font-bold text-slate-200">{upload.topic}</h4>
                             </div>
                        </div>
                    ))}
                    {dailyUploads.length <= 1 && (
                        <p className="text-slate-600 italic text-sm">No history yet. Keep showing up.</p>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'OPEN_BOX' && (
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
              {/* Input Area */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg flex-shrink-0">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1 relative">
                          <h3 className="text-emerald-400 font-bold text-sm mb-2 flex items-center gap-2">
                              <span className="material-icons-round">input</span> OPEN BOX OF THOUGHTS
                          </h3>
                          <textarea 
                              value={dumpInput}
                              onChange={e => setDumpInput(e.target.value)}
                              placeholder="Drop anything here: Links, Book Titles, Tools, Newsletters, or multiple items at once..."
                              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 resize-none focus:border-emerald-500 focus:outline-none h-24 text-base md:text-lg p-3"
                              onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleDumpSubmit(); } }}
                          />
                          <div className="absolute bottom-2 right-2">
                             <VoiceInputButton onTranscript={(text) => setDumpInput(prev => prev + ' ' + text)} size="sm" />
                          </div>
                      </div>
                      <button 
                          onClick={handleDumpSubmit}
                          disabled={!dumpInput.trim() || isProcessingDump}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white h-12 px-6 md:h-auto md:py-8 rounded-lg flex md:flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 flex-shrink-0 mt-2 md:mt-8"
                      >
                          {isProcessingDump ? (
                              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                              <>
                                <span className="material-icons-round">auto_awesome</span>
                                <span className="font-bold text-xs hidden md:block">SEGREGATE</span>
                              </>
                          )}
                      </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 font-mono border-t border-slate-800 pt-3">
                      <span className="text-slate-400">AI segregates & organizes automatically:</span>
                      <span className="bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded">Books/Read</span>
                      <span className="bg-red-900/20 text-red-400 px-2 py-0.5 rounded">Videos/Watch</span>
                      <span className="bg-orange-900/20 text-orange-400 px-2 py-0.5 rounded">Tools/Soft</span>
                      <span className="bg-yellow-900/20 text-yellow-400 px-2 py-0.5 rounded">Ideas/Concepts</span>
                  </div>
              </div>

              {/* Lists */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 px-1">
                  {(['READ', 'WATCH', 'TOOL', 'CONCEPT', 'OTHER'] as const).map(category => {
                      const items = brainItems.filter(i => i.category === category && i.status === 'NEW');
                      if (items.length === 0) return null;

                      return (
                          <div key={category} className="bg-slate-800/50 rounded-xl border border-slate-800 p-4 h-fit animate-slide-up">
                              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-700/50">
                                  <span className={`material-icons-round ${renderCategoryColor(category)}`}>{renderCategoryIcon(category)}</span>
                                  <h4 className={`font-bold text-xs md:text-sm uppercase tracking-wider ${renderCategoryColor(category)}`}>{category} LIST</h4>
                                  <span className="ml-auto text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">{items.length}</span>
                              </div>
                              
                              <div className="space-y-3">
                                  {items.map(item => (
                                      <div key={item.id} className="bg-slate-900 p-3 rounded border border-slate-700 hover:border-slate-500 transition-colors group relative">
                                          <div className="flex justify-between items-start gap-2">
                                              <a href={item.url || '#'} target="_blank" rel="noreferrer" className="font-bold text-slate-200 text-sm hover:text-emerald-400 line-clamp-2 break-words pr-6">
                                                  {item.title}
                                              </a>
                                              <button onClick={() => toggleItemStatus(item.id)} className="text-slate-600 hover:text-emerald-500 absolute top-3 right-3">
                                                  <span className="material-icons-round text-base">check_circle_outline</span>
                                              </button>
                                          </div>
                                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.summary}</p>
                                          {item.url && (
                                              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                                  <span className="material-icons-round text-[10px]">link</span>
                                                  <span className="truncate max-w-[200px] opacity-70 hover:opacity-100">{new URL(item.url).hostname}</span>
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      );
                  })}
                  {brainItems.filter(i => i.status === 'NEW').length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center text-slate-600 py-12 opacity-50">
                        <span className="material-icons-round text-5xl mb-2">all_inbox</span>
                        <p className="font-mono text-sm">The Open Box is empty.</p>
                        <p className="text-xs">Feed me links, ideas, or resources.</p>
                    </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default KnowledgeHub;
