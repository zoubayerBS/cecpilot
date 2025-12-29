"use client";

import * as React from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

interface VoiceFeedbackProps {
    isListening: boolean;
    onToggle: () => void;
    lastTranscript?: string;
    className?: string;
}

export function VoiceFeedback({ isListening, onToggle, lastTranscript, className }: VoiceFeedbackProps) {
    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={isListening ? "destructive" : "outline"}
                            size="icon"
                            className={cn(
                                "rounded-full h-12 w-12 transition-all duration-300 shadow-md",
                                isListening && "animate-pulse ring-4 ring-red-200"
                            )}
                            onClick={onToggle}
                        >
                            {isListening ? <Mic className="h-6 w-6" /> : <MicOff className="h-5 w-5 text-muted-foreground" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isListening ? "Arrêter l'écoute" : "Activer la commande vocale"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {isListening && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    En écoute...
                </div>
            )}

            {lastTranscript && !isListening && (
                <div className="text-xs text-emerald-600 font-medium italic animate-in fade-in zoom-in duration-300">
                    "{lastTranscript}"
                </div>
            )}
        </div>
    );
}
