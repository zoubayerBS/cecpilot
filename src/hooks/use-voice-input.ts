"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceCommand = {
    command: string;
    action: () => void;
    keywords: string[];
};

interface UseVoiceInputProps {
    commands: VoiceCommand[];
    language?: string;
    onTranscript?: (transcript: string) => void;
}

// Simple Levenshtein distance for fuzzy matching
const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

const isMatch = (transcript: string, keyword: string): boolean => {
    const t = transcript.toLowerCase().trim();
    const k = keyword.toLowerCase().trim();

    // 1. Exact match or includes
    if (t.includes(k)) return true;

    // 2. Fuzzy match (approx 80% similarity threshold)
    // Allow max 2 errors for short words, more for longer?
    // Let's use a dynamic threshold based on length.
    const distance = levenshteinDistance(t, k);
    const maxAllowedErrors = Math.max(2, Math.floor(k.length * 0.3)); // 30% error tolerance

    // Only fuzzy match if the keyword is not super short (avoid matching "a" or "or")
    if (k.length > 3 && distance <= maxAllowedErrors) {
        console.log(`Fuzzy match found: '${t}' ~= '${k}' (dist: ${distance})`);
        return true;
    }

    return false;
};

export function useVoiceInput({ commands, language = 'fr-FR', onTranscript }: UseVoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);

    // Use a ref to store the recognition instance so we can stop/start it
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window.SpeechRecognition || (window as any).webkitSpeechRecognition)) {
            setIsSupported(true);
        }
    }, []);

    const processCommand = useCallback((transcript: string) => {
        const cleanTranscript = transcript.toLowerCase().trim();
        console.log("Voice transcript:", cleanTranscript);

        // Find the FIRST command that matches any of its keywords
        const matchedCommand = commands.find(cmd =>
            cmd.keywords.some(keyword => isMatch(cleanTranscript, keyword))
        );

        if (matchedCommand) {
            console.log("Executing command:", matchedCommand.command);
            matchedCommand.action();
        }
    }, [commands]);

    const startListening = useCallback(() => {
        if (!isSupported) return;

        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = language;
        recognition.continuous = false; // We want single commands for now to avoid noise
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            setLastTranscript(transcript);
            if (onTranscript) onTranscript(transcript);
            processCommand(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
    }, [isSupported, language, onTranscript, processCommand]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return {
        isListening,
        lastTranscript,
        isSupported,
        startListening,
        stopListening,
        toggleListening
    };
}
