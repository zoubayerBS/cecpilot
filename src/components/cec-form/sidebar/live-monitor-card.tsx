import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, Droplets, Ruler, Scale } from "lucide-react";

interface LiveMonitorProps {
    watch: any;
    aiRisk: number | null;
}

export function LiveMonitorCard({ watch, aiRisk }: LiveMonitorProps) {
    const bsa = watch('surface_corporelle');
    const flow = watch('debit_theorique');

    // Simple Gauge Component
    const Gauge = ({ value, label, unit, color = "text-primary", max = 100 }: any) => {
        // Calculate stroke dash based on value (mock max values for visualization)
        // BSA max ~2.5, Flow max ~6.0
        const percentage = Math.min(100, (parseFloat(value || 0) / max) * 100);
        const radius = 36;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        return (
            <div className="flex flex-col items-center justify-center relative group cursor-default">
                <div className="relative w-24 h-24">
                    {/* Ring Background */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-muted/20"
                        />
                        {/* Ring Progress */}
                        {value && (
                            <circle
                                cx="48"
                                cy="48"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className={cn("transition-all duration-1000 ease-out", color)}
                            />
                        )}
                    </svg>
                    {/* Inner Value */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold tracking-tighter cursor-help" title={label}>{value || '--'}</span>
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">{unit}</span>
                    </div>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground mt-1 text-center px-2">{label}</span>
            </div>
        );
    };

    return (
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4 shadow-inner border border-white/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                        <Activity className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Signes Vitaux</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-[pulse_1s_infinite]" />
                    <span className="text-[10px] font-bold text-emerald-600 tracking-wider">LIVE</span>
                </div>
            </div>

            <div className="flex justify-between items-start">
                <Gauge value={bsa} label="Surface (BSA)" unit="m²" max={2.6} color="text-violet-500" />
                <Gauge value={flow} label="Débit Théorique" unit="L/min" max={7.0} color="text-cyan-500" />
            </div>

            {/* AI Risk Bar - Mini Version */}
            {aiRisk !== null && (
                <div className="mt-5 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-4">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Risque Transfusion</span>
                            <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-full",
                                aiRisk > 0.5 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                            )}>
                                {(aiRisk * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-all duration-1000", aiRisk > 0.5 ? "bg-red-500" : "bg-emerald-500")}
                                style={{ width: `${aiRisk * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
