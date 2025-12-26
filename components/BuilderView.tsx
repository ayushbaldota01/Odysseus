
import React, { useState } from 'react';
import { Project, ProjectNote } from '../types';
import { generateProjectIdeas, generateProjectPlan, critiqueProjectFeasibility, generateScopingQuestions, generateInitialWhiteboard, generateProactiveQuestion, updateWhiteboardWithAnswer, callAgent } from '../services/geminiService';
import VoiceInputButton from './VoiceInputButton';

interface BuilderViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

type NoteCategory = 'GENERAL' | 'IDEA' | 'PLAN' | 'RESEARCH' | 'LOG';
type WizardState = 'IDLE' | 'INPUT_IDEA' | 'AI_QUESTIONING' | 'USER_ANSWERING' | 'GENERATING_PLAN';
type ProjectTab = 'WORKBENCH' | 'WHITEBOARD' | 'AI_COACH';

const CATEGORIES: { id: NoteCategory; label: string; icon: string; color: string }[] = [
  { id: 'GENERAL', label: 'General', icon: 'notes', color: 'text-slate-400' },
  { id: 'IDEA', label: 'Ideas', icon: 'lightbulb', color: 'text-yellow-400' },
  { id: 'PLAN', label: 'Plans', icon: 'assignment', color: 'text-cyan-400' },
  { id: 'RESEARCH', label: 'Research', icon: 'science', color: 'text-purple-400' },
  { id: 'LOG', label: 'Logs', icon: 'history_edu', color: 'text-green-400' },
];

