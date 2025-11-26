
import React, { useState } from 'react';
import { Project, ProjectNote } from '../types';
import { generateProjectIdeas, generateProjectPlan, critiqueProjectFeasibility, generateScopingQuestions, generateComprehensiveRoadmap } from '../services/geminiService';
import VoiceInputButton from './VoiceInputButton';

interface BuilderViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

type NoteCategory = 'GENERAL' | 'IDEA' | 'PLAN' | 'RESEARCH' | 'LOG';

// Wizard State Machine
type WizardState = 'IDLE' | 'INPUT_IDEA' | 'AI_QUESTIONING' | 'USER_ANSWERING' | 'GENERATING_PLAN';

const CATEGORIES: { id: NoteCategory; label: string; icon: string; color: string }[] = [
  { id: 'GENERAL', label: 'General', icon: 'notes', color: 'text-slate-400' },
  { id: 'IDEA', label: 'Ideas', icon: 'lightbulb', color: 'text-yellow-400' },
  { id: 'PLAN', label: 'Plans', icon: 'assignment', color: 'text-cyan-400' },
  { id: 'RESEARCH', label: 'Research', icon: 'science', color: 'text-purple-400' },
  { id: 'LOG', label: 'Build Logs', icon: 'history_edu', color: 'text-green-400' },
];

