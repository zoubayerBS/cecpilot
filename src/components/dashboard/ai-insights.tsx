"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, Loader2, Sparkles, AlertCircle, CheckCircle2, Info, Lightbulb } from "lucide-react";
import { getDashboardInsights } from "@/app/actions/knowledge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Insight {
    category: string;
    level: 'info' | 'warning' | 'success';
    title: string;
    content: string;
}

export function DashboardAiInsights({ reports }: { reports: any[] }) {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadInsights() {
            if (!reports || reports.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const result = await getDashboardInsights(reports);
                if (result.success && result.data?.insights) {
                    setInsights(result.data.insights);
                } else {
                    setError(result.error || "Impossible d'analyser les données.");
                }
            } catch (e) {
                setError("Erreur de connexion à l'IA.");
            } finally {
                setLoading(false);
            }
        }

        loadInsights();
    }, [reports]);

    if (!reports || reports.length === 0) return null;

    return (
        <Card className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-900/50 dark:to-slate-950 border-indigo-100 dark:border-indigo-900 overflow-hidden shadow-md">
            <CardHeader className="border-b border-indigo-100/50 dark:border-indigo-900/50 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <BrainCircuit className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Perspectives IA Globales</CardTitle>
                            <CardDescription>Analyse stratégique basée sur vos 10 derniers cas</CardDescription>
                        </div>
                    </div>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                    {!loading && <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />}
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        <p className="text-sm text-muted-foreground animate-pulse">L'IA analyse vos tendances cliniques...</p>
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                ) : insights.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm italic">
                        Aucun insight particulier détecté pour le moment. Votre activité semble stable.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {insights.map((insight, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "p-4 rounded-xl border transition-all hover:shadow-sm",
                                    insight.level === 'warning' ? "bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30" :
                                        insight.level === 'success' ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30" :
                                            "bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30"
                                )}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px] uppercase tracking-wider font-bold",
                                            insight.level === 'warning' ? "border-amber-200 text-amber-700 bg-amber-100/50 dark:text-amber-400" :
                                                insight.level === 'success' ? "border-emerald-200 text-emerald-700 bg-emerald-100/50 dark:text-emerald-400" :
                                                    "border-blue-200 text-blue-700 bg-blue-100/50 dark:text-blue-400"
                                        )}
                                    >
                                        {insight.category}
                                    </Badge>
                                    {insight.level === 'warning' ? <AlertCircle className="h-4 w-4 text-amber-600" /> :
                                        insight.level === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> :
                                            <Lightbulb className="h-4 w-4 text-blue-600" />}
                                </div>
                                <h4 className="font-bold text-sm mb-1">{insight.title}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed italic">
                                    "{insight.content}"
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