const BuilderView: React.FC<BuilderViewProps> = ({ projects, setProjects }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectTab>('WORKBENCH');
  
  // Project Detail State
  const [newNote, setNewNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory>('GENERAL');
  const [filterCategory, setFilterCategory] = useState<NoteCategory | 'ALL'>('ALL');
  
  // AI Coach States
  const [aiOutput, setAiOutput] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);
  const [whiteboardQuestion, setWhiteboardQuestion] = useState<string | null>(null);
  const [whiteboardAnswer, setWhiteboardAnswer] = useState('');

  // Agent States
  const [engineerInput, setEngineerInput] = useState('');
  const [researchInput, setResearchInput] = useState('');
  const [activeAgent, setActiveAgent] = useState<'ENGINEER' | 'RESEARCHER' | null>(null);

  // Wizard States
  const [wizardState, setWizardState] = useState<WizardState>('IDLE');
  const [wizardIdea, setWizardIdea] = useState('');
  const [wizardQuestions, setWizardQuestions] = useState<string[]>([]);
  const [wizardAnswers, setWizardAnswers] = useState<string[]>([]);

  const handleWizardIdeaSubmit = async () => {
    if (!wizardIdea) return;
    setWizardState('AI_QUESTIONING');
    const questions = await generateScopingQuestions(wizardIdea);
    setWizardQuestions(questions);
    setWizardAnswers(new Array(questions.length).fill(''));
    setWizardState('USER_ANSWERING');
  };

  const handleWizardFinalSubmit = async () => {
    setWizardState('GENERATING_PLAN');
    const qaHistory = wizardQuestions.map((q, i) => ({ question: q, answer: wizardAnswers[i] }));
    const initialWhiteboard = await generateInitialWhiteboard(wizardIdea, qaHistory);
    const newProject: Project = {
        id: Date.now().toString(),
        title: wizardIdea.split(' ').slice(0, 5).join(' '),
        description: wizardIdea,
        status: 'IDEA',
        whiteboard: initialWhiteboard,
        notes: []
    };
    setProjects(prev => [...prev, newProject]);
    setSelectedProject(newProject);
    setWizardState('IDLE');
  };

  const addNote = (content: string = newNote, category: NoteCategory = selectedCategory) => {
    if (!selectedProject || !content) return;
    const note: ProjectNote = {
      id: Date.now().toString(),
      content: content,
      category: category,
      createdAt: new Date().toLocaleString()
    };
    const updatedProject = { ...selectedProject, notes: [note, ...selectedProject.notes] };
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
    setNewNote('');
  };

  const handleAiTool = async (tool: 'IDEAS' | 'PLAN' | 'CRITIQUE') => {
    if (!selectedProject) return;
    setIsThinking(true);
    setAiOutput('');
    const context = `Project: ${selectedProject.title}\nDescription: ${selectedProject.description}\nWhiteboard Context: ${selectedProject.whiteboard}\nExisting Notes: ${selectedProject.notes.map(n => n.content).join('; ')}`;
    let result = '';
    if (tool === 'IDEAS') result = await generateProjectIdeas(context);
    else if (tool === 'PLAN') result = await generateProjectPlan(context);
    else if (tool === 'CRITIQUE') result = await critiqueProjectFeasibility(context);
    setAiOutput(result);
    setIsThinking(false);
  };

  const handleAgentCall = async (agent: 'ENGINEER' | 'RESEARCHER') => {
    if (!selectedProject) return;
    const input = agent === 'ENGINEER' ? engineerInput : researchInput;
    if (!input.trim()) return;

    setIsThinking(true);
    setActiveAgent(agent);
    setAiOutput('');
    
    const context = `Title: ${selectedProject.title}\nWhiteboard: ${selectedProject.whiteboard}`;
    const result = await callAgent(agent, input, context);
    
    setAiOutput(result);
    setIsThinking(false);
    if (agent === 'ENGINEER') setEngineerInput('');
    else setResearchInput('');
  };

  const askWhiteboardQuestion = async () => {
    if (!selectedProject) return;
    setIsThinking(true);
    const recentNotes = selectedProject.notes.slice(0, 5).map(n => n.content).join(' ');
    const question = await generateProactiveQuestion(selectedProject.whiteboard, recentNotes);
    setWhiteboardQuestion(question);
    setIsThinking(false);
  };

  const submitWhiteboardAnswer = async () => {
    if (!selectedProject || !whiteboardQuestion || !whiteboardAnswer) return;
    setIsThinking(true);
    const updatedWhiteboard = await updateWhiteboardWithAnswer(selectedProject.whiteboard, whiteboardQuestion, whiteboardAnswer);
    const updatedProject = { ...selectedProject, whiteboard: updatedWhiteboard };
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
    setWhiteboardQuestion(null);
    setWhiteboardAnswer('');
    setIsThinking(false);
  };

  if (wizardState !== 'IDLE') {
    return (
        <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center p-6 md:p-12">
            <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8 animate-slide-up">
                <header>
                  <h2 className="text-xl font-bold text-slate-100 font-mono uppercase tracking-widest text-center">PROJECT GENESIS</h2>
                  <div className="w-12 h-1 bg-orange-600 mx-auto mt-2"></div>
                </header>
                
                {wizardState === 'INPUT_IDEA' && (
                    <div className="space-y-6">
                        <p className="text-slate-400 text-sm text-center leading-relaxed">Share your vision. Keep it simple and foundational.</p>
                        <textarea 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-200 focus:outline-none focus:border-orange-500/50 h-32 resize-none transition-all text-sm leading-relaxed" 
                          placeholder="What are we building?" 
                          value={wizardIdea} 
                          onChange={e => setWizardIdea(e.target.value)}
                        />
                        <button onClick={handleWizardIdeaSubmit} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/20">INITIALIZE SCOPE</button>
                    </div>
                )}
                
                {wizardState === 'USER_ANSWERING' && (
                    <div className="space-y-8">
                        {wizardQuestions.map((q, i) => (
                            <div key={i} className="space-y-3">
                                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">{q}</label>
                                <input 
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-orange-500/50 transition-all text-sm" 
                                  value={wizardAnswers[i]} 
                                  onChange={e => {const n = [...wizardAnswers]; n[i] = e.target.value; setWizardAnswers(n);}}
                                />
                            </div>
                        ))}
                        <button onClick={handleWizardFinalSubmit} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/20">ESTABLISH MISSION</button>
                    </div>
                )}
                
                {(wizardState === 'AI_QUESTIONING' || wizardState === 'GENERATING_PLAN') && (
                  <div className="text-center py-12 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-mono text-xs text-slate-500 uppercase tracking-widest animate-pulse">Processing Simulation...</span>
                  </div>
                )}
            </div>
        </div>
    );
  }

  if (selectedProject) {
    const filteredNotes = filterCategory === 'ALL' ? selectedProject.notes : selectedProject.notes.filter(n => (n.category || 'GENERAL') === filterCategory);

    return (
      <div className="h-full flex flex-col animate-fade-in bg-slate-950">
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><span className="material-icons-round">arrow_back</span></button>
            <div>
              <h2 className="text-lg font-bold font-mono text-orange-400 uppercase tracking-widest">{selectedProject.title}</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Mission Status: {selectedProject.status}</p>
            </div>
          </div>
          <div className="flex bg-slate-900 rounded-lg p-1 gap-1 border border-slate-800">
              <button onClick={() => setActiveTab('WORKBENCH')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeTab === 'WORKBENCH' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white'}`}>WORKBENCH</button>
              <button onClick={() => setActiveTab('WHITEBOARD')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeTab === 'WHITEBOARD' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white'}`}>WHITEBOARD</button>
              <button onClick={() => setActiveTab('AI_COACH')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeTab === 'AI_COACH' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white'}`}>AI_AGENTS</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
          {activeTab === 'WORKBENCH' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Entry Logger</span>
                    <div className="flex gap-2">
                        {CATEGORIES.map(c => (
                            <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] font-bold border transition-all ${selectedCategory === c.id ? 'bg-slate-800 border-slate-700 text-white' : 'border-transparent text-slate-600 hover:text-slate-400'}`}>
                                <span className={`material-icons-round text-xs ${c.color}`}>{c.icon}</span> {c.label.toUpperCase()}
                            </button>
                        ))}
                    </div>
                  </div>
                  <div className="relative">
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-5 text-sm focus:outline-none focus:border-orange-500/50 h-32 resize-none transition-all placeholder-slate-700 leading-relaxed" placeholder="Record telemetry, ideas, or log progress..."/>
                    <div className="absolute bottom-4 right-4 flex gap-3">
                        <VoiceInputButton onTranscript={t => setNewNote(p => p + ' ' + t)} size="sm"/>
                        <button onClick={() => addNote()} disabled={!newNote.trim()} className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 text-white px-5 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all">LOG_DATA</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Entry Timeline</h3>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)} className="bg-transparent text-[10px] text-slate-600 focus:outline-none uppercase font-bold cursor-pointer hover:text-slate-400">
                        <option value="ALL">Filtered: All</option>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  {filteredNotes.map(note => {
                    const cat = CATEGORIES.find(c => c.id === note.category) || CATEGORIES[0];
                    return (
                        <div key={note.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl relative hover:border-slate-700 transition-all group">
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`material-icons-round text-xs ${cat.color}`}>{cat.icon}</span>
                                <span className="text-[9px] text-slate-600 font-mono uppercase font-bold tracking-widest">{cat.label} • {note.createdAt}</span>
                            </div>
                            <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">{note.content}</p>
                        </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-4">
                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-0 shadow-lg">
                    <h4 className="text-orange-400 font-bold font-mono text-[10px] uppercase mb-4 tracking-widest">MISSION_MANIFEST</h4>
                    <p className="text-xs text-slate-500 leading-relaxed italic border-l-2 border-slate-800 pl-4 mb-6">{selectedProject.description}</p>
                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-mono"><span className="text-slate-700">ENTRIES</span><span className="text-slate-300">{selectedProject.notes.length}</span></div>
                        <div className="flex justify-between text-[10px] font-mono"><span className="text-slate-700">BUILD_PHASE</span><span className="text-orange-500 font-bold">{selectedProject.status}</span></div>
                        <div className="flex justify-between text-[10px] font-mono"><span className="text-slate-700">CO_ENGINEER</span><span className="text-emerald-500 font-bold">READY</span></div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'WHITEBOARD' && (
             <div className="space-y-6 pb-20 max-w-5xl mx-auto">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-orange-400 font-bold font-mono flex items-center gap-3 uppercase tracking-widest text-xs"><span className="material-icons-round text-lg">view_quilt</span> CONTEXT_BOOK</h3>
                        <button onClick={askWhiteboardQuestion} className="text-[9px] font-bold uppercase bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-700 text-slate-300 transition-all">
                            <span className="material-icons-round text-xs">psychology</span> Trigger Refinement
                        </button>
                    </div>
                    
                    {whiteboardQuestion && (
                        <div className="bg-slate-950 border border-orange-500/20 p-6 rounded-xl mb-6 animate-slide-up shadow-inner">
                            <h4 className="text-orange-400 font-mono text-[9px] font-bold uppercase mb-3 tracking-widest">COUNCIL_INQUIRY</h4>
                            <p className="text-slate-200 text-sm mb-4 leading-relaxed">{whiteboardQuestion}</p>
                            <div className="flex gap-3">
                                <input value={whiteboardAnswer} onChange={e => setWhiteboardAnswer(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all" placeholder="Input specific data..."/>
                                <button onClick={submitWhiteboardAnswer} disabled={isThinking || !whiteboardAnswer} className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">UPDATE</button>
                            </div>
                        </div>
                    )}

                    <textarea className="w-full h-[65vh] bg-transparent text-slate-400 font-mono text-xs leading-loose focus:outline-none resize-none scrollbar-hide" value={selectedProject.whiteboard} onChange={e => {
                        const updated = { ...selectedProject, whiteboard: e.target.value };
                        setProjects(prev => prev.map(p => p.id === selectedProject.id ? updated : p));
                        setSelectedProject(updated);
                    }} placeholder="The project soul lies here. Define architectures, core problems, and high-level strategy."/>
                </div>
             </div>
          )}

          {activeTab === 'AI_COACH' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
              <div className="space-y-6">
                 {/* ELITE AGENTS */}
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
                    <header className="flex items-center gap-3 border-b border-slate-800 pb-4">
                      <span className="material-icons-round text-emerald-500">terminal</span>
                      <h3 className="text-slate-200 font-bold font-mono text-xs uppercase tracking-widest">ELITE_AGENTS_0.01%</h3>
                    </header>

                    <div className="space-y-4">
                       {/* CO-ENGINEER AGENT */}
                       <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">AI_CO_ENGINEER</span>
                          </div>
                          <div className="relative">
                            <textarea value={engineerInput} onChange={e => setEngineerInput(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 h-20 focus:outline-none focus:border-emerald-500/30" placeholder="Ask about systems, code, or hardware design..."/>
                            <button onClick={() => handleAgentCall('ENGINEER')} className="absolute bottom-2 right-2 p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-500 transition-all">
                              <span className="material-icons-round text-sm">bolt</span>
                            </button>
                          </div>
                       </div>

                       {/* RESEARCH AGENT */}
                       <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">RESEARCH_AGENT</span>
                          </div>
                          <div className="relative">
                            <textarea value={researchInput} onChange={e => setResearchInput(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 h-20 focus:outline-none focus:border-purple-500/30" placeholder="Ask for market teardowns or feasibility research..."/>
                            <button onClick={() => handleAgentCall('RESEARCHER')} className="absolute bottom-2 right-2 p-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-all">
                              <span className="material-icons-round text-sm">search</span>
                            </button>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* CLASSIC TOOLS */}
                 <div className="space-y-3">
                   <button onClick={() => handleAiTool('IDEAS')} className="w-full bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-5 hover:border-orange-500/50 transition-all group">
                     <span className="material-icons-round text-yellow-500 text-xl">lightbulb</span>
                     <div className="text-left">
                        <p className="text-slate-200 font-bold text-xs uppercase tracking-wider">BRAINSTORM PIVOTS</p>
                        <p className="text-[9px] text-slate-600 uppercase tracking-tight">3 High-Leverage Strategic Shifts</p>
                     </div>
                   </button>
                   <button onClick={() => handleAiTool('PLAN')} className="w-full bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-5 hover:border-orange-500/50 transition-all group">
                     <span className="material-icons-round text-cyan-500 text-xl">schema</span>
                     <div className="text-left">
                        <p className="text-slate-200 font-bold text-xs uppercase tracking-wider">DEVELOP ARCHITECTURE</p>
                        <p className="text-[9px] text-slate-600 uppercase tracking-tight">Step-by-Step Technical Roadmap</p>
                     </div>
                   </button>
                   <button onClick={() => handleAiTool('CRITIQUE')} className="w-full bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-5 hover:border-orange-500/50 transition-all group">
                     <span className="material-icons-round text-red-500 text-xl">fact_check</span>
                     <div className="text-left">
                        <p className="text-slate-200 font-bold text-xs uppercase tracking-wider">FEASIBILITY AUDIT</p>
                        <p className="text-[9px] text-slate-600 uppercase tracking-tight">Systematic Failure Analysis</p>
                     </div>
                   </button>
                 </div>
              </div>

              {/* OUTPUT TERMINAL */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 min-h-[500px] flex flex-col relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-emerald-600 to-transparent opacity-50"></div>
                <h4 className="text-[9px] font-mono font-bold text-slate-600 uppercase mb-6 tracking-widest flex items-center gap-3">
                  <span className="material-icons-round text-xs animate-pulse">biotech</span> {activeAgent ? `${activeAgent}_FEED` : 'SYSTEM_FEED'}
                </h4>
                
                {isThinking ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-700 gap-4">
                        <div className="w-10 h-10 border-4 border-slate-800 border-t-orange-600 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-mono uppercase tracking-widest animate-pulse">Processing High-Agency Simulation...</p>
                    </div>
                ) : (
                    <div className="flex-1 text-slate-400 text-sm whitespace-pre-wrap font-mono leading-relaxed prose prose-invert max-w-none">
                        {aiOutput || "Select an agent or tool to initiate construction."}
                    </div>
                )}
                
                {aiOutput && !isThinking && (
                    <button onClick={() => { addNote(aiOutput, 'PLAN'); setAiOutput(''); setActiveAgent(null); }} className="mt-8 bg-slate-800 text-slate-300 border border-slate-700 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">Save Output to Logs</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
       <header className="border-b border-slate-800 pb-4">
          <h2 className="text-xl md:text-2xl font-bold text-orange-400 font-mono uppercase tracking-widest">BUILDER_HUB</h2>
       </header>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 overflow-y-auto pb-10 scrollbar-hide">
         <button onClick={() => setWizardState('INPUT_IDEA')} className="h-48 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center hover:border-orange-500/50 hover:bg-slate-900 transition-all group">
            <span className="material-icons-round text-3xl text-slate-700 group-hover:text-orange-500 mb-3 transition-colors">add_circle_outline</span>
            <span className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">Initialize Mission</span>
         </button>
         
         {projects.map(p => (
           <div key={p.id} onClick={() => setSelectedProject(p)} className="h-48 bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-orange-500/30 cursor-pointer flex flex-col group transition-all shadow-md">
             <div className="flex justify-between items-start mb-3">
                <span className={`text-[9px] font-bold font-mono px-2.5 py-1 rounded-md border ${p.status === 'IDEA' ? 'bg-yellow-900/10 text-yellow-500 border-yellow-800/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>{p.status}</span>
                <span className="material-icons-round text-slate-800 group-hover:text-orange-500 transition-colors">arrow_forward</span>
             </div>
             <h3 className="text-sm font-bold text-slate-100 uppercase mb-2 line-clamp-1 group-hover:text-orange-400 transition-colors">{p.title}</h3>
             <p className="text-[10px] text-slate-600 line-clamp-3 leading-relaxed h-12 mb-auto">{p.description}</p>
             <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 text-[9px] font-bold uppercase tracking-widest">
                    <span className="material-icons-round text-[14px]">history_edu</span> {p.notes.length} LOGS
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></div>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};

export default BuilderView;
