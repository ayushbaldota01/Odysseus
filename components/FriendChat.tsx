
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AppState } from '../types';
import { generateDeepReflection } from '../services/geminiService';
import VoiceInputButton from './VoiceInputButton';

interface FriendChatProps {
  appState: AppState;
}

const FriendChat: React.FC<FriendChatProps> = ({ appState }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: "Systems online. I'm ready to build. What are we executing on today?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const responseText = await generateDeepReflection(input, appState);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, aiMsg]);
    setIsThinking(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const speakMessage = (text: string, id: string) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="bg-slate-800 p-3 border-b border-slate-700 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
        <div>
          <h3 className="text-sm font-bold text-white">Core System</h3>
          <p className="text-xs text-slate-400">Gemini 3 Pro • High Performance Mode</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[90%] md:max-w-[85%] p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap group relative ${msg.role === 'user' ? 'bg-cyan-700 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}`}>
               {msg.text}
               {msg.role === 'model' && (
                 <button 
                   onClick={() => speakMessage(msg.text, msg.id)}
                   className={`absolute -right-8 top-0 p-1 rounded-full ${speakingId === msg.id ? 'text-cyan-400' : 'text-slate-600 hover:text-cyan-400'} opacity-0 group-hover:opacity-100 transition-opacity`}
                   title="Read Aloud"
                 >
                   <span className="material-icons-round text-sm">
                     {speakingId === msg.id ? 'stop_circle' : 'volume_up'}
                   </span>
                 </button>
               )}
             </div>
          </div>
        ))}
        {isThinking && (
           <div className="flex justify-start">
             <div className="bg-slate-800 p-3 rounded-lg rounded-bl-none border border-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                <span className="text-xs text-slate-500 font-mono ml-2">Optimizing response...</span>
             </div>
           </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 md:p-4 bg-slate-800 border-t border-slate-700">
        <div className="relative flex gap-2 items-center">
          <div className="flex-1 relative">
             <textarea 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Command the system..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-4 pr-12 py-3 text-sm text-white focus:border-cyan-500 focus:outline-none resize-none h-14"
             />
             <button 
                onClick={sendMessage}
                disabled={isThinking}
                className="absolute right-2 top-2 p-2 text-cyan-400 hover:text-white disabled:text-slate-600"
             >
                <span className="material-icons-round">send</span>
             </button>
          </div>
          <VoiceInputButton onTranscript={(text) => setInput(prev => prev + ' ' + text)} />
        </div>
      </div>
    </div>
  );
};

export default FriendChat;
