
import React, { useState } from 'react';
import { AcademicTask, LearningResource, Flashcard, EmailAnalysisResult } from '../types';
import { generateSimpleHelp, summarizeLearningMaterial, generateStudyGuide, generateFlashcards, analyzeInboxForAcademics } from '../services/geminiService';
import VoiceInputButton from './VoiceInputButton';

interface AcademicsViewProps {
  tasks: AcademicTask[];
  setTasks: React.Dispatch<React.SetStateAction<AcademicTask[]>>;
  resources: LearningResource[];
  setResources: React.Dispatch<React.SetStateAction<LearningResource[]>>;
}

const AcademicsView: React.FC<AcademicsViewProps> = ({ tasks, setTasks, resources, setResources }) => {
  const [activeTab, setActiveTab] = useState<'TASKS' | 'NOTEBOOK' | 'MAIL'>('TASKS');
  
  // Task State
  const [newTask, setNewTask] = useState<Partial<AcademicTask>>({ type: 'ASSIGNMENT' });
  const [aiHelp, setAiHelp] = useState<string | null>(null);
  const [loadingHelp, setLoadingHelp] = useState(false);

  // Notebook State
  const [newResourceContent, setNewResourceContent] = useState('');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [processingSource, setProcessingSource] = useState(false);
  const [expandedResource, setExpandedResource] = useState<string | null>(null);
  const [generatingTools, setGeneratingTools] = useState(false);
  const [activeFlashcard, setActiveFlashcard] = useState<number>(0);
  const [flipped, setFlipped] = useState(false);

  // Mail State
  const [emailInput, setEmailInput] = useState('');
  const [isAnalyzingMail, setIsAnalyzingMail] = useState(false);
  const [mailAnalysis, setMailAnalysis] = useState<EmailAnalysisResult | null>(null);

  // --- Task Handlers ---
  const addTask = () => {
    if (!newTask.title || !newTask.subject) return;
    const task: AcademicTask = {
      id: Date.now().toString(),
      title: newTask.title,
      subject: newTask.subject,
      dueDate: newTask.dueDate || '',
      type: newTask.type as 'ASSIGNMENT',
      completed: false,
    };
    setTasks(prev => [...prev, task]);
    setNewTask({ type: 'ASSIGNMENT', title: '', subject: '', dueDate: '' });
  };

  const addSuggestedTask = (item: NonNullable<EmailAnalysisResult['importantEmails'][0]['actionItem']>) => {
    const task: AcademicTask = {
        id: Date.now().toString(),
        title: item.title,
        subject: 'Imported from Mail',
        dueDate: item.dueDate,
        type: item.type,
        completed: false
    };
    setTasks(prev => [...prev, task]);
  };

  const toggleComplete = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const askAiTutor = async (task: AcademicTask) => {
    setLoadingHelp(true);
    setAiHelp(null);
    const response = await generateSimpleHelp(`I have a task: "${task.title}" for subject "${task.subject}". Give me a breakdown of key concepts I need to review to complete this. Keep it brief.`);
    setAiHelp(response);
    setLoadingHelp(false);
  };

  // --- Notebook Handlers ---
  const addResource = async () => {
    if (!newResourceTitle || !newResourceContent) return;
    setProcessingSource(true);
    
    const { summary, keyConcepts } = await summarizeLearningMaterial(newResourceContent);
    
    const resource: LearningResource = {
        id: Date.now().toString(),
        title: newResourceTitle,
        content: newResourceContent,
        summary: summary,
        keyConcepts: keyConcepts,
        dateAdded: new Date().toLocaleDateString()
    };

    setResources(prev => [resource, ...prev]);
    setNewResourceTitle('');
    setNewResourceContent('');
    setProcessingSource(false);
  };

  const handleGenerateStudyGuide = async (r: LearningResource) => {
    setGeneratingTools(true);
    const guide = await generateStudyGuide(r.content);
    const updated = { ...r, studyGuide: guide };
    setResources(prev => prev.map(res => res.id === r.id ? updated : res));
    setGeneratingTools(false);
  };

  const handleGenerateFlashcards = async (r: LearningResource) => {
    setGeneratingTools(true);
    const cards = await generateFlashcards(r.content);
    const updated = { ...r, flashcards: cards };
    setResources(prev => prev.map(res => res.id === r.id ? updated : res));
    setGeneratingTools(false);
    setActiveFlashcard(0);
    setFlipped(false);
  };

  // --- Mail Handlers ---
  const handleAnalyzeInbox = async () => {
      if (!emailInput) return;
      setIsAnalyzingMail(true);
      const result = await analyzeInboxForAcademics(emailInput);
      setMailAnalysis(result);
      setIsAnalyzingMail(false);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <header className="flex justify-between items-end border-b border-slate-700 pb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-cyan-400 font-mono">ACADEMICS</h2>
          <p className="text-slate-400 text-xs md:text-sm">Degree Progress & Knowledge Base</p>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <button 
                onClick={() => setActiveTab('TASKS')}
                className={`px-3 md:px-4 py-1.5 rounded text-xs md:text-sm font-bold transition-all ${activeTab === 'TASKS' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                TASKS
            </button>
            <button 
                onClick={() => setActiveTab('MAIL')}
                className={`px-3 md:px-4 py-1.5 rounded text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'MAIL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                INBOX <span className="material-icons-round text-xs hidden sm:block">mail</span>
            </button>
            <button 
                onClick={() => setActiveTab('NOTEBOOK')}
                className={`px-3 md:px-4 py-1.5 rounded text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'NOTEBOOK' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                NOTEBOOK <span className="text-[10px] bg-indigo-900 px-1.5 rounded hidden sm:block">AI</span>
            </button>
        </div>
      </header>

      {activeTab === 'TASKS' && (
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {/* Input Area */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                <label className="text-xs text-slate-400 block mb-1">Task Title</label>
                <div className="relative">
                    <input
                        type="text"
                        value={newTask.title || ''}
                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none text-white"
                        placeholder="e.g. Thermodynamics HW 3"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <VoiceInputButton onTranscript={(text) => setNewTask(prev => ({ ...prev, title: (prev.title || '') + ' ' + text }))} size="sm" />
                    </div>
                </div>
                </div>
                <div>
                <label className="text-xs text-slate-400 block mb-1">Subject</label>
                <input
                    type="text"
                    value={newTask.subject || ''}
                    onChange={e => setNewTask({ ...newTask, subject: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none text-white"
                    placeholder="e.g. ME 201"
                />
                </div>
                <div>
                <label className="text-xs text-slate-400 block mb-1">Due Date</label>
                <input
                    type="date"
                    value={newTask.dueDate || ''}
                    onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none text-slate-300"
                />
                </div>
                <button
                onClick={addTask}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                ADD_TASK
                </button>
            </div>

            {/* AI Help Modal/Area */}
            {aiHelp && (
                <div className="bg-indigo-900/30 border border-indigo-500/50 p-4 rounded-lg relative">
                <button onClick={() => setAiHelp(null)} className="absolute top-2 right-2 text-indigo-300 hover:text-white">
                    <span className="material-icons-round text-sm">close</span>
                </button>
                <h4 className="text-indigo-300 font-mono text-sm mb-2 flex items-center gap-2">
                    <span className="material-icons-round text-sm">smart_toy</span> TUTOR_RESPONSE
                </h4>
                <p className="text-slate-200 text-sm whitespace-pre-line">{aiHelp}</p>
                </div>
            )}

            {/* Task List */}
            <div className="grid gap-4 pb-6">
                {tasks.length === 0 && <div className="text-center text-slate-500 py-10">No pending academic tasks. Time to build?</div>}
                
                {tasks.map(task => (
                <div key={task.id} className={`flex items-center justify-between p-4 rounded-lg border ${task.completed ? 'bg-slate-900 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center gap-4">
                    <button onClick={() => toggleComplete(task.id)} className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${task.completed ? 'border-green-500 bg-green-500/20' : 'border-slate-500'}`}>
                        {task.completed && <span className="material-icons-round text-green-500 text-xs">check</span>}
                    </button>
                    <div>
                        <h3 className={`font-medium text-sm md:text-base ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>{task.title}</h3>
                        <p className="text-xs text-slate-400 font-mono">{task.subject} • {task.type}</p>
                    </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-3">
                    <span className="text-xs text-slate-500 font-mono whitespace-nowrap">{task.dueDate}</span>
                    {!task.completed && (
                        <button 
                        onClick={() => askAiTutor(task)} 
                        disabled={loadingHelp}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs border border-cyan-900 bg-cyan-900/20 px-2 py-1 rounded hover:bg-cyan-900/40 transition-colors"
                        >
                        <span className="material-icons-round text-sm">{loadingHelp ? 'hourglass_empty' : 'help_outline'}</span>
                        {loadingHelp ? 'THINKING...' : 'TUTOR'}
                        </button>
                    )}
                    </div>
                </div>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'MAIL' && (
          <div className="flex-1 flex flex-col gap-6">
             <div className="bg-slate-900 p-4 md:p-6 rounded-lg border border-slate-800">
                 <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                     <h3 className="text-lg font-bold text-white flex items-center gap-2">
                         <span className="material-icons-round text-cyan-400">mark_email_unread</span>
                         Inbox Parser
                     </h3>
                     <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700 w-fit">Secure Client-Side Analysis</span>
                 </div>
                 <p className="text-slate-400 text-xs md:text-sm mb-4">
                     To connect your college mail: Select your emails in your mail client, click "Forward" or "Export", copy the text, and paste it below.
                 </p>
                 <textarea 
                     value={emailInput}
                     onChange={e => setEmailInput(e.target.value)}
                     placeholder="Paste raw email text here..."
                     className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none resize-none mb-4"
                 />
                 <button 
                    onClick={handleAnalyzeInbox}
                    disabled={isAnalyzingMail || !emailInput}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded font-bold flex items-center justify-center gap-2 disabled:opacity-50 w-full md:w-auto"
                 >
                     {isAnalyzingMail ? 'SCANNING...' : 'ANALYZE INBOX'}
                     <span className="material-icons-round">search</span>
                 </button>
             </div>

             {mailAnalysis && (
                 <div className="flex-1 overflow-y-auto pb-6">
                     <h4 className="text-slate-400 font-bold text-sm uppercase mb-3">Detected Items</h4>
                     <div className="grid gap-4">
                         {mailAnalysis.importantEmails.length === 0 && (
                             <div className="text-slate-500 italic">No actionable items found in the provided text.</div>
                         )}
                         {mailAnalysis.importantEmails.map((email, idx) => (
                             <div key={idx} className="bg-slate-800 p-4 rounded border border-slate-700 flex flex-col md:flex-row justify-between items-start gap-4">
                                 <div className="flex-1">
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${email.priority === 'HIGH' ? 'bg-red-900 text-red-400' : 'bg-slate-700 text-slate-300'}`}>{email.priority}</span>
                                         <h5 className="font-bold text-slate-200 text-sm line-clamp-1">{email.subject}</h5>
                                     </div>
                                     <p className="text-slate-400 text-xs mb-2 line-clamp-2">{email.summary}</p>
                                     {email.actionItem && (
                                         <div className="flex items-center gap-2 mt-2 bg-slate-900/50 p-2 rounded">
                                             <span className="material-icons-round text-cyan-400 text-sm">event</span>
                                             <span className="text-xs text-cyan-200 font-mono">
                                                 {email.actionItem.type}: {email.actionItem.title} (Due: {email.actionItem.dueDate})
                                             </span>
                                         </div>
                                     )}
                                 </div>
                                 {email.actionItem && (
                                     <button 
                                        onClick={() => addSuggestedTask(email.actionItem!)}
                                        className="bg-slate-700 hover:bg-cyan-600 text-white p-2 rounded transition-colors self-end md:self-start"
                                        title="Add to Tasks"
                                     >
                                         <span className="material-icons-round text-sm">add_task</span>
                                     </button>
                                 )}
                             </div>
                         ))}
                     </div>
                 </div>
             )}
          </div>
      )}

      {activeTab === 'NOTEBOOK' && (
          <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
              {/* Source Input (Left) */}
              <div className="w-full md:w-1/3 flex flex-col gap-4 bg-slate-900 p-4 border-r border-slate-800 overflow-y-auto flex-shrink-0 md:max-h-full">
                  <h3 className="text-indigo-300 font-bold flex items-center gap-2">
                      <span className="material-icons-round">add_circle_outline</span>
                      ADD SOURCE
                  </h3>
                  <input 
                     className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                     placeholder="Topic / Title (e.g. Fluid Dynamics Ch. 4)"
                     value={newResourceTitle}
                     onChange={e => setNewResourceTitle(e.target.value)}
                  />
                  <div className="relative">
                     <textarea 
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none h-48 resize-none"
                        placeholder="Paste notes or text..."
                        value={newResourceContent}
                        onChange={e => setNewResourceContent(e.target.value)}
                     />
                     <div className="absolute bottom-2 right-2">
                        <VoiceInputButton onTranscript={(text) => setNewResourceContent(prev => prev + ' ' + text)} size="sm" />
                     </div>
                  </div>
                  <button 
                    onClick={addResource}
                    disabled={processingSource || !newResourceContent}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-2 rounded font-bold transition-colors flex justify-center items-center gap-2"
                  >
                      {processingSource ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ANALYZING...
                          </>
                      ) : 'SUMMARIZE & SAVE'}
                  </button>
                  
                  <div className="mt-8">
                      <h4 className="text-slate-500 text-xs font-bold uppercase mb-3">Your Learning Library</h4>
                      <div className="space-y-2 pb-10">
                          {resources.map(r => (
                              <div 
                                key={r.id} 
                                onClick={() => {setExpandedResource(r.id); setActiveFlashcard(0); setFlipped(false);}}
                                className={`p-3 rounded border cursor-pointer transition-all ${expandedResource === r.id ? 'bg-indigo-900/20 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                              >
                                  <h5 className="text-sm font-bold text-slate-200 line-clamp-1">{r.title}</h5>
                                  <p className="text-xs text-slate-500">{r.dateAdded}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Notebook View (Right) */}
              <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 p-4 md:p-6 overflow-y-auto">
                  {expandedResource ? (
                      (() => {
                          const r = resources.find(res => res.id === expandedResource);
                          if (!r) return null;
                          return (
                              <div className="animate-fade-in space-y-8 pb-10">
                                  {/* Header */}
                                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{r.title}</h2>
                                        <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded inline-block mt-2">{r.dateAdded}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                        <button 
                                          onClick={() => handleGenerateStudyGuide(r)}
                                          disabled={generatingTools}
                                          className="flex-1 md:flex-none text-xs bg-slate-800 hover:bg-indigo-900 text-indigo-300 border border-indigo-900/50 px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
                                        >
                                            <span className="material-icons-round text-sm">description</span>
                                            {r.studyGuide ? 'REGENERATE GUIDE' : 'CREATE GUIDE'}
                                        </button>
                                        <button 
                                          onClick={() => handleGenerateFlashcards(r)}
                                          disabled={generatingTools}
                                          className="flex-1 md:flex-none text-xs bg-slate-800 hover:bg-indigo-900 text-indigo-300 border border-indigo-900/50 px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
                                        >
                                            <span className="material-icons-round text-sm">style</span>
                                            {r.flashcards ? 'REGENERATE CARDS' : 'CREATE FLASHCARDS'}
                                        </button>
                                    </div>
                                  </div>
                                  
                                  {/* AI Summary */}
                                  <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-xl">
                                      <h4 className="text-indigo-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                          <span className="material-icons-round text-sm">auto_awesome</span>
                                          AI BRIEFING
                                      </h4>
                                      <p className="text-base md:text-lg text-indigo-100 leading-relaxed mb-4">{r.summary}</p>
                                      <div className="flex flex-wrap gap-2">
                                          {r.keyConcepts.map((c, i) => (
                                              <span key={i} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full border border-indigo-500/30">
                                                  #{c}
                                              </span>
                                          ))}
                                      </div>
                                  </div>

                                  {/* Study Tools Section */}
                                  {(r.studyGuide || r.flashcards) && (
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                          {r.studyGuide && (
                                              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                                  <h4 className="text-slate-300 font-bold mb-3 flex items-center gap-2">
                                                      <span className="material-icons-round text-yellow-500">lightbulb</span>
                                                      Cheat Sheet
                                                  </h4>
                                                  <div className="prose prose-invert prose-sm max-h-64 overflow-y-auto pr-2 text-slate-400 whitespace-pre-wrap">
                                                      {r.studyGuide}
                                                  </div>
                                              </div>
                                          )}
                                          
                                          {r.flashcards && r.flashcards.length > 0 && (
                                              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col">
                                                  <h4 className="text-slate-300 font-bold mb-3 flex items-center gap-2">
                                                      <span className="material-icons-round text-green-500">school</span>
                                                      Active Recall ({activeFlashcard + 1}/{r.flashcards.length})
                                                  </h4>
                                                  <div 
                                                    className="flex-1 min-h-[200px] relative perspective-1000 cursor-pointer group"
                                                    onClick={() => setFlipped(!flipped)}
                                                  >
                                                      <div className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
                                                          {/* Front */}
                                                          <div className="absolute inset-0 bg-slate-700 rounded-xl p-6 flex items-center justify-center backface-hidden shadow-lg border border-slate-600 group-hover:border-indigo-500 transition-colors">
                                                              <p className="text-center font-bold text-base md:text-lg text-white">{r.flashcards[activeFlashcard].front}</p>
                                                              <span className="absolute bottom-4 text-xs text-slate-500">Click to reveal</span>
                                                          </div>
                                                          {/* Back */}
                                                          <div className="absolute inset-0 bg-indigo-900 rounded-xl p-6 flex items-center justify-center backface-hidden rotate-y-180 shadow-lg border border-indigo-700">
                                                              <p className="text-center text-indigo-100 text-sm md:text-base">{r.flashcards[activeFlashcard].back}</p>
                                                          </div>
                                                      </div>
                                                  </div>
                                                  <div className="flex justify-between mt-4">
                                                      <button 
                                                        onClick={() => {
                                                            setFlipped(false);
                                                            setActiveFlashcard(prev => prev > 0 ? prev - 1 : prev);
                                                        }}
                                                        disabled={activeFlashcard === 0}
                                                        className="text-slate-400 hover:text-white disabled:opacity-30"
                                                      >
                                                          <span className="material-icons-round">arrow_back</span>
                                                      </button>
                                                      <button 
                                                        onClick={() => {
                                                            setFlipped(false);
                                                            setActiveFlashcard(prev => prev < (r.flashcards?.length || 0) - 1 ? prev + 1 : prev);
                                                        }}
                                                        disabled={activeFlashcard === (r.flashcards?.length || 0) - 1}
                                                        className="text-slate-400 hover:text-white disabled:opacity-30"
                                                      >
                                                          <span className="material-icons-round">arrow_forward</span>
                                                      </button>
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  )}

                                  {/* Source Content */}
                                  <div className="prose prose-invert max-w-none border-t border-slate-800 pt-6">
                                      <h4 className="text-slate-400 text-sm font-bold uppercase mb-4">Source Content</h4>
                                      <p className="whitespace-pre-wrap text-slate-300 text-xs md:text-sm leading-relaxed">{r.content}</p>
                                  </div>
                              </div>
                          );
                      })()
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-6">
                          <span className="material-icons-round text-6xl mb-4 text-slate-700">menu_book</span>
                          <p className="text-lg">Select a learning source.</p>
                          <p className="text-sm mt-2 opacity-50">I can generate study guides and flashcards from your notes.</p>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default AcademicsView;
