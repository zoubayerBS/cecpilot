"use client";

import { useMemo } from "react";
import { CecReport } from "@/services/cec";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, User, Stethoscope } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

export function PriorityFiles({ reports }: { reports: CecReport[] }) {
    const priorityReports = useMemo(() => {
        return reports
            .filter(r => r.updatedAt) // Ensure we have update time
            .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
            .slice(0, 3)
            .map(r => {
                // Calculate completion score (0-100)
                let score = 0;
                if (r.nom_prenom) score += 20;
                if (r.operateur) score += 15;
                if (r.oxygenateur) score += 15;
                if (r.duree_cec) score += 15;
                if (r.bloodGases && r.bloodGases.length > 0) score += 15;
                if (r.observations) score += 20;

                return { ...r, completion: score };
            });
    }, [reports]);

    if (priorityReports.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    Dossiers Prioritaires
                </h2>
                <span className="text-xs text-muted-foreground italic">Reprenez là où vous vous êtes arrêté</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {priorityReports.map((report) => (
                    <Card key={report.id} className="relative group transition-all hover:border-indigo-200 hover:shadow-md h-full flex flex-col">
                        <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm font-bold truncate">
                                        {report.nom_prenom || "Patient anonyme"}
                                    </CardTitle>
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                        <User className="h-3 w-3" />
                                        Matricule: {report.matricule || "N/A"}
                                    </p>
                                </div>
                                <div className="text-[10px] font-medium text-slate-400">
                                    {report.updatedAt ? formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true, locale: fr }) : ""}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex-grow">
                            <div className="space-y-4">
                                <div className="flex items-start gap-2">
                                    <Stethoscope className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic leading-relaxed">
                                        {report.intervention || "Aucune intervention spécifiée"}
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="font-semibold uppercase text-slate-400">Complétion</span>
                                        <span className="font-bold text-indigo-600">{report.completion}%</span>
                                    </div>
                                    <Progress value={report.completion} className="h-1.5" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2 pb-4">
                            <Button asChild variant="outline" size="sm" className="w-full group-hover:bg-indigo-600 group-hover:text-white transition-colors border-dashed">
                                <Link href={`/compte-rendu/${report.id}?mode=edit`}>
                                    Détails & Reprendre
                                    <ArrowRight className="ml-2 h-3 w-3" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
