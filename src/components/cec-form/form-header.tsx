"use client";

import * as React from "react";
import { CheckCircle2, ShieldCheck, Users, TestTube, Syringe, Activity, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceFeedback } from "../ui/voice-feedback";

interface CecFormHeaderProps {
    steps: { title: string; icon: any }[];
    activeStep: number;
    setActiveStep: (step: number) => void;
    isListening: boolean;
    toggleListening: () => void;
    lastTranscript: string;
}

export function CecFormHeader({ steps, activeStep, setActiveStep, isListening, toggleListening, lastTranscript }: CecFormHeaderProps) {
    return (
        <div className="space-y-4">
            <div className="bg-card border rounded-2xl p-4 shadow-sm flex justify-between items-center">
                <div className="flex justify-start items-center flex-1 overflow-x-auto no-scrollbar">
                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        const isCompleted = idx < activeStep;
                        const isActive = idx === activeStep;

                        return (
                            <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer mr-6 min-w-[60px]" onClick={() => setActiveStep(idx)}>
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center transition-all border-2",
                                    isActive ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" :
                                        isCompleted ? "bg-emerald-100 border-emerald-500 text-emerald-600" :
                                            "bg-muted border-transparent text-muted-foreground"
                                )}>
                                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                </div>
                                <span className={cn(
                                    "text-[10px] uppercase tracking-wider font-bold hidden md:block whitespace-nowrap",
                                    isActive ? "text-primary" : isCompleted ? "text-emerald-600" : "text-muted-foreground"
                                )}>{step.title}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="pl-4 border-l">
                    <VoiceFeedback isListening={isListening} onToggle={toggleListening} lastTranscript={lastTranscript} />
                </div>
            </div>

            <div className="relative h-2 bg-muted rounded-full overflow-hidden mx-4 -mt-4 opacity-50">
                <div
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
                    style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                />
            </div>
        </div>
    );
}
