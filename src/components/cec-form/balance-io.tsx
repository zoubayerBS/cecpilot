
"use client";

import * as React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { type CecFormValues } from './schema';
import { Scale, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Info } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';

import { aiPredictionService } from '@/services/ai-prediction';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";

export function BalanceIO() {
    const { control, setValue } = useFormContext<CecFormValues>();

    const totalEntrees = useWatch({ control, name: 'total_entrees' }) || 0;
    const totalSorties = useWatch({ control, name: 'total_sorties' }) || 0;

    const grandTotal = totalEntrees + totalSorties;
    const entreesPercentage = grandTotal > 0 ? (totalEntrees / grandTotal) * 100 : 0;
    const sortiesPercentage = grandTotal > 0 ? (totalSorties / grandTotal) * 100 : 0;

    // AI Analysis
    const [balanceAnalysis, setBalanceAnalysis] = React.useState<{ suggestion: string, status: string, balance: number } | null>(null);

    React.useEffect(() => {
        const runAnalysis = async () => {
            if (totalEntrees > 0 || totalSorties > 0) {
                const analysis = await aiPredictionService.analyzeBalance({
                    totalEntrees,
                    totalSorties
                });
                setBalanceAnalysis(analysis);
            } else {
                setBalanceAnalysis(null);
            }
        };
        runAnalysis();
    }, [totalEntrees, totalSorties]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Scale />
                    Bilan Entrées / Sorties
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Entrées (Inputs) */}
                    <div className="space-y-4 rounded-xl border-l-4 border-green-500 bg-green-50/10 dark:bg-green-950/5 p-4 transition-all hover:shadow-md">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                                <ArrowUpCircle className="h-6 w-6" />
                            </div>
                            <h3 className="font-bold text-lg text-green-700 dark:text-green-400">Entrées (Inputs)</h3>
                        </div>
                        <Table>
                            <TableBody>
                                <TableRow className="border-green-100/50 hover:bg-green-50/20">
                                    <TableCell className="font-medium py-3 text-green-900/80 dark:text-green-200/80">Apports anesthésiques</TableCell>
                                    <TableCell className="w-[140px]">
                                        <FormField
                                            control={control}
                                            name="entrees_apports_anesthesiques"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                                                                className="pr-10 bg-white/50 dark:bg-black/20 border-green-200 focus:border-green-500 focus:ring-green-500 transition-all font-semibold"
                                                            />
                                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] font-bold text-green-600 opacity-60">ml</span>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow className="border-green-100/50 hover:bg-green-50/20">
                                    <TableCell className="font-medium py-3 text-green-900/80 dark:text-green-200/80">Priming & Remplissage</TableCell>
                                    <TableCell>
                                        <FormField
                                            control={control}
                                            name="entrees_priming"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Input readOnly type="number" {...field} value={field.value ?? ''} className="pr-10 bg-muted/50 border-transparent font-semibold italic cursor-help" title="Calculé depuis l'onglet Matériel" />
                                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] font-bold text-muted-foreground opacity-60">ml</span>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow className="border-green-100/50 hover:bg-green-50/20">
                                    <TableCell className="font-medium py-3 text-green-900/80 dark:text-green-200/80">Cardioplégie</TableCell>
                                    <TableCell>
                                        <FormField
                                            control={control}
                                            name="entrees_cardioplegie"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input readOnly type="number" {...field} value={field.value ?? ''} className="pr-10 bg-muted/50 border-transparent font-semibold italic" />
                                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] font-bold text-muted-foreground opacity-60">ml</span>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Sorties (Outputs) */}
                    <div className="space-y-4 rounded-xl border-l-4 border-blue-500 bg-blue-50/10 dark:bg-blue-950/5 p-4 transition-all hover:shadow-md">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                <ArrowDownCircle className="h-6 w-6" />
                            </div>
                            <h3 className="font-bold text-lg text-blue-700 dark:text-blue-400">Sorties (Outputs)</h3>
                        </div>
                        <Table>
                            <TableBody>
                                <TableRow className="border-blue-100/50 hover:bg-blue-50/20">
                                    <TableCell className="font-medium py-3 text-blue-900/80 dark:text-blue-200/80">Diurèse cumulative</TableCell>
                                    <TableCell className="w-[140px]">
                                        <FormField
                                            control={control}
                                            name="sorties_diurese"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input readOnly type="number" {...field} value={field.value ?? ''} className="pr-10 bg-muted/50 border-transparent font-semibold italic" />
                                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] font-bold text-muted-foreground opacity-60">ml</span>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow className="border-blue-100/50 hover:bg-blue-50/20">
                                    <TableCell className="font-medium py-3 text-blue-900/80 dark:text-blue-200/80">Hémofiltration</TableCell>
                                    <TableCell>
                                        <FormField control={control} name="sorties_hemofiltration" render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                                                            className="pr-10 bg-white/50 dark:bg-black/20 border-blue-200 focus:border-blue-500 focus:ring-blue-500 transition-all font-semibold"
                                                        />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] font-bold text-blue-600 opacity-60">ml</span>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </TableCell>
                                </TableRow>
                                <TableRow className="border-blue-100/50 hover:bg-blue-50/20">
                                    <TableCell className="font-medium py-3 text-blue-900/80 dark:text-blue-200/80">Aspiration perdue</TableCell>
                                    <TableCell>
                                        <FormField control={control} name="sorties_aspiration_perdue" render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} className="pr-10 bg-white/50 dark:bg-black/20 border-blue-200 focus:border-blue-500 transition-all font-semibold" />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] font-bold text-blue-600 opacity-60">ml</span>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </TableCell>
                                </TableRow>
                                <TableRow className="border-blue-100/50 hover:bg-blue-50/20">
                                    <TableCell className="font-medium py-3 text-blue-900/80 dark:text-blue-200/80">Sang pompe résiduel</TableCell>
                                    <TableCell>
                                        <FormField control={control} name="sorties_sang_pompe_residuel" render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} className="pr-10 bg-white/50 dark:bg-black/20 border-blue-200 focus:border-blue-500 transition-all font-semibold" />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] font-bold text-blue-600 opacity-60">ml</span>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-6 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-bold text-lg pt-4">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-green-500/10 dark:bg-green-500/5 p-4 rounded-xl border border-green-200/50">
                            <span className="text-green-700 dark:text-green-400">Total Entrées :</span>
                            <span className="text-2xl tracking-tight">{totalEntrees} <span className="text-sm font-normal">ml</span></span>
                        </div>
                        <Progress value={entreesPercentage} className="h-2.5 bg-green-100 dark:bg-green-900/20 [&>div]:bg-green-500 shadow-sm" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-blue-500/10 dark:bg-blue-500/5 p-4 rounded-xl border border-blue-200/50">
                            <span className="text-blue-700 dark:text-blue-400">Total Sorties :</span>
                            <span className="text-2xl tracking-tight">{totalSorties} <span className="text-sm font-normal">ml</span></span>
                        </div>
                        <Progress value={sortiesPercentage} className="h-2.5 bg-blue-100 dark:bg-blue-900/20 [&>div]:bg-blue-500 shadow-sm" />
                    </div>
                </div>

                <div className={`mt-2 flex flex-col items-center justify-center p-6 rounded-2xl shadow-inner border-2 border-dashed transition-all ${totalEntrees - totalSorties > 1000 ? 'bg-red-50 border-red-200 text-red-900' :
                    totalEntrees - totalSorties < -500 ? 'bg-amber-50 border-amber-200 text-amber-900' :
                        'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Balance Volémique Nette</span>
                    <div className="text-4xl font-black flex items-center gap-2">
                        {totalEntrees - totalSorties > 0 ? '+' : ''}{totalEntrees - totalSorties}
                        <span className="text-xl font-normal opacity-70">ml</span>
                    </div>
                </div>

                {/* AI Balance Analysis */}
                {balanceAnalysis && (
                    <Alert className={`border-l-4 shadow-md ${balanceAnalysis.status === 'overload' || balanceAnalysis.status === 'alert'
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
                        : balanceAnalysis.status === 'positive' || balanceAnalysis.status === 'negative'
                            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                            : 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
                        }`}>
                        <div className="flex items-start gap-4 p-1">
                            <div className={`p-2 rounded-full ${balanceAnalysis.status === 'overload' || balanceAnalysis.status === 'alert' ? 'bg-red-100 text-red-600' :
                                balanceAnalysis.status === 'neutral' ? 'bg-green-100 text-green-600' :
                                    'bg-amber-100 text-amber-600'
                                }`}>
                                <Brain className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <AlertTitle className="flex items-center gap-2 font-bold mb-1">
                                    Analyse Volémique IA
                                    <Badge variant={
                                        balanceAnalysis.status === 'overload' || balanceAnalysis.status === 'alert' ? 'destructive' :
                                            balanceAnalysis.status === 'neutral' ? 'outline' : 'secondary'
                                    } className="ml-auto">
                                        {balanceAnalysis.balance > 0 ? '+' : ''}{balanceAnalysis.balance} ml
                                    </Badge>
                                </AlertTitle>
                                <AlertDescription className="text-sm font-medium opacity-90 leading-relaxed">
                                    {balanceAnalysis.suggestion}
                                </AlertDescription>
                            </div>
                        </div>
                    </Alert>
                )}
            </CardFooter>
        </Card>
    );
}
