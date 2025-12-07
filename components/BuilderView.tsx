
import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectNote } from '../types';
import { chatWithCofounder } from '../services/geminiService';
import VoiceInputButton from './VoiceInputButton';

interface BuilderViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

type NoteCategory = 'GENERAL' | 'IDEA' | 'PLAN' | 'RESEARCH' | 'LOG';
type ChatMode = 'CHAT' | 'PLAN' | 'RESEARCH';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const CATEGORIES: { id: NoteCategory; label: string; icon: string; color: string }[] = [
  { id: 'GENERAL', label: 'General', icon: 'notes', color: 'text-slate-400' },
  { id: 'IDEA', label: 'Ideas', icon: 'lightbulb', color: 'text-yellow-400' },
  { id: 'PLAN', label: 'Plans', icon: 'assignment', color: 'text-cyan-400' },
  { id: 'RESEARCH', label: 'Research', icon: 'science', color: 'text-purple-400' },
  { id: 'LOG', label: 'Build Logs', icon: 'history_edu', color: 'text-green-400' },
];

const MODES: { id: ChatMode; label: string; icon: string; desc: string }[] = [
  { id: 'CHAT', label: 'Chat', icon: 'chat_bubble', desc: 'Brainstorm & Discuss' },
  { id: 'PLAN', label: 'Plan', icon: 'schema', desc: 'Execution Roadmap' },
  { id: 'RESEARCH', label: 'Research', icon: 'travel_explore', desc: 'Deep Dive & Feasibility' },
];

