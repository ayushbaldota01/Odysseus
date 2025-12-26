
import React, { useState } from 'react';
import { AcademicTask, EmailAnalysisResult, LearningResource } from '../types';
import { generateSimpleHelp, analyzeEmailsForTasks, analyzeStudyMaterials } from '../services/geminiService';
import VoiceInputButton from './VoiceInputButton';

interface AcademicsViewProps {
  tasks: AcademicTask[];
  setTasks: React.Dispatch<React.SetStateAction<AcademicTask[]>>;
}

const AcademicsView: React.FC<AcademicsViewProps> = ({ tasks, setTasks }) => {
  const [activeTab, setActiveTab] = useState<'TASKS' | 'INBOX' | 'NOTEBOOK'>('TASKS');
  const [newTask, setNewTask] = useState<Partial<AcademicTask>>({ type: 'ASSIGNMENT' });
  const [aiHelp, setAiHelp] = useState<string | null>(null);
  const [loadingHelp, setLoadingHelp] = useState(false);

  // Inbox States
  const [emailText, setEmailText] = useState('');
  const [inboxResult, setInboxResult] = useState<EmailAnalysisResult | null>(null);
  
  // Notebook States
  const [noteContent, setNoteContent] = useState('');
  const [resource, setResource] = useState<Partial<LearningResource> | null>(null);

  const addTask = () => {
    if (!newTask.title || !newTask.subject) return;
    const task: AcademicTask = {
      id: Date.now().toString(),
      title: newTask.title,
      subject: newTask.subject,
      dueDate: newTask.dueDate || '',
      type: newTask.type as any,
      completed: false,
    };
    setTasks(prev => [...prev, task]);
    setNewTask({ type: 'ASSIGNMENT', title: '', subject: '', dueDate: '' });
  };

  const toggleComplete = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const askAiTutor = async (task: AcademicTask) => {
    setLoadingHelp(true);
    setAiHelp(null);
    const response = await generateSimpleHelp(`I have a task: "${task.title}" for subject "${task.subject}". Help me break it down and give me some starting tips.`);
    setAiHelp(response);
    setLoadingHelp(false);
  };

  const handleInboxScan = async () => {
    setLoadingHelp(true);
    const result = await analyzeEmailsForTasks(emailText);
    setInboxResult(result);
    setLoadingHelp(false);
  };

  const handleNoteAnalysis = async () => {
    setLoadingHelp(true);
    const result = await analyzeStudyMaterials(noteContent);
    setResource(result);
    setLoadingHelp(false);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <header className="flex justify-between items-end border-b border-slate-700 pb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-cyan-400 font-mono uppercase tracking-widest">ACADEMICS</h2>
          <p className="text-slate-400 text-xs md:text-sm">Manage deliverables and ingest knowledge.</p>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <button onClick={() => setActiveTab('TASKS')} className={`px-3 md:px-4 py-1.5 rounded text-xs md:text-sm font-bold transition-all ${activeTab === 'TASKS' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>TASKS</button>
            <button onClick={() => setActiveTab('INBOX')} className={`px-3 md:px-4 py-1.5 rounded text-xs md:text-sm font-bold transition-all ${activeTab === 'INBOX' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>INBOX</button>
            <button onClick={() => setActiveTab('NOTEBOOK')} className={`px-3 md:px-4 py-1.5 rounded text-xs md:text-sm font-bold transition-all ${activeTab === 'NOTEBOOK' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>NOTEBOOK</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {activeTab === 'TASKS' && (
          <>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Task Title</label>
                <input type="text" value={newTask.title || ''} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white" placeholder="e.g. Design Report"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Subject</label>
                <input type="text" value={newTask.subject || ''} onChange={e => setNewTask({...newTask, subject: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white" placeholder="e.g. Fluids II"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Due Date</label>
                <input type="date" value={newTask.dueDate || ''} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white"/>
              </div>
              <button onClick={addTask} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors text-sm">ADD TASK</button>
            </div>

            {aiHelp && (
              <div className="bg-indigo-900/30 border border-indigo-500/50 p-4 rounded-lg relative">
                <button onClick={() => setAiHelp(null)} className="absolute top-2 right-2 text-indigo-300 hover:text-white"><span className="material-icons-round text-sm">close</span></button>
                <h4 className="text-indigo-400 font-mono text-xs font-bold mb-2 flex items-center gap-2 uppercase">AI STRATEGY</h4>
                <p className="text-slate-200 text-sm whitespace-pre-line leading-relaxed">{aiHelp}</p>
              </div>
            )}

            <div className="grid gap-4">
              {tasks.map(task => (
                <div key={task.id} className={`flex items-center justify-between p-4 rounded-lg border transition-all ${task.completed ? 'bg-slate-900 border-slate-800 opacity-50' : 'bg-slate-800 border-slate-700'}`}>
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleComplete(task.id)} className={`w-6 h-6 rounded border-2 flex items-center justify-center ${task.completed ? 'border-green-500 bg-green-500' : 'border-slate-600'}`}>
                      {task.completed && <span className="material-icons-round text-white text-xs">check</span>}
                    </button>
                    <div>
                      <h3 className={`font-bold text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>{task.title}</h3>
                      <p className="text-[10px] text-slate-500 uppercase">{task.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-mono">{task.dueDate}</span>
                    {!task.completed && <button onClick={() => askAiTutor(task)} className="text-cyan-400 hover:text-cyan-300 transition-colors"><span className="material-icons-round text-lg">psychology</span></button>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'INBOX' && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
               <h3 className="text-slate-200 font-bold mb-3 flex items-center gap-2"><span className="material-icons-round text-cyan-400">email</span> Email/Announcement Scanner</h3>
               <textarea value={emailText} onChange={e => setEmailText(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-4 text-sm h-40 focus:outline-none focus:border-cyan-500" placeholder="Paste text from Canvas announcements or emails here..."/>
               <button onClick={handleInboxScan} disabled={loadingHelp || !emailText} className="mt-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold py-2 px-6 rounded transition-all">{loadingHelp ? 'SCANNING...' : 'SCAN FOR TASKS'}</button>
            </div>
            {inboxResult && (
              <div className="grid gap-4">
                {inboxResult.importantEmails.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-cyan-400 text-sm">{item.subject}</h4>
                       <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.priority === 'HIGH' ? 'bg-red-900/30 text-red-400' : 'bg-slate-700 text-slate-400'}`}>{item.priority}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">{item.summary}</p>
                    {item.actionItem && (
                      <div className="bg-slate-900 p-3 rounded flex justify-between items-center border border-slate-800">
                         <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Action Detected</p>
                            <p className="text-sm text-slate-200">{item.actionItem.title}</p>
                         </div>
                         <button onClick={() => {
                            const t: AcademicTask = { id: Date.now().toString(), title: item.actionItem!.title, subject: 'NEW_DETECTION', dueDate: item.actionItem!.dueDate, type: item.actionItem!.type as any, completed: false };
                            setTasks(prev => [...prev, t]);
                            alert('Task added to manager.');
                         }} className="text-xs bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded hover:bg-cyan-600 hover:text-white transition-all">ADD TO TASKS</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'NOTEBOOK' && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
               <h3 className="text-slate-200 font-bold mb-3 flex items-center gap-2"><span className="material-icons-round text-cyan-400">auto_stories</span> AI Study Assistant</h3>
               <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-4 text-sm h-40 focus:outline-none focus:border-cyan-500" placeholder="Paste lecture notes or chapter text to generate study material..."/>
               <button onClick={handleNoteAnalysis} disabled={loadingHelp || !noteContent} className="mt-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold py-2 px-6 rounded transition-all">{loadingHelp ? 'ANALYZING...' : 'GENERATE STUDY GUIDE'}</button>
            </div>
            {resource && (
              <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg space-y-6">
                 <div>
                    <h4 className="text-cyan-400 font-bold text-lg mb-2">{resource.title}</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{resource.summary}</p>
                 </div>
                 <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Key Concepts</h5>
                    <div className="flex flex-wrap gap-2">
                       {resource.keyConcepts?.map((c, i) => <span key={i} className="bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1 rounded text-xs">{c}</span>)}
                    </div>
                 </div>
                 {resource.flashcards && (
                   <div>
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Flashcards</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {resource.flashcards.map((f, i) => (
                           <div key={i} className="bg-slate-900 p-4 rounded border border-slate-700 text-sm">
                              <p className="font-bold text-cyan-400 mb-2">Q: {f.front}</p>
                              <p className="text-slate-400 italic">A: {f.back}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicsView;