const BuilderView: React.FC<BuilderViewProps> = ({ projects, setProjects }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Project Detail State
  const [newNote, setNewNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory>('GENERAL');
  const [filterCategory, setFilterCategory] = useState<NoteCategory | 'ALL'>('ALL');
  
  // AI Tool State
  const [aiOutput, setAiOutput] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeAiAction, setActiveAiAction] = useState<string | null>(null);

  // Wizard State
  const [wizardState, setWizardState] = useState<WizardState>('IDLE');
  const [wizardIdea, setWizardIdea] = useState('');
  const [wizardQuestions, setWizardQuestions] = useState<string[]>([]);
  const [wizardAnswers, setWizardAnswers] = useState<string[]>([]);

  const createProject = () => {
    setWizardState('INPUT_IDEA');
  };

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
    const roadmap = await generateComprehensiveRoadmap(wizardIdea, qaHistory);

    const newProject: Project = {
        id: Date.now().toString(),
        title: wizardIdea.split(' ').slice(0, 5).join(' ') + '...', // Auto title from idea
        description: wizardIdea,
        status: 'IN_PROGRESS',
        notes: [
            {
                id: Date.now().toString(),
                content: roadmap,
                category: 'PLAN',
                createdAt: new Date().toLocaleString()
            }
        ]
    };

    setProjects(prev => [...prev, newProject]);
    setSelectedProject(newProject);
    
    // Reset Wizard
    setWizardState('IDLE');
    setWizardIdea('');
    setWizardQuestions([]);
    setWizardAnswers([]);
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

  const handleAiAction = async (action: 'BRAINSTORM' | 'PLAN' | 'CRITIQUE') => {
    if (!selectedProject) return;
    setIsThinking(true);
    setActiveAiAction(action);
    setAiOutput('');
    
    let result = '';
    const context = `Project: ${selectedProject.title}\nDescription: ${selectedProject.description}\nRecent Notes: ${selectedProject.notes.slice(0,3).map(n => n.content).join('; ')}`;

    switch (action) {
      case 'BRAINSTORM':
        result = await generateProjectIdeas(context);
        break;
      case 'PLAN':
        result = await generateProjectPlan(context);
        break;
      case 'CRITIQUE':
        result = await critiqueProjectFeasibility(context);
        break;
    }
    
    setAiOutput(result);
    setIsThinking(false);
  };

  const saveAiResponse = () => {
    if (!aiOutput) return;
    let category: NoteCategory = 'GENERAL';
    if (activeAiAction === 'BRAINSTORM') category = 'IDEA';
    if (activeAiAction === 'PLAN') category = 'PLAN';
    if (activeAiAction === 'CRITIQUE') category = 'RESEARCH';
    
    addNote(aiOutput, category);
    setAiOutput('');
    setActiveAiAction(null);
  };

  // --- RENDER WIZARD MODAL ---
  if (wizardState !== 'IDLE') {
      return (
          <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="max-w-2xl w-full bg-slate-900 border border-orange-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-yellow-500"></div>
                  <button onClick={() => setWizardState('IDLE')} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                      <span className="material-icons-round">close</span>
                  </button>

                  <div className="mb-6">
                      <h2 className="text-2xl font-bold text-orange-400 font-mono mb-1">PROJECT_LAUNCHPAD</h2>
                      <p className="text-slate-400 text-sm">AI-Assisted Engineering Roadmap Generator</p>
                  </div>

                  {wizardState === 'INPUT_IDEA' && (
                      <div className="space-y-4 animate-slide-up">
                          <p className="text-slate-200 text-lg">What are you planning to build?</p>
                          <div className="relative">
                              <textarea 
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none resize-none h-32"
                                  placeholder="e.g. A remote controlled lawn mower powered by solar panels..."
                                  value={wizardIdea}
                                  onChange={e => setWizardIdea(e.target.value)}
                              />
                              <div className="absolute bottom-4 right-4">
                                 <VoiceInputButton onTranscript={(text) => setWizardIdea(prev => prev + ' ' + text)} size="sm" />
                              </div>
                          </div>
                          <button 
                              onClick={handleWizardIdeaSubmit}
                              disabled={!wizardIdea}
                              className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg font-bold transition-colors flex justify-center items-center gap-2"
                          >
                              ANALYZE IDEA <span className="material-icons-round">arrow_forward</span>
                          </button>
                      </div>
                  )}

                  {wizardState === 'AI_QUESTIONING' && (
                      <div className="flex flex-col items-center justify-center h-48 space-y-4 animate-fade-in">
                          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                          <p className="text-orange-400 font-mono animate-pulse">ANALYZING CONSTRAINTS...</p>
                      </div>
                  )}

                  {wizardState === 'USER_ANSWERING' && (
                      <div className="space-y-6 animate-slide-up">
                           <p className="text-slate-200">To create a perfect plan, I need a few details:</p>
                           <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                               {wizardQuestions.map((q, i) => (
                                   <div key={i}>
                                       <label className="block text-orange-300 text-sm font-bold mb-2">{q}</label>
                                       <div className="relative">
                                          <input 
                                              className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white focus:border-orange-500 focus:outline-none"
                                              value={wizardAnswers[i]}
                                              onChange={e => {
                                                  const newAnswers = [...wizardAnswers];
                                                  newAnswers[i] = e.target.value;
                                                  setWizardAnswers(newAnswers);
                                              }}
                                          />
                                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                              <VoiceInputButton onTranscript={(text) => {
                                                  const newAnswers = [...wizardAnswers];
                                                  newAnswers[i] = (newAnswers[i] || '') + ' ' + text;
                                                  setWizardAnswers(newAnswers);
                                              }} size="sm" />
                                          </div>
                                       </div>
                                   </div>
                               ))}
                           </div>
                           <button 
                              onClick={handleWizardFinalSubmit}
                              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold transition-colors flex justify-center items-center gap-2"
                          >
                              GENERATE BLUEPRINT <span className="material-icons-round">architecture</span>
                          </button>
                      </div>
                  )}

                  {wizardState === 'GENERATING_PLAN' && (
                      <div className="flex flex-col items-center justify-center h-64 space-y-6 animate-fade-in">
                           <span className="material-icons-round text-5xl text-orange-500 animate-bounce">psychology</span>
                           <div className="text-center">
                               <p className="text-white font-bold text-xl mb-2">Thinking Deeply...</p>
                               <p className="text-slate-400 text-sm max-w-md mx-auto">I'm calculating material needs, potential failure points, and execution steps. This may take a moment.</p>
                           </div>
                      </div>
                  )}
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => {setSelectedProject(null); setAiOutput('')}} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
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

        <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
          {/* Main Workspace */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
            
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setFilterCategory('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filterCategory === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                All
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

          {/* AI Side Panel */}
          <div className="w-full lg:w-80 flex flex-col gap-4 flex-shrink-0">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-1 overflow-hidden flex flex-col h-[300px] lg:h-auto lg:min-h-[500px]">
               <div className="p-3 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                 <h3 className="font-mono text-orange-400 font-bold text-sm flex items-center gap-2">
                   <span className="material-icons-round text-base">engineering</span>
                   AI CO-ENGINEER
                 </h3>
               </div>
               
               {/* Output Area */}
               <div className="flex-1 p-4 overflow-y-auto min-h-0 bg-slate-900/50">
                 {isThinking ? (
                   <div className="flex flex-col items-center justify-center h-full gap-3 text-orange-400/80">
                     <span className="material-icons-round animate-spin text-3xl">settings</span>
                     <span className="text-xs font-mono animate-pulse">ANALYZING SPECS...</span>
                   </div>
                 ) : aiOutput ? (
                   <div className="animate-fade-in">
                     <div className="text-xs font-mono text-slate-500 mb-2 uppercase">
                        Generated Output ({activeAiAction})
                     </div>
                     <div className="text-sm text-slate-200 whitespace-pre-wrap mb-4 border-l-2 border-orange-500 pl-3">
                       {aiOutput}
                     </div>
                     <button 
                       onClick={saveAiResponse}
                       className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2"
                     >
                       <span className="material-icons-round text-sm">save_alt</span>
                       SAVE TO PROJECT
                     </button>
                   </div>
                 ) : (
                   <div className="text-center text-slate-600 text-sm mt-10">
                     Select a tool below to assist with your engineering project.
                   </div>
                 )}
               </div>

               {/* Actions */}
               <div className="p-2 grid grid-cols-1 gap-2 bg-slate-800 border-t border-slate-700">
                  <button 
                    onClick={() => handleAiAction('BRAINSTORM')}
                    disabled={isThinking}
                    className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <span className="material-icons-round text-yellow-400 text-sm">lightbulb</span>
                    Brainstorm Ideas
                  </button>
                  <button 
                    onClick={() => handleAiAction('PLAN')}
                    disabled={isThinking}
                    className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <span className="material-icons-round text-cyan-400 text-sm">schema</span>
                    Generate Execution Plan
                  </button>
                  <button 
                    onClick={() => handleAiAction('CRITIQUE')}
                    disabled={isThinking}
                    className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <span className="material-icons-round text-red-400 text-sm">fact_check</span>
                    Feasibility Check
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
               <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                 project.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400 border-green-800' :
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