const BuilderView: React.FC<BuilderViewProps> = ({ projects, setProjects }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Project Detail State
  const [newNote, setNewNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory>('GENERAL');
  const [filterCategory, setFilterCategory] = useState<NoteCategory | 'ALL'>('ALL');

  // AI Cofounder State
  const [chatMode, setChatMode] = useState<ChatMode>('CHAT');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simplified Wizard State
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectIdea, setNewProjectIdea] = useState('');

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset chat when project changes
  useEffect(() => {
    if (selectedProject) {
      setMessages([{
        id: 'init',
        role: 'model',
        text: `I'm ready. I've analyzed "${selectedProject.title}". I'm in ${chatMode} mode. What's on your mind?`,
        timestamp: new Date()
      }]);
    }
  }, [selectedProject]);

  const createProject = () => {
    setIsCreating(true);
  };

  const handleCreateSubmit = () => {
    if (!newProjectIdea.trim()) return;

    const newProject: Project = {
      id: Date.now().toString(),
      title: newProjectIdea.split(' ').slice(0, 5).join(' ') + '...',
      description: newProjectIdea,
      status: 'IN_PROGRESS',
      notes: []
    };

    setProjects(prev => [...prev, newProject]);
    setSelectedProject(newProject);
    setIsCreating(false);
    setNewProjectIdea('');
  };

  const updateProjectStatus = (status: Project['status']) => {
    if (!selectedProject) return;
    const updated = { ...selectedProject, status };
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updated : p));
    setSelectedProject(updated);
  };

  const updateProjectDescription = (desc: string) => {
    if (!selectedProject) return;
    const updated = { ...selectedProject, description: desc };
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updated : p));
    setSelectedProject(updated);
  };

  const addNote = (content: string = newNote, category: NoteCategory = selectedCategory) => {
    if (!selectedProject || !content) return;
    const note: ProjectNote = {
      id: Date.now().toString(),
      content: content,
      category: category,
      createdAt: new Date().toLocaleString()
    };

    const updatedProject = { ...selectedProject, notes: [note, ...selectedProject.notes] }; // Newest first
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
    setNewNote('');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedProject) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    // Format history for Gemini
    const history = messages.filter(m => m.id !== 'init').map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await chatWithCofounder(
      chatInput,
      history,
      selectedProject.description,
      chatMode
    );

    const botMsg: ChatMessage = {
      id: Date.now().toString() + '_bot',
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsChatting(false);
  };

  const saveToNotes = (text: string) => {
    let category: NoteCategory = 'GENERAL';
    if (chatMode === 'PLAN') category = 'PLAN';
    if (chatMode === 'RESEARCH') category = 'RESEARCH';
    if (chatMode === 'CHAT') category = 'IDEA';

    addNote(text, category);
  };

  // --- RENDER WIZARD MODAL ---
  if (isCreating) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="max-w-2xl w-full bg-slate-900 border border-orange-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-yellow-500"></div>
          <button onClick={() => setIsCreating(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <span className="material-icons-round">close</span>
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-orange-400 font-mono mb-2">Build Something New</h2>
            <p className="text-slate-400">Tell me what you want to build. I'll help you figure out the rest.</p>
          </div>

          <div className="space-y-6 animate-slide-up">
            <div className="relative">
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none resize-none h-40 text-lg leading-relaxed"
                placeholder="e.g. I want to build a drone that follows me while I ski..."
                value={newProjectIdea}
                onChange={e => setNewProjectIdea(e.target.value)}
                autoFocus
              />
              <div className="absolute bottom-4 right-4">
                <VoiceInputButton onTranscript={(text) => setNewProjectIdea(prev => prev + ' ' + text)} size="sm" />
              </div>
            </div>
            <button
              onClick={handleCreateSubmit}
              disabled={!newProjectIdea}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:opacity-50 text-white rounded-lg font-bold transition-all transform hover:scale-[1.02] shadow-lg shadow-orange-900/20 flex justify-center items-center gap-3"
            >
              <span className="material-icons-round">engineering</span>
              START BUILDING
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER PROJECT DETAIL ---
  if (selectedProject) {
    const filteredNotes = filterCategory === 'ALL'
      ? selectedProject.notes
      : selectedProject.notes.filter(n => (n.category || 'GENERAL') === filterCategory);

    return (
      <div className="h-full flex flex-col animate-fade-in bg-slate-950">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
              <span className="material-icons-round">arrow_back</span>
            </button>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold font-mono text-orange-400">{selectedProject.title}</h2>
              <input
                className="bg-transparent text-slate-400 text-sm w-full focus:text-slate-200 focus:outline-none"
                value={selectedProject.description}
                onChange={(e) => updateProjectDescription(e.target.value)}
                placeholder="Add a project description..."
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['IDEA', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'] as const).map(s => (
              <button
                key={s}
                onClick={() => updateProjectStatus(s)}
                className={`text-xs px-2 py-1 rounded border font-mono transition-all whitespace-nowrap ${selectedProject.status === s ? 'bg-orange-600 border-orange-500 text-white' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 flex-1 overflow-hidden">
          {/* Main Workspace (Notes) */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden order-2 xl:order-1">

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-shrink-0">
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filterCategory === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                All Notes
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${filterCategory === cat.id ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  <span className={`material-icons-round text-sm hidden md:block ${cat.color}`}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Add Entry Box */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg flex flex-col gap-3 flex-shrink-0">
              <div className="flex gap-2 mb-1 items-center overflow-x-auto">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    title={cat.label}
                    className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center transition-all border ${selectedCategory === cat.id ? `bg-slate-800 border-${cat.color.split('-')[1]}-500 text-white` : 'border-transparent text-slate-500 hover:bg-slate-800'}`}
                  >
                    <span className={`material-icons-round text-sm ${selectedCategory === cat.id ? cat.color : ''}`}>{cat.icon}</span>
                  </button>
                ))}
                <span className="text-xs text-slate-500 self-center ml-2 font-mono uppercase tracking-wider hidden md:inline">
                  New {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </span>
              </div>
              <div className="relative">
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="w-full bg-transparent text-slate-200 placeholder-slate-600 resize-none focus:outline-none h-20 md:h-24 text-sm md:text-base p-1"
                  placeholder={`Log a new ${CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase().slice(0, -1)}...`}
                />
                <div className="absolute bottom-2 right-2">
                  <VoiceInputButton onTranscript={(text) => setNewNote(prev => prev + ' ' + text)} size="sm" />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => addNote()}
                  disabled={!newNote.trim()}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1 rounded text-sm font-bold border border-slate-700 transition-colors"
                >
                  ADD ENTRY
                </button>
              </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 md:pr-2 pb-4">
              {filteredNotes.length === 0 && (
                <div className="text-center py-10 text-slate-600">
                  <span className="material-icons-round text-4xl mb-2">dashboard_customize</span>
                  <p>No entries found. Start building your project knowledge base.</p>
                </div>
              )}
              {filteredNotes.map(note => {
                const catInfo = CATEGORIES.find(c => c.id === (note.category || 'GENERAL')) || CATEGORIES[0];
                return (
                  <div key={note.id} className="bg-slate-900 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors group relative">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`material-icons-round text-sm ${catInfo.color}`}>{catInfo.icon}</span>
                      <span className={`text-xs font-bold uppercase tracking-wide ${catInfo.color}`}>{catInfo.label}</span>
                      <span className="text-xs text-slate-600 ml-auto">{note.createdAt}</span>
                    </div>
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
                      {note.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Co-Founder Panel */}
          <div className="w-full xl:w-[450px] flex flex-col gap-4 flex-shrink-0 order-1 xl:order-2 h-[500px] xl:h-auto">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-full shadow-2xl">
              {/* Mode Tabs */}
              <div className="flex border-b border-slate-700 bg-slate-800/80 backdrop-blur">
                {MODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setChatMode(mode.id)}
                    className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-all border-b-2 ${chatMode === mode.id ? 'border-orange-500 text-orange-400 bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'}`}
                  >
                    <span className="material-icons-round text-lg">{mode.icon}</span>
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm whitespace-pre-wrap shadow-sm ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-br-none'
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                      }`}>
                      {msg.text}
                      {msg.role === 'model' && (
                        <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-end">
                          <button
                            onClick={() => saveToNotes(msg.text)}
                            className="text-xs text-slate-500 hover:text-orange-400 flex items-center gap-1 transition-colors"
                            title="Save to Notes"
                          >
                            <span className="material-icons-round text-[10px]">save_alt</span>
                            SAVE
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none p-4 flex gap-1 items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-slate-800 border-t border-slate-700">
                <div className="relative">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Ask your co-founder (${MODES.find(m => m.id === chatMode)?.desc})...`}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-orange-500 focus:outline-none resize-none h-14 max-h-32 shadow-inner"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <VoiceInputButton onTranscript={(text) => setChatInput(prev => prev + ' ' + text)} size="sm" />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || isChatting}
                      className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-900/20"
                    >
                      <span className="material-icons-round text-sm">send</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER DASHBOARD ---
  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <header className="border-b border-slate-700 pb-4 flex-shrink-0">
        <h2 className="text-2xl md:text-3xl font-bold text-orange-400 font-mono">BUILDER_HUB</h2>
        <p className="text-slate-400 text-xs md:text-sm">Engineering Projects, Research & Innovation Center</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-10 pr-1">
        {/* NEW BUTTON - triggers wizard */}
        <button className="h-48 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center hover:border-orange-500 hover:bg-slate-800 transition-all group"
          onClick={createProject}
        >
          <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-orange-900/30 flex items-center justify-center mb-3 transition-colors">
            <span className="material-icons-round text-2xl text-slate-500 group-hover:text-orange-500">rocket_launch</span>
          </div>
          <span className="text-slate-500 group-hover:text-slate-300 font-bold text-sm">Launch New Project</span>
        </button>

        {projects.map(project => (
          <div
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className="h-48 bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-orange-500/50 cursor-pointer hover:-translate-y-1 transition-all relative overflow-hidden group flex flex-col shadow-lg hover:shadow-orange-900/20"
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${project.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400 border-green-800' :
                  project.status === 'IN_PROGRESS' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                    'bg-slate-700 text-slate-400 border-slate-600'
                }`}>
                {project.status}
              </span>
              <span className="material-icons-round text-slate-600 group-hover:text-orange-500 transition-colors">arrow_forward</span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 mb-1 line-clamp-1">{project.title}</h3>
            <p className="text-xs text-slate-500 mb-4 line-clamp-2 h-8">{project.description}</p>

            <div className="mt-auto flex items-center gap-3 text-slate-400 text-xs border-t border-slate-700 pt-3">
              <div className="flex items-center gap-1" title="Notes">
                <span className="material-icons-round text-sm">notes</span>
                {project.notes.length}
              </div>
              <div className="flex items-center gap-1" title="Last Updated">
                <span className="material-icons-round text-sm">schedule</span>
                {project.notes.length > 0 ? project.notes[0].createdAt.split(',')[0] : 'New'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuilderView;
