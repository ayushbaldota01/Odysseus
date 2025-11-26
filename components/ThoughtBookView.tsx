
import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { analyzeJournal } from '../services/geminiService';
import VoiceInputButton from './VoiceInputButton';

interface ThoughtBookViewProps {
  journal: JournalEntry[];
  setJournal: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
}

const ThoughtBookView: React.FC<ThoughtBookViewProps> = ({ journal, setJournal }) => {
  const [entryText, setEntryText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleLog = async () => {
    if (!entryText.trim()) return;
    
    setAnalyzing(true);
    const analysis = await analyzeJournal(entryText);
    
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      content: entryText,
      date: new Date().toLocaleString(),
      mood: 'NEUTRAL', // Simplified for now
      aiReflection: analysis
    };

    setJournal(prev => [newEntry, ...prev]);
    setEntryText('');
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <header className="border-b border-slate-700 pb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-pink-400 font-mono">THOUGHT_PROCESSOR</h2>
          <p className="text-slate-400 text-xs md:text-sm">Reflecting on the human behind the machine.</p>
      </header>

      {/* Input Area */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg relative">
        <textarea
          value={entryText}
          onChange={e => setEntryText(e.target.value)}
          placeholder="What's on your mind? (Academic stress, project breakthrough, personal thoughts...)"
          className="w-full bg-transparent text-slate-200 placeholder-slate-600 resize-none focus:outline-none h-24 text-base md:text-lg p-2"
        />
        
        <div className="flex justify-between items-center mt-2">
          <VoiceInputButton onTranscript={(text) => setEntryText(prev => prev + ' ' + text)} />
          
          <button 
            onClick={handleLog}
            disabled={analyzing || !entryText.trim()}
            className="bg-pink-600 hover:bg-pink-500 disabled:bg-slate-700 text-white px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 text-sm md:text-base"
          >
             {analyzing ? 'REFLECTING...' : 'LOG THOUGHT'}
             <span className="material-icons-round text-sm">auto_awesome</span>
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-6">
        {journal.length === 0 && (
          <div className="text-center text-slate-600 py-12">
            <span className="material-icons-round text-4xl mb-2 block">psychology</span>
            Your mind is clear. Log an entry to begin tracking your growth.
          </div>
        )}
        {journal.map(entry => (
          <div key={entry.id} className="relative pl-6 md:pl-8 border-l-2 border-slate-700">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-pink-500 border-4 border-slate-900"></div>
            <div className="bg-slate-800/50 p-4 rounded-lg hover:bg-slate-800 transition-colors">
              <p className="text-xs text-pink-400 font-mono mb-2">{entry.date}</p>
              <p className="text-slate-200 text-base md:text-lg mb-3">{entry.content}</p>
              {entry.aiReflection && (
                <div className="bg-pink-900/20 border-l-2 border-pink-500 pl-3 py-2 rounded-r">
                  <p className="text-sm text-pink-200 italic">
                    <span className="font-bold not-italic mr-2 text-xs bg-pink-500 text-white px-1 rounded">AI REFLECTION</span>
                    {entry.aiReflection}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThoughtBookView;
