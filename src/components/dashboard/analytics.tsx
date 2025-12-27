"use client";

import { useMemo } from "react";
import { CecReport } from "@/services/cec";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";
import { format, parseISO, subMonths, startOfMonth, isAfter, eachMonthOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { repairMissingDurations } from "@/services/cec";
import { Button } from "../ui/button";
import { RefreshCcw, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function DashboardAnalytics({ reports }: { reports: CecReport[] }) {
    const [isRepairing, setIsRepairing] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleRepair = async () => {
        setIsRepairing(true);
        try {
            const result = await repairMissingDurations();
            toast({
                title: "Calcul automatique terminé",
                description: `${result.updated} dossiers mis à jour avec succès.`,
            });
            router.refresh();
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Échec de la mise à jour des historiques.",
                variant: "destructive"
            });
        } finally {
            setIsRepairing(false);
        }
    };

    // 1. Activity Volume (Last 6 months)
    const activityData = useMemo(() => {
        const last6Months = eachMonthOfInterval({
            start: subMonths(new Date(), 5),
            end: new Date()
        });

        return last6Months.map(month => {
            const monthStr = format(month, 'yyyy-MM');
            const count = reports.filter(r => r.date_cec && r.date_cec.startsWith(monthStr)).length;
            return {
                name: format(month, 'MMM', { locale: fr }),
                count: count
            };
        });
    }, [reports]);

    // 2. Surgical Mix (Pie chart)
    const mixData = useMemo(() => {
        const counts: Record<string, number> = {};
        reports.forEach(r => {
            const intervention = r.intervention || "Autre";
            // Simplify intervention names if they are too long
            const shortName = intervention.length > 20 ? intervention.substring(0, 17) + "..." : intervention;
            counts[shortName] = (counts[shortName] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Show top 5
    }, [reports]);

    // 3. Duration Trends (Recent 10 cases)
    const durationTrends = useMemo(() => {
        return reports
            .slice(0, 10)
            .reverse()
            .map(r => {
                const dateVal = r.date_cec || r.createdAt || new Date().toISOString();
                let displayDate = "??";
                try {
                    displayDate = format(parseISO(dateVal), 'dd/MM');
                } catch (e) {
                    displayDate = "??";
                }

                return {
                    date: displayDate,
                    cec: Number(r.duree_cec) || 0,
                    clampage: Number(r.duree_clampage) || 0
                };
            });
    }, [reports]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Chart */}
            <Card className="shadow-sm border-slate-100 dark:border-slate-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Volume d'Activité</CardTitle>
                    <CardDescription>Nombre d'interventions sur les 6 derniers mois</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityData}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Mix Chart */}
            <Card className="shadow-sm border-slate-100 dark:border-slate-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Mix Chirurgical</CardTitle>
                    <CardDescription>Répartition par type d'intervention (Top 5)</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] flex items-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={mixData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {mixData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Duration Trends */}
            <Card className="lg:col-span-2 shadow-sm border-slate-100 dark:border-slate-800">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-sm font-medium">Trends de Durée (10 derniers cas)</CardTitle>
                        <CardDescription>Évolution des temps de CEC et de Clampage (en minutes)</CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRepair}
                        disabled={isRepairing}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors gap-2"
                        title="Recalculer pour tous les dossiers historiques"
                    >
                        {isRepairing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
                        {isRepairing ? "Calcul..." : "Recalculer les historiques"}
                    </Button>
                </CardHeader>
                <CardContent className="h-[300px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={durationTrends}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="cec" name="Durée CEC" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="clampage" name="Durée Clampage" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
