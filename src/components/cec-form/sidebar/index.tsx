import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2, Activity, Brain, Clock, Calculator, ChevronRight, ChevronLeft, Menu } from "lucide-react";
import { LiveMonitorCard } from './live-monitor-card';
import { ContextualTools } from './contextual-tools';
import { AIPilotWidget } from './ai-pilot-widget';

interface SidebarProps {
    watch: any;
    activeStep: number;
    aiRisk: number | null;
    isValidating: boolean;
    isSummarizing: boolean;
    aiAlerts: any[];
    onAiCheck: () => void;
    onGenerateSummary: () => void;
    isDirty: boolean;
}

export function Sidebar({
    watch,
    activeStep,
    aiRisk,
    isValidating,
    isSummarizing,
    aiAlerts,
    onAiCheck,
    onGenerateSummary,
    isDirty
}: SidebarProps) {
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <aside
            className={cn(
                "fixed bottom-24 right-4 z-[100] transition-all duration-500 ease-in-out md:static md:h-auto",
                collapsed ? "w-16 h-16 rounded-full overflow-hidden md:w-20" : "w-[90vw] max-w-sm md:w-80 h-auto rounded-3xl"
            )}
        >
            <div className={cn(
                "h-full w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden flex flex-col transition-all duration-500",
                collapsed ? "rounded-full items-center justify-center p-0 bg-primary/90 text-primary-foreground" : "rounded-3xl"
            )}>

                {/* Mobile Toggle / Collapsed State */}
                {collapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-full w-full rounded-full hover:bg-transparent"
                        onClick={() => setCollapsed(false)}
                    >
                        <Activity className="h-8 w-8 animate-pulse" />
                    </Button>
                )}

                {!collapsed && (
                    <>
                        <div className="absolute top-2 right-2 lg:hidden">
                            <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <ScrollArea className="h-full w-full px-4 py-6 space-y-6">

                            {/* 1. Live Monitor (Gauges) */}
                            <LiveMonitorCard watch={watch} aiRisk={aiRisk} />

                            {/* 2. Contextual Tools (change based on step) */}
                            <div className="mt-6">
                                <ContextualTools activeStep={activeStep} watch={watch} />
                            </div>

                            {/* 3. AI Copilot */}
                            <div className="mt-6">
                                <AIPilotWidget
                                    isValidating={isValidating}
                                    isSummarizing={isSummarizing}
                                    aiAlerts={aiAlerts}
                                    onAiCheck={onAiCheck}
                                    onGenerateSummary={onGenerateSummary}
                                />
                            </div>

                            {/* Unsaved Changes Indicator */}
                            {isDirty && (
                                <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 animate-pulse">
                                    <div className="h-2 w-2 bg-amber-500 rounded-full" />
                                    <span className="text-xs font-medium text-amber-700">Sauvegarde auto en cours...</span>
                                </div>
                            )}

                        </ScrollArea>
                    </>
                )}
            </div>

            {/* Desktop Collapse Toggle (Optional, maybe keep it always open on desktop for now) */}
        </aside>
    );
}
