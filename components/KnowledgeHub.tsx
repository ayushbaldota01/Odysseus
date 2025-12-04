
import React, { useState, useEffect, useCallback } from 'react';
import { BrainItem, DailyUpload, Book, BrainCategory, BookStatus } from '../types';
import { processBrainDump, generateDailyProtocol, generateBookSummary, generateContentDeepDive } from '../services/geminiService';
import VoiceInputButton from './VoiceInputButton';

interface KnowledgeHubProps {
  brainItems: BrainItem[];
  setBrainItems: React.Dispatch<React.SetStateAction<BrainItem[]>>;
  dailyUploads: DailyUpload[];
  setDailyUploads: React.Dispatch<React.SetStateAction<DailyUpload[]>>;
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}

const CATEGORIES: { id: BrainCategory; label: string; icon: string; color: string; bgColor: string }[] = [
  { id: 'BOOK', label: 'Books', icon: 'menu_book', color: 'text-indigo-400', bgColor: 'bg-indigo-900/20' },
  { id: 'PODCAST', label: 'Podcasts', icon: 'podcasts', color: 'text-purple-400', bgColor: 'bg-purple-900/20' },
  { id: 'VIDEO', label: 'Videos', icon: 'play_circle', color: 'text-red-400', bgColor: 'bg-red-900/20' },
  { id: 'ARTICLE', label: 'Articles', icon: 'article', color: 'text-blue-400', bgColor: 'bg-blue-900/20' },
  { id: 'THREAD', label: 'Threads', icon: 'forum', color: 'text-cyan-400', bgColor: 'bg-cyan-900/20' },
  { id: 'TOOL', label: 'Tools', icon: 'build', color: 'text-orange-400', bgColor: 'bg-orange-900/20' },
  { id: 'CONCEPT', label: 'Concepts', icon: 'lightbulb', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' },
  { id: 'OTHER', label: 'Other', icon: 'category', color: 'text-slate-400', bgColor: 'bg-slate-800' },
];

const KnowledgeHub: React.FC<KnowledgeHubProps> = ({ brainItems, setBrainItems, dailyUploads, setDailyUploads, books, setBooks }) => {
  const [activeTab, setActiveTab] = useState<'PROTOCOL' | 'OPEN_BOX' | 'BOOKSHELF'>('PROTOCOL');
  
  // Open Box State
  const [dumpInput, setDumpInput] = useState('');
  const [isProcessingDump, setIsProcessingDump] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [filterCategory, setFilterCategory] = useState<BrainCategory | 'ALL'>('ALL');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Daily State
  const [todaysUpload, setTodaysUpload] = useState<DailyUpload | null>(null);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);

  // Bookshelf State
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [bookFilter, setBookFilter] = useState<BookStatus | 'ALL'>('ALL');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Deep Dive State (for podcasts, videos, etc.)
  const [deepDiveItem, setDeepDiveItem] = useState<BrainItem | null>(null);
  const [deepDiveContent, setDeepDiveContent] = useState<string>('');
  const [isGeneratingDeepDive, setIsGeneratingDeepDive] = useState(false);

  useEffect(() => {
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

  // --- Open Box Handlers ---
  const handleDumpSubmit = async (text: string = dumpInput) => {
    if (!text.trim()) return;
    setIsProcessingDump(true);
    
    const processedItems = await processBrainDump(text);
    
    const newItems: BrainItem[] = processedItems.map((item, index) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + index,
      addedAt: new Date().toLocaleDateString(),
      status: 'NEW',
      originalText: text,
      sourceType: 'TEXT',
      ...item
    }));

    setBrainItems(prev => [...newItems, ...prev]);
    setDumpInput('');
    setIsProcessingDump(false);
  };

  // Drag and Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const text = e.dataTransfer.getData('text/plain');
    const url = e.dataTransfer.getData('text/uri-list');
    
    const content = url || text;
    if (content) {
      setDumpInput(content);
      await handleDumpSubmit(content);
    }
  }, []);

  const toggleItemStatus = (id: string) => {
    setBrainItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: item.status === 'NEW' ? 'CONSUMED' : 'NEW' } : item
    ));
  };

  const deleteItem = (id: string) => {
    setBrainItems(prev => prev.filter(item => item.id !== id));
  };

  // Deep Dive handler for podcasts, videos, articles
  const handleDeepDive = async (item: BrainItem) => {
    setDeepDiveItem(item);
    setDeepDiveContent('');
    setIsGeneratingDeepDive(true);
    
    const content = await generateContentDeepDive(item.title, item.category, item.url);
    setDeepDiveContent(content);
    setIsGeneratingDeepDive(false);
  };

  const markDailyComplete = () => {
    if (!todaysUpload) return;
    const updated = { ...todaysUpload, completed: true };
    setDailyUploads(prev => prev.map(u => u.id === todaysUpload.id ? updated : u));
    setTodaysUpload(updated);
  };

  // --- Bookshelf Handlers ---
  const addBook = async () => {
    if (!newBookTitle.trim() || !newBookAuthor.trim()) return;
    
    const newBook: Book = {
      id: Date.now().toString(),
      title: newBookTitle.trim(),
      author: newBookAuthor.trim(),
      addedAt: new Date().toLocaleDateString(),
      status: 'WANT_TO_READ',
      isAnalyzing: true
    };
    
    setBooks(prev => [newBook, ...prev]);
    setNewBookTitle('');
    setNewBookAuthor('');
    
    // Generate AI summary
    const summary = await generateBookSummary(newBook.title, newBook.author);
    setBooks(prev => prev.map(b => 
      b.id === newBook.id ? { ...b, aiSummary: summary, isAnalyzing: false } : b
    ));
  };

  const updateBookStatus = (id: string, status: BookStatus) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (selectedBook?.id === id) {
      setSelectedBook(prev => prev ? { ...prev, status } : null);
    }
  };

  const deleteBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    if (selectedBook?.id === id) setSelectedBook(null);
  };

  const regenerateBookSummary = async (book: Book) => {
    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, isAnalyzing: true } : b));
    const summary = await generateBookSummary(book.title, book.author);
    setBooks(prev => prev.map(b => 
      b.id === book.id ? { ...b, aiSummary: summary, isAnalyzing: false } : b
    ));
    if (selectedBook?.id === book.id) {
      setSelectedBook(prev => prev ? { ...prev, aiSummary: summary, isAnalyzing: false } : null);
    }
  };

  // --- Download Handler ---
  const downloadSummary = (title: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_Summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCategoryInfo = (cat: BrainCategory) => CATEGORIES.find(c => c.id === cat) || CATEGORIES[7];

  const filteredItems = filterCategory === 'ALL' 
    ? brainItems.filter(i => i.status === 'NEW')
    : brainItems.filter(i => i.category === filterCategory && i.status === 'NEW');

  const filteredBooks = bookFilter === 'ALL'
    ? books
    : books.filter(b => b.status === bookFilter);

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-700 pb-4 flex-shrink-0 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-400 font-mono">SECOND_BRAIN</h2>
          <p className="text-slate-400 text-xs md:text-sm">Knowledge Hub • Bookshelf • Daily Upgrades</p>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <button 
                onClick={() => setActiveTab('PROTOCOL')}
                className={`px-3 md:px-4 py-1.5 rounded text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'PROTOCOL' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <span className="material-icons-round text-sm hidden md:block">update</span>
                PROTOCOL
            </button>
            <button 
                onClick={() => setActiveTab('OPEN_BOX')}
                className={`px-3 md:px-4 py-1.5 rounded text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'OPEN_BOX' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <span className="material-icons-round text-sm hidden md:block">all_inbox</span>
                OPEN_BOX
            </button>
            <button 
                onClick={() => setActiveTab('BOOKSHELF')}
                className={`px-3 md:px-4 py-1.5 rounded text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'BOOKSHELF' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <span className="material-icons-round text-sm hidden md:block">menu_book</span>
                BOOKSHELF
            </button>
        </div>
      </header>

      {/* PROTOCOL TAB */}
      {activeTab === 'PROTOCOL' && (
        <div className="flex-1 overflow-y-auto px-1">
          <div className="max-w-4xl mx-auto space-y-8 pb-6">
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
                            <span className="text-[10px] md:text-xs font-bold text-slate-300">{todaysUpload?.niche || 'Loading...'}</span>
                        </div>
                    </div>

                    {isLoadingDaily ? (
                        <div className="space-y-3">
                            <div className="h-4 w-full bg-slate-800 rounded animate-pulse"></div>
                            <div className="h-4 w-5/6 bg-slate-800 rounded animate-pulse"></div>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm md:prose-base max-w-none">
                            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{todaysUpload?.content}</div>
                            
                            <div className="mt-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-lg">
                                <div className="w-full md:w-auto">
                                    <span className="text-xs font-bold text-emerald-400 uppercase block mb-1">Go Deeper</span>
                                    {todaysUpload?.actionableResource?.startsWith('http') ? (
                                       <a href={todaysUpload.actionableResource} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-300 hover:text-emerald-200 font-mono underline truncate block">
                                          {todaysUpload.actionableResource}
                                       </a>
                                    ) : (
                                       <p className="text-sm text-slate-300 font-mono">{todaysUpload?.actionableResource}</p>
                                    )}
                                </div>
                                <button 
                                    onClick={markDailyComplete}
                                    disabled={todaysUpload?.completed}
                                    className={`w-full md:w-auto justify-center px-6 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${todaysUpload?.completed ? 'bg-emerald-600/20 text-emerald-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                                >
                                    {todaysUpload?.completed ? (<>INSTALLED <span className="material-icons-round">check</span></>) : (<>MARK LEARNED <span className="material-icons-round">download_done</span></>)}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-8 border-t border-slate-800">
                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-4">Knowledge Stack History</h3>
                <div className="grid gap-4">
                    {dailyUploads.slice(1).map(upload => (
                        <div key={upload.id} className="flex md:items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-800 opacity-75 hover:opacity-100 transition-opacity">
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
                    {dailyUploads.length <= 1 && <p className="text-slate-600 italic text-sm">No history yet.</p>}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* OPEN BOX TAB */}
      {activeTab === 'OPEN_BOX' && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Drag & Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ${isDragOver ? 'border-emerald-400 bg-emerald-900/20 scale-[1.02]' : 'border-slate-700 bg-slate-900/50'}`}
              >
                  <div className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                  <span className={`material-icons-round ${isDragOver ? 'text-emerald-400 animate-bounce' : 'text-emerald-500'}`}>
                                      {isDragOver ? 'file_download' : 'input'}
                                  </span>
                                  <h3 className="text-emerald-400 font-bold text-sm">
                                      {isDragOver ? 'DROP IT HERE!' : 'OPEN BOX - Drag & Drop or Paste'}
                                  </h3>
                              </div>
                              <div className="relative">
                                  <textarea 
                                      value={dumpInput}
                                      onChange={e => setDumpInput(e.target.value)}
                                      placeholder="Drop links, paste URLs, podcasts, reels, articles, or any content here..."
                                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 resize-none focus:border-emerald-500 focus:outline-none h-20 text-sm p-3"
                                      onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleDumpSubmit(); } }}
                                  />
                                  <div className="absolute bottom-2 right-2">
                                     <VoiceInputButton onTranscript={(text) => setDumpInput(prev => prev + ' ' + text)} size="sm" />
                                  </div>
                              </div>
                          </div>
                          <button 
                              onClick={() => handleDumpSubmit()}
                              disabled={!dumpInput.trim() || isProcessingDump}
                              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-bold text-sm"
                          >
                              {isProcessingDump ? (
                                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              ) : (
                                  <>
                                    <span className="material-icons-round">auto_awesome</span>
                                    ANALYZE
                                  </>
                              )}
                          </button>
                      </div>
                      
                      {/* Category Tags */}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {CATEGORIES.slice(0, 7).map(cat => (
                              <span key={cat.id} className={`${cat.bgColor} ${cat.color} px-2 py-0.5 rounded flex items-center gap-1`}>
                                  <span className="material-icons-round text-[10px]">{cat.icon}</span>
                                  {cat.label}
                              </span>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Filter Bar */}
              <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0">
                  <button 
                      onClick={() => setFilterCategory('ALL')}
                      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterCategory === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  >
                      All ({brainItems.filter(i => i.status === 'NEW').length})
                  </button>
                  {CATEGORIES.map(cat => {
                      const count = brainItems.filter(i => i.category === cat.id && i.status === 'NEW').length;
                      if (count === 0) return null;
                      return (
                          <button
                              key={cat.id}
                              onClick={() => setFilterCategory(cat.id)}
                              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${filterCategory === cat.id ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                          >
                              <span className={`material-icons-round text-sm ${cat.color}`}>{cat.icon}</span>
                              {cat.label} ({count})
                          </button>
                      );
                  })}
              </div>

              {/* Items Grid */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                  {filteredItems.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center text-slate-600 py-12">
                        <span className="material-icons-round text-5xl mb-2">all_inbox</span>
                        <p className="font-mono text-sm">The Open Box is empty.</p>
                        <p className="text-xs">Drop links, podcasts, or ideas above.</p>
                    </div>
                  )}
                  {filteredItems.map(item => {
                      const catInfo = getCategoryInfo(item.category);
                      const isExpanded = expandedItem === item.id;
                      return (
                          <div 
                              key={item.id} 
                              className={`${catInfo.bgColor} border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all cursor-pointer ${isExpanded ? 'col-span-full' : ''}`}
                              onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                          >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                      <span className={`material-icons-round ${catInfo.color}`}>{catInfo.icon}</span>
                                      <span className={`text-[10px] font-bold uppercase ${catInfo.color}`}>{item.category}</span>
                                  </div>
                                  <div className="flex gap-1">
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); toggleItemStatus(item.id); }}
                                          className="text-slate-500 hover:text-emerald-400 p-1"
                                          title="Mark as consumed"
                                      >
                                          <span className="material-icons-round text-sm">check_circle_outline</span>
                                      </button>
                                      <button 
                                          onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                                          className="text-slate-500 hover:text-red-400 p-1"
                                          title="Delete"
                                      >
                                          <span className="material-icons-round text-sm">delete_outline</span>
                                      </button>
                                  </div>
                              </div>
                              
                              <h4 className="font-bold text-slate-200 text-sm mb-2 line-clamp-2">{item.title}</h4>
                              <p className={`text-slate-400 text-xs ${isExpanded ? '' : 'line-clamp-2'}`}>{item.summary}</p>
                              
                              {isExpanded && (
                                  <div className="mt-4 pt-4 border-t border-slate-700">
                                      {item.keyInsights && item.keyInsights.length > 0 && (
                                          <>
                                              <h5 className="text-xs font-bold text-emerald-400 mb-2">KEY INSIGHTS</h5>
                                              <ul className="space-y-1 mb-4">
                                                  {item.keyInsights.map((insight, i) => (
                                                      <li key={i} className="text-xs text-slate-300 flex gap-2">
                                                          <span className="text-emerald-500">•</span>
                                                          {insight}
                                                      </li>
                                                  ))}
                                              </ul>
                                          </>
                                      )}
                                      
                                      <div className="flex flex-wrap gap-2">
                                          {/* Deep Dive button for podcasts, videos, articles */}
                                          {['PODCAST', 'VIDEO', 'ARTICLE', 'THREAD'].includes(item.category) && (
                                              <button 
                                                  onClick={(e) => { e.stopPropagation(); handleDeepDive(item); }}
                                                  className={`text-xs ${catInfo.color} hover:opacity-80 flex items-center gap-1 ${catInfo.bgColor} px-3 py-1.5 rounded-lg border border-slate-600`}
                                              >
                                                  <span className="material-icons-round text-sm">auto_awesome</span>
                                                  Deep Dive Summary
                                              </button>
                                          )}
                                          
                                          {item.summary && (
                                              <button 
                                                  onClick={(e) => { e.stopPropagation(); downloadSummary(item.title, `${item.title}\n\n${item.summary}\n\nKey Insights:\n${item.keyInsights?.join('\n')}`); }}
                                                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-slate-600"
                                              >
                                                  <span className="material-icons-round text-sm">download</span>
                                                  Download
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              )}
                              
                              {item.url && (
                                  <a 
                                      href={item.url} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-400 font-mono"
                                  >
                                      <span className="material-icons-round text-[10px]">link</span>
                                      <span className="truncate">{item.url.length > 40 ? item.url.substring(0, 40) + '...' : item.url}</span>
                                  </a>
                              )}
                              
                              <div className="mt-2 text-[10px] text-slate-600">{item.addedAt}</div>
                          </div>
                      );
                  })}
              </div>

              {/* Deep Dive Modal */}
              {deepDiveItem && (
                  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setDeepDiveItem(null)}>
                      <div 
                          className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                          onClick={e => e.stopPropagation()}
                      >
                          <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                  <span className={`material-icons-round text-2xl ${getCategoryInfo(deepDiveItem.category).color}`}>
                                      {getCategoryInfo(deepDiveItem.category).icon}
                                  </span>
                                  <div>
                                      <h2 className="text-xl font-bold text-white">{deepDiveItem.title}</h2>
                                      <p className="text-slate-400 text-sm">{deepDiveItem.category} • Deep Dive Summary</p>
                                  </div>
                              </div>
                              <button onClick={() => setDeepDiveItem(null)} className="text-slate-500 hover:text-white p-1">
                                  <span className="material-icons-round">close</span>
                              </button>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-6">
                              {isGeneratingDeepDive ? (
                                  <div className="flex flex-col items-center justify-center py-16">
                                      <span className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></span>
                                      <p className="text-emerald-400 font-mono text-sm mb-2">Generating Deep Dive...</p>
                                      <p className="text-slate-500 text-xs">Creating an immersive summary experience</p>
                                  </div>
                              ) : deepDiveContent ? (
                                  <div className="prose prose-invert prose-sm max-w-none">
                                      <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">{deepDiveContent}</div>
                                  </div>
                              ) : (
                                  <p className="text-slate-500 text-center py-12">No content available.</p>
                              )}
                          </div>
                          
                          <div className="p-4 border-t border-slate-800 flex gap-3">
                              <button 
                                  onClick={() => handleDeepDive(deepDiveItem)}
                                  disabled={isGeneratingDeepDive}
                                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                  <span className="material-icons-round text-sm">refresh</span>
                                  Regenerate
                              </button>
                              <button 
                                  onClick={() => deepDiveContent && downloadSummary(deepDiveItem.title + '_DeepDive', deepDiveContent)}
                                  disabled={!deepDiveContent || isGeneratingDeepDive}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                  <span className="material-icons-round text-sm">download</span>
                                  Download
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* BOOKSHELF TAB */}
      {activeTab === 'BOOKSHELF' && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Add Book Form */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                  <h3 className="text-indigo-400 font-bold text-sm mb-3 flex items-center gap-2">
                      <span className="material-icons-round">library_add</span>
                      Add to Bookshelf
                  </h3>
                  <div className="flex flex-col md:flex-row gap-3">
                      <input 
                          type="text"
                          value={newBookTitle}
                          onChange={e => setNewBookTitle(e.target.value)}
                          placeholder="Book Title"
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      />
                      <input 
                          type="text"
                          value={newBookAuthor}
                          onChange={e => setNewBookAuthor(e.target.value)}
                          placeholder="Author"
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      />
                      <button 
                          onClick={addBook}
                          disabled={!newBookTitle.trim() || !newBookAuthor.trim()}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
                      >
                          <span className="material-icons-round">add</span>
                          ADD BOOK
                      </button>
                  </div>
              </div>

              {/* Filter Bar */}
              <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0">
                  {(['ALL', 'WANT_TO_READ', 'READING', 'COMPLETED'] as const).map(status => (
                      <button
                          key={status}
                          onClick={() => setBookFilter(status)}
                          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${bookFilter === status ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                          {status === 'ALL' ? 'All' : status === 'WANT_TO_READ' ? 'Want to Read' : status === 'READING' ? 'Reading' : 'Completed'}
                          {' '}({status === 'ALL' ? books.length : books.filter(b => b.status === status).length})
                      </button>
                  ))}
              </div>

              {/* Book Modal */}
              {selectedBook && (
                  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBook(null)}>
                      <div 
                          className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                          onClick={e => e.stopPropagation()}
                      >
                          <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                              <div>
                                  <h2 className="text-2xl font-bold text-white">{selectedBook.title}</h2>
                                  <p className="text-slate-400">by {selectedBook.author}</p>
                              </div>
                              <button onClick={() => setSelectedBook(null)} className="text-slate-500 hover:text-white p-1">
                                  <span className="material-icons-round">close</span>
                              </button>
                          </div>
                          
                          <div className="flex gap-2 px-6 pt-4">
                              {(['WANT_TO_READ', 'READING', 'COMPLETED'] as const).map(status => (
                                  <button
                                      key={status}
                                      onClick={() => updateBookStatus(selectedBook.id, status)}
                                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${selectedBook.status === status ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                  >
                                      {status === 'WANT_TO_READ' ? 'Want to Read' : status === 'READING' ? 'Reading' : 'Completed'}
                                  </button>
                              ))}
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-6">
                              {selectedBook.isAnalyzing ? (
                                  <div className="flex flex-col items-center justify-center py-12">
                                      <span className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></span>
                                      <p className="text-indigo-400 font-mono text-sm">Generating AI Summary...</p>
                                  </div>
                              ) : selectedBook.aiSummary ? (
                                  <div className="prose prose-invert prose-sm max-w-none">
                                      <div className="whitespace-pre-wrap text-slate-300">{selectedBook.aiSummary}</div>
                                  </div>
                              ) : (
                                  <p className="text-slate-500 text-center py-12">No summary available.</p>
                              )}
                          </div>
                          
                          <div className="p-4 border-t border-slate-800 flex gap-3">
                              <button 
                                  onClick={() => regenerateBookSummary(selectedBook)}
                                  disabled={selectedBook.isAnalyzing}
                                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                  <span className="material-icons-round text-sm">refresh</span>
                                  Regenerate
                              </button>
                              <button 
                                  onClick={() => selectedBook.aiSummary && downloadSummary(selectedBook.title, `${selectedBook.title} by ${selectedBook.author}\n\n${selectedBook.aiSummary}`)}
                                  disabled={!selectedBook.aiSummary}
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                  <span className="material-icons-round text-sm">download</span>
                                  Download
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Books Grid */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                  {filteredBooks.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center text-slate-600 py-12">
                          <span className="material-icons-round text-5xl mb-2">menu_book</span>
                          <p className="font-mono text-sm">Your bookshelf is empty.</p>
                          <p className="text-xs">Add a book above to get started.</p>
                      </div>
                  )}
                  {filteredBooks.map(book => (
                      <div 
                          key={book.id} 
                          onClick={() => setSelectedBook(book)}
                          className="bg-gradient-to-br from-indigo-900/30 to-slate-900 border border-slate-700 rounded-xl p-4 hover:border-indigo-500/50 transition-all cursor-pointer group"
                      >
                          <div className="flex items-start justify-between mb-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  book.status === 'COMPLETED' ? 'bg-emerald-900/50 text-emerald-400' :
                                  book.status === 'READING' ? 'bg-blue-900/50 text-blue-400' :
                                  'bg-slate-800 text-slate-400'
                              }`}>
                                  {book.status === 'WANT_TO_READ' ? 'WANT TO READ' : book.status}
                              </span>
                              <button 
                                  onClick={(e) => { e.stopPropagation(); deleteBook(book.id); }}
                                  className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                  <span className="material-icons-round text-sm">delete_outline</span>
                              </button>
                          </div>
                          
                          <div className="flex items-start gap-3">
                              <div className="w-12 h-16 bg-indigo-900/50 rounded flex items-center justify-center flex-shrink-0">
                                  <span className="material-icons-round text-indigo-400">menu_book</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-white text-sm line-clamp-2">{book.title}</h4>
                                  <p className="text-slate-400 text-xs mt-1">{book.author}</p>
                              </div>
                          </div>
                          
                          {book.isAnalyzing && (
                              <div className="mt-3 flex items-center gap-2 text-indigo-400">
                                  <span className="w-3 h-3 border border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></span>
                                  <span className="text-[10px] font-mono">Analyzing...</span>
                              </div>
                          )}
                          
                          {book.aiSummary && !book.isAnalyzing && (
                              <div className="mt-3 text-[10px] text-emerald-400 flex items-center gap-1">
                                  <span className="material-icons-round text-xs">check_circle</span>
                                  AI Summary Ready
                              </div>
                          )}
                          
                          <div className="mt-3 text-[10px] text-slate-600">Added {book.addedAt}</div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default KnowledgeHub;
