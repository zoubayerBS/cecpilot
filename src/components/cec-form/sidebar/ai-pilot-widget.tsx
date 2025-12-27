import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ShieldAlert, Wand2, Sparkles, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIPilotProps {
    isValidating: boolean;
    isSummarizing: boolean;
    aiAlerts: any[];
    onAiCheck: () => void;
    onGenerateSummary: () => void;
}

export function AIPilotWidget({
    isValidating,
    isSummarizing,
    aiAlerts,
    onAiCheck,
    onGenerateSummary
}: AIPilotProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Brain className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Assistant IA</span>
                <Badge variant="outline" className="ml-auto text-[10px] h-5 bg-indigo-50 text-indigo-600 border-indigo-200">
                    BETA
                </Badge>
            </div>

            {/* Chat Bubble Style Actions */}
            <div className="flex flex-col gap-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-3 px-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 hover:bg-slate-50 transition-all group text-left"
                    onClick={onAiCheck}
                    disabled={isValidating}
                >
                    <div className="bg-indigo-50 p-2 rounded-full group-hover:bg-indigo-100 transition-colors">
                        {isValidating ? <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> : <ShieldAlert className="h-4 w-4 text-indigo-600" />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">Audit de Sécurité</span>
                        <span className="text-[10px] text-slate-400 font-medium">Vérifier la cohérence des saisies</span>
                    </div>
                </Button>

                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-3 px-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group text-left"
                    onClick={onGenerateSummary}
                    disabled={isSummarizing}
                >
                    <div className="bg-emerald-50 p-2 rounded-full group-hover:bg-emerald-100 transition-colors">
                        {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <Wand2 className="h-4 w-4 text-emerald-600" />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">Génération Conclusion</span>
                        <span className="text-[10px] text-slate-400 font-medium">Rédiger le résumé clinique</span>
                    </div>
                </Button>
            </div>

            {/* Insights Stream */}
            {aiAlerts.length > 0 && (
                <div className="mt-4 pl-4 pt-2 border-l-2 border-indigo-100 space-y-3">
                    {aiAlerts.map((alert, i) => (
                        <div key={i} className="relative animate-in slide-in-from-left-2 fade-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                            {/* Dot on timeline */}
                            <div className={cn(
                                "absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white",
                                alert.type === 'error' ? "bg-red-500" : "bg-blue-500"
                            )} />

                            <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm border border-slate-100 text-xs text-slate-600 leading-relaxed">
                                {alert.message}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
