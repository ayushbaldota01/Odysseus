
import React, { useState, useEffect } from 'react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript, className, size = 'md' }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // @ts-ignore
      const recognitionInstance = new window.webkitSpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onTranscript]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submits
    if (!recognition) {
      alert("Voice input not supported in this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <button
      onClick={toggleListening}
      className={`${className || ''} ${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-300 border ${
        isListening 
          ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
          : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:border-cyan-500'
      }`}
      title="Voice Input"
    >
      <span className={`material-icons-round ${iconSizes[size]}`}>
        {isListening ? 'mic' : 'mic_none'}
      </span>
    </button>
  );
};

export default VoiceInputButton;
