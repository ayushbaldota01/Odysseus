
import React, { useState, useEffect } from 'react';
import { View, AppState, AcademicTask, Project, JournalEntry, BrainItem, DailyUpload, Book } from './types';
import AcademicsView from './components/AcademicsView';
import BuilderView from './components/BuilderView';
import ThoughtBookView from './components/ThoughtBookView';
import KnowledgeHub from './components/KnowledgeHub';
import FriendChat from './components/FriendChat';

import { GeminiDebugger } from './components/GeminiDebugger';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.ACADEMICS);
  const [showChat, setShowChat] = useState(false);

  // State Initializers with LocalStorage Lazy Loading
  const [tasks, setTasks] = useState<AcademicTask[]>(() => {
    const saved = localStorage.getItem('app_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('app_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [journal, setJournal] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('app_journal');
    return saved ? JSON.parse(saved) : [];
  });

  const [brainItems, setBrainItems] = useState<BrainItem[]>(() => {
    const saved = localStorage.getItem('app_brain_inbox');
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyUploads, setDailyUploads] = useState<DailyUpload[]>(() => {
    const saved = localStorage.getItem('app_daily_uploads');
    return saved ? JSON.parse(saved) : [];
  });

  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('app_books');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence Effects
  useEffect(() => localStorage.setItem('app_tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('app_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('app_journal', JSON.stringify(journal)), [journal]);
  useEffect(() => localStorage.setItem('app_brain_inbox', JSON.stringify(brainItems)), [brainItems]);
  useEffect(() => localStorage.setItem('app_daily_uploads', JSON.stringify(dailyUploads)), [dailyUploads]);
  useEffect(() => localStorage.setItem('app_books', JSON.stringify(books)), [books]);

  // Constructed AppState for the AI Context
  const appState: AppState = {
    userProfile: { name: 'Ayush', major: 'Mechanical Engineering' },
    tasks,
    projects,
    journal,
    resources: [],
    brain: {
      inbox: brainItems,
      dailyUploads,
      books
    }
  };

  const renderView = () => {
    switch (currentView) {
      case View.ACADEMICS:
        return <AcademicsView tasks={tasks} setTasks={setTasks} />;
      case View.BUILDER:
        return <BuilderView projects={projects} setProjects={setProjects} />;
      case View.THOUGHTS:
        return <ThoughtBookView journal={journal} setJournal={setJournal} />;
      case View.BRAIN:
        return <KnowledgeHub brainItems={brainItems} setBrainItems={setBrainItems} dailyUploads={dailyUploads} setDailyUploads={setDailyUploads} books={books} setBooks={setBooks} />;
      default:
        return <AcademicsView tasks={tasks} setTasks={setTasks} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden font-sans text-slate-200 selection:bg-cyan-500/30">
      {/* Sidebar Navigation */}
      <nav className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 transition-all duration-300">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              O
            </div>
            <span className="font-bold tracking-wider hidden md:block text-slate-100">ODYSSEUS</span>
          </div>

          <div className="p-4 space-y-2">
            <NavButton
              active={currentView === View.ACADEMICS}
              onClick={() => setCurrentView(View.ACADEMICS)}
              icon="school"
              label="ACADEMICS"
              colorClass="text-cyan-400"
            />
            <NavButton
              active={currentView === View.BUILDER}
              onClick={() => setCurrentView(View.BUILDER)}
              icon="construction"
              label="BUILDER"
              colorClass="text-orange-400"
            />
            <NavButton
              active={currentView === View.BRAIN}
              onClick={() => setCurrentView(View.BRAIN)}
              icon="psychology"
              label="SECOND_BRAIN"
              colorClass="text-emerald-400"
            />
            <NavButton
              active={currentView === View.THOUGHTS}
              onClick={() => setCurrentView(View.THOUGHTS)}
              icon="auto_stories"
              label="THOUGHT_BOOK"
              colorClass="text-pink-400"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded p-3 hidden md:block">
            <p className="text-xs text-slate-500 font-mono uppercase mb-1">Upcoming Deadline</p>
            {tasks.filter(t => !t.completed)[0] ? (
              <p className="text-sm font-bold text-slate-200 truncate">{tasks.filter(t => !t.completed)[0].title}</p>
            ) : (
              <p className="text-sm text-slate-400">All Clear</p>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        <div className={`flex-1 p-6 md:p-8 overflow-y-auto transition-all duration-300 ${showChat ? 'mr-[400px]' : ''}`}>
          {renderView()}
        </div>

        {/* Global Chat Toggle (Floating Action Button style on mobile, toggle on desktop) */}
        <button
          onClick={() => setShowChat(!showChat)}
          className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 ${showChat ? 'bg-slate-700 text-slate-300' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'}`}
        >
          <span className="material-icons-round text-2xl">{showChat ? 'close' : 'smart_toy'}</span>
        </button>

        {/* Slide-out Chat Panel */}
        <div className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 z-40 ${showChat ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full p-4 pt-20 md:pt-4">
            <FriendChat appState={appState} />
          </div>
        </div>
      </main>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  colorClass: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, colorClass }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all ${active ? 'bg-slate-800 border border-slate-700' : 'hover:bg-slate-800/50 text-slate-500 hover:text-slate-300'}`}
  >
    <span className={`material-icons-round ${active ? colorClass : ''}`}>{icon}</span>
    <span className={`font-bold text-xs tracking-widest hidden md:block ${active ? 'text-white' : ''}`}>{label}</span>
  </button>
);

export default App;
