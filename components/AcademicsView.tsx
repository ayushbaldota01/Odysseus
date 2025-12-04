
import React, { useState } from 'react';
import { AcademicTask, EmailAnalysisResult } from '../types';
import { generateSimpleHelp, analyzeInboxForAcademics } from '../services/geminiService';
import VoiceInputButton from './VoiceInputButton';

interface AcademicsViewProps {
  tasks: AcademicTask[];
  setTasks: React.Dispatch<React.SetStateAction<AcademicTask[]>>;
}

const AcademicsView: React.FC<AcademicsViewProps> = ({ tasks, setTasks }) => {
  const [activeTab, setActiveTab] = useState<'TASKS' | 'MAIL'>('TASKS');
  
  // Task State
  const [newTask, setNewTask] = useState<Partial<AcademicTask>>({ type: 'ASSIGNMENT' });
  const [aiHelp, setAiHelp] = useState<string | null>(null);
  const [loadingHelp, setLoadingHelp] = useState(false);

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

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const askAiTutor = async (task: AcademicTask) => {
    setLoadingHelp(true);
    setAiHelp(null);
    const response = await generateSimpleHelp(`I have a task: "${task.title}" for subject "${task.subject}". Give me a breakdown of key concepts I need to review to complete this. Keep it brief.`);
    setAiHelp(response);
    setLoadingHelp(false);
  };

  // --- Mail Handlers ---
  const handleAnalyzeInbox = async () => {
      if (!emailInput) return;
      setIsAnalyzingMail(true);
      const result = await analyzeInboxForAcademics(emailInput);
      setMailAnalysis(result);
      setIsAnalyzingMail(false);
  };

  const clearMailAnalysis = () => {
      setMailAnalysis(null);
      setEmailInput('');
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <header className="flex justify-between items-end border-b border-slate-700 pb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-cyan-400 font-mono">ACADEMICS</h2>
          <p className="text-slate-400 text-xs md:text-sm">Task Management & Email Intelligence</p>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <button 
                onClick={() => setActiveTab('TASKS')}
                className={`px-4 md:px-6 py-2 rounded text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'TASKS' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <span className="material-icons-round text-sm">checklist</span>
                TASKS
            </button>
            <button 
                onClick={() => setActiveTab('MAIL')}
                className={`px-4 md:px-6 py-2 rounded text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'MAIL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <span className="material-icons-round text-sm">mail</span>
                INBOX AI
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
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                >
                <span className="material-icons-round text-sm">add</span>
                ADD TASK
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
                {tasks.length === 0 && (
                    <div className="text-center text-slate-500 py-10">
                        <span className="material-icons-round text-4xl mb-2 block">assignment</span>
                        No pending academic tasks. Add one above or import from your emails!
                    </div>
                )}
                
                {tasks.map(task => (
                <div key={task.id} className={`flex items-center justify-between p-4 rounded-lg border ${task.completed ? 'bg-slate-900 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center gap-4">
                    <button onClick={() => toggleComplete(task.id)} className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${task.completed ? 'border-green-500 bg-green-500/20' : 'border-slate-500 hover:border-cyan-500'}`}>
                        {task.completed && <span className="material-icons-round text-green-500 text-xs">check</span>}
                    </button>
                    <div>
                        <h3 className={`font-medium text-sm md:text-base ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>{task.title}</h3>
                        <p className="text-xs text-slate-400 font-mono">{task.subject} • {task.type}</p>
                    </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-3">
                    <span className="text-xs text-slate-500 font-mono whitespace-nowrap">{task.dueDate}</span>
                    <div className="flex gap-2">
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
                        <button 
                            onClick={() => deleteTask(task.id)} 
                            className="text-red-400 hover:text-red-300 flex items-center text-xs border border-red-900 bg-red-900/20 px-2 py-1 rounded hover:bg-red-900/40 transition-colors"
                        >
                            <span className="material-icons-round text-sm">delete</span>
                        </button>
                    </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'MAIL' && (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
             {/* Header Card */}
             <div className="bg-gradient-to-r from-cyan-900/30 to-slate-900 p-6 rounded-xl border border-cyan-800/50">
                 <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                     <div>
                         <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-2">
                             <span className="material-icons-round text-cyan-400 text-2xl">mark_email_unread</span>
                             VIT Email Intelligence
                         </h3>
                         <p className="text-slate-400 text-sm">
                             AI-powered analysis for <span className="text-cyan-400 font-mono">ayush.baldota224@vit.edu</span>
                         </p>
                     </div>
                     <span className="text-xs text-emerald-400 bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-800 w-fit flex items-center gap-2">
                         <span className="material-icons-round text-xs">security</span>
                         Secure Client-Side Analysis
                     </span>
                 </div>
             </div>

             {/* Instructions Card */}
             <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                 <h4 className="text-slate-300 font-bold mb-3 flex items-center gap-2">
                     <span className="material-icons-round text-cyan-400">help_outline</span>
                     How to Use
                 </h4>
                 <div className="grid md:grid-cols-3 gap-4 text-sm">
                     <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                         <div className="w-8 h-8 bg-cyan-900/50 rounded-full flex items-center justify-center mb-2">
                             <span className="text-cyan-400 font-bold">1</span>
                         </div>
                         <p className="text-slate-300">Open your VIT email in browser or Outlook</p>
                     </div>
                     <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                         <div className="w-8 h-8 bg-cyan-900/50 rounded-full flex items-center justify-center mb-2">
                             <span className="text-cyan-400 font-bold">2</span>
                         </div>
                         <p className="text-slate-300">Select emails → Copy text (Ctrl+A, Ctrl+C)</p>
                     </div>
                     <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                         <div className="w-8 h-8 bg-cyan-900/50 rounded-full flex items-center justify-center mb-2">
                             <span className="text-cyan-400 font-bold">3</span>
                         </div>
                         <p className="text-slate-300">Paste below → AI extracts deadlines & tasks</p>
                     </div>
                 </div>
             </div>

             {/* Input Area */}
             <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                 <div className="flex items-center justify-between mb-3">
                     <label className="text-slate-400 text-sm font-bold flex items-center gap-2">
                         <span className="material-icons-round text-sm">content_paste</span>
                         Paste Email Content
                     </label>
                     {emailInput && (
                         <button 
                             onClick={() => setEmailInput('')}
                             className="text-xs text-slate-500 hover:text-slate-300"
                         >
                             Clear
                         </button>
                     )}
                 </div>
                 <textarea 
                     value={emailInput}
                     onChange={e => setEmailInput(e.target.value)}
                     placeholder="Paste your email content here... (supports multiple emails at once)"
                     className="w-full h-40 bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none resize-none mb-4 font-mono"
                 />
                 <div className="flex flex-col md:flex-row gap-3">
                     <button 
                        onClick={handleAnalyzeInbox}
                        disabled={isAnalyzingMail || !emailInput}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                     >
                         {isAnalyzingMail ? (
                             <>
                                 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                 ANALYZING...
                             </>
                         ) : (
                             <>
                                 <span className="material-icons-round">auto_awesome</span>
                                 ANALYZE WITH AI
                             </>
                         )}
                     </button>
                     {mailAnalysis && (
                         <button 
                            onClick={clearMailAnalysis}
                            className="px-6 py-3 rounded-lg font-bold border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                         >
                             CLEAR RESULTS
                         </button>
                     )}
                 </div>
             </div>

             {/* Results */}
             {mailAnalysis && (
                 <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                     <div className="flex items-center justify-between mb-4">
                         <h4 className="text-white font-bold flex items-center gap-2">
                             <span className="material-icons-round text-cyan-400">summarize</span>
                             Analysis Results
                         </h4>
                         <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                             {mailAnalysis.importantEmails.length} items detected
                         </span>
                     </div>
                     
                     <div className="grid gap-4">
                         {mailAnalysis.importantEmails.length === 0 && (
                             <div className="text-slate-500 italic text-center py-8">
                                 <span className="material-icons-round text-3xl mb-2 block">inbox</span>
                                 No actionable items found. Try pasting more emails or check if the content includes deadlines.
                             </div>
                         )}
                         {mailAnalysis.importantEmails.map((email, idx) => (
                             <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                                 <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                     <div className="flex-1">
                                         <div className="flex items-center gap-2 mb-2">
                                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                 email.priority === 'HIGH' ? 'bg-red-900 text-red-400' : 
                                                 email.priority === 'MEDIUM' ? 'bg-yellow-900 text-yellow-400' :
                                                 'bg-slate-700 text-slate-300'
                                             }`}>
                                                 {email.priority}
                                             </span>
                                             <h5 className="font-bold text-slate-200 text-sm">{email.subject}</h5>
                                         </div>
                                         <p className="text-slate-400 text-sm mb-3">{email.summary}</p>
                                         {email.actionItem && (
                                             <div className="flex items-center gap-2 bg-cyan-900/20 border border-cyan-800/50 p-3 rounded-lg">
                                                 <span className="material-icons-round text-cyan-400">event</span>
                                                 <div>
                                                     <span className="text-xs text-cyan-300 font-bold">{email.actionItem.type}</span>
                                                     <p className="text-sm text-cyan-100 font-mono">
                                                         {email.actionItem.title}
                                                     </p>
                                                     <span className="text-xs text-cyan-400">Due: {email.actionItem.dueDate}</span>
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                     {email.actionItem && (
                                         <button 
                                            onClick={() => addSuggestedTask(email.actionItem!)}
                                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                                            title="Add to Tasks"
                                         >
                                             <span className="material-icons-round text-sm">add_task</span>
                                             ADD TO TASKS
                                         </button>
                                     )}
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* Tips */}
             {!mailAnalysis && (
                 <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-800">
                     <h5 className="text-slate-400 text-xs font-bold uppercase mb-2">Pro Tips</h5>
                     <ul className="text-slate-500 text-xs space-y-1">
                         <li>• Paste multiple emails at once for batch analysis</li>
                         <li>• Works best with emails containing dates and deadlines</li>
                         <li>• AI categorizes by priority: Exams, Assignments, Important Notices</li>
                         <li>• Click "Add to Tasks" to instantly create a task from detected items</li>
                     </ul>
                 </div>
             )}
          </div>
      )}
    </div>
  );
};

export default AcademicsView;
