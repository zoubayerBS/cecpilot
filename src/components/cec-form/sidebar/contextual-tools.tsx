import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Timer, Calculator, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextualToolsProps {
    activeStep: number;
    watch: any;
}

export function ContextualTools({ activeStep, watch }: ContextualToolsProps) {
    const [elapsed, setElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    // Simple Chronometer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- RENDERERS ---

    const renderPerfusionTools = () => (
        <div className="space-y-4">
            <div className="bg-slate-900 text-slate-50 rounded-2xl p-4 shadow-lg ring-1 ring-slate-900/10 relative overflow-hidden">
                {/* Background decorative glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />

                <div className="flex items-center gap-2 mb-3 text-indigo-300">
                    <Timer className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Chrono CEC</span>
                </div>

                <div className="text-center py-2">
                    <span className="text-4xl font-mono font-black tracking-widest tabular-nums font-variant-numeric">
                        {formatTime(elapsed)}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                    <Button
                        size="sm"
                        variant="secondary"
                        className={cn("h-8 rounded-lg", isRunning ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30" : "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30")}
                        onClick={() => setIsRunning(!isRunning)}
                    >
                        {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="col-span-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="w-full h-8 text-slate-400 hover:text-slate-200"
                            onClick={() => { setIsRunning(false); setElapsed(0); }}
                        >
                            <RotateCcw className="h-3 w-3 mr-2" /> Reset
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-10 text-xs rounded-xl border-dashed border-2 hover:border-solid hover:bg-slate-50">
                    <Zap className="h-3 w-3 mr-2 text-amber-500" />
                    Top Clampage
                </Button>
                <Button variant="outline" className="h-10 text-xs rounded-xl border-dashed border-2 hover:border-solid hover:bg-slate-50">
                    <Zap className="h-3 w-3 mr-2 text-blue-500" />
                    Top Déclamp.
                </Button>
            </div>
        </div>
    );

    const renderPatientTools = () => {
        const p = watch('poids');
        const t = watch('taille');
        const bmi = (p && t) ? (p / ((t / 100) * (t / 100))).toFixed(1) : '--';

        return (
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-4 border border-indigo-100">
                <div className="flex items-center gap-2 mb-3 text-indigo-700">
                    <Calculator className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Calculateur Rapide</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                    <span className="text-sm font-medium text-slate-600">IMC (BMI)</span>
                    <span className="text-2xl font-black text-slate-800">{bmi}</span>
                </div>
            </div>
        );
    }

    const renderDefaults = () => (
        <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 min-h-[100px]">
            <span className="text-xs font-medium">Outils contextuels inactifs</span>
        </div>
    );

    // Switch content based on step
    // Checklist=0, Patient=1, BilanPre=2, Materiel=3, Perfusion=4, BilanFinal=5
    switch (activeStep) {
        case 1: return renderPatientTools();
        case 4: return renderPerfusionTools();
        default: return renderDefaults();
    }
}
