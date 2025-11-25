
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseDictationProps {
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  value: string;
}

export function useDictation({ onChange, value }: UseDictationProps) {
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
    }
  }, []);

  const startRecording = useCallback(() => {
    if (isRecording || !isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    let finalTranscript = value ? String(value) : '';
    if (finalTranscript.length > 0 && !finalTranscript.endsWith(' ')) {
      finalTranscript += ' ';
    }

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        const newEvent = { target: { value: finalTranscript + interimTranscript } } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(newEvent);
    };
    
    recognition.onerror = (event) => {
        if (event.error === 'aborted' || event.error === 'no-speech') {
          return;
        }
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          toast({
            title: "Accès au microphone refusé",
            description: "Veuillez autoriser l'accès au microphone.",
            variant: "destructive",
          });
        }
        stopRecording();
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    };

    recognition.start();
    setIsRecording(true);
  }, [isRecording, isSupported, onChange, stopRecording, toast, value]);
  
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);
  
  useEffect(() => {
    return () => {
      stopRecording();
    }
  }, [stopRecording]);

  return { isRecording, toggleRecording, isSupported };
}
