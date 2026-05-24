'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/icons';
import { toast } from 'sonner';

// Type definitions for Web Speech API SpeechRecognition
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface WindowSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((this: WindowSpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: WindowSpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: WindowSpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
}

interface VoiceIntakeProps {
  onParse: (fields: {
    subject_name: string;
    primary_value: number;
    description: string;
    case_reference: string;
  }) => void;
  language?: string;
}

export function VoiceIntake({ onParse, language = 'English' }: VoiceIntakeProps) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsing, setParsing] = useState(false);
  const [supported, setSupported] = useState(true);
  
  const recognitionRef = useRef<WindowSpeechRecognition | null>(null);

  useEffect(() => {
    // Check SpeechRecognition support in browser
    const SpeechRecognition = 
      (window as unknown as { SpeechRecognition: new () => WindowSpeechRecognition }).SpeechRecognition || 
      (window as unknown as { webkitSpeechRecognition: new () => WindowSpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    
    // Match locale with selected language
    if (language === 'Azerbaijani') rec.lang = 'az-AZ';
    else if (language === 'Turkish') rec.lang = 'tr-TR';
    else rec.lang = 'en-US';

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          current += event.results[i][0].transcript;
        }
      }
      if (current) {
        setTranscript(prev => (prev + ' ' + current).trim());
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', e);
      if (e.error === 'not-allowed') {
        toast.error('Microphone access denied.');
      } else {
        toast.error(`Voice error: ${e.error}`);
      }
      setRecording(false);
    };

    rec.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = rec;
  }, [language]);

  const toggleRecording = () => {
    if (!supported) {
      toast.error('Voice intake not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setRecording(true);
        toast.success('Microphone listening... Speak now.');
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const parseTranscript = async () => {
    if (!transcript.trim()) {
      toast.warning('No transcript to parse. Please speak first.');
      return;
    }

    setParsing(true);
    try {
      const res = await fetch('/api/cases/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, lang: language }),
      });

      if (!res.ok) throw new Error('AI parser failed to extract attributes.');

      const data = await res.json();
      onParse(data);
      toast.success('Voice details parsed and loaded into wizard form!');
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'NLP parsing failed.';
      toast.error(errMsg);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-border-subtle bg-bg-surface-2/65 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Voice Intake Copilot
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            Speak to populate metadata. Try: &quot;New business loan for Ali Mammadov with value of 75000 dollars...&quot;
          </p>
        </div>
        
        <button
          type="button"
          onClick={toggleRecording}
          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
            recording
              ? 'bg-rose-500/25 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
              : 'bg-bg-surface hover:bg-bg-surface-2 border-border-subtle text-text-muted hover:text-text-primary hover:shadow-[0_0_8px_rgba(255,255,255,0.05)]'
          }`}
        >
          {recording ? (
            <span className="w-3.5 h-3.5 bg-rose-500 rounded-full animate-ping" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
      </div>

      {/* Transcript Textbox */}
      {transcript && (
        <div className="space-y-3 animate-[fadeIn_0.2s_ease-out]">
          <div className="p-3 rounded-lg bg-black/25 border border-border-subtle/50 font-mono text-[11px] text-text-primary min-h-[50px] leading-relaxed whitespace-pre-wrap select-text">
            {transcript}
            {recording && <span className="inline-block w-1.5 h-3 bg-rose-400 animate-pulse ml-0.5" />}
          </div>

          {!recording && (
            <button
              type="button"
              onClick={parseTranscript}
              disabled={parsing}
              className="w-full btn btn-primary py-2 text-[11px] rounded-lg flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(20,110,245,0.15)]"
            >
              {parsing ? (
                <>
                  <Icon.Loop className="animate-spin" size={12} />
                  AI Parsing Transcript...
                </>
              ) : (
                <>
                  <Icon.Bolt size={12} className="text-amber-400" />
                  Apply & Parse with AI
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
