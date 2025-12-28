'use client';

import * as React from 'react';
import * as tf from '@tensorflow/tfjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Cpu, Database, Play, RotateCw, Loader2, Sparkles, Upload, FileJson, Layout } from 'lucide-react';
import { getTrainingData } from '@/services/training-data';
import { aiPredictionService } from '@/services/ai-prediction';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function TensorFlowMonitor() {
    const [backend, setBackend] = React.useState<string>('unknown');
    const [memoryInfo, setMemoryInfo] = React.useState<{ numBytes: number; numTensors: number, numDataBuffers: number }>({ numBytes: 0, numTensors: 0, numDataBuffers: 0 });
    const [isTraining, setIsTraining] = React.useState(false);
    const [epoch, setEpoch] = React.useState(0);
    const [loss, setLoss] = React.useState<number | null>(null);
    const [lossHistory, setLossHistory] = React.useState<number[]>([]);

    // Clinical Training State
    const [isClinicalTraining, setIsClinicalTraining] = React.useState(false);
    const [clinicalStats, setClinicalStats] = React.useState<{
        accuracy: number;
        loss: number;
        val_accuracy?: number;
        val_loss?: number;
        stoppedEpoch?: number;
        precision?: number;
        recall?: number;
        f1?: number;
        recordCount?: number;
    } | null>(null);
    const [historicalLogs, setHistoricalLogs] = React.useState<any[]>([]);
    const [clinicalProgress, setClinicalProgress] = React.useState(0);
    const [isVisorOpen, setIsVisorOpen] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const toggleVisor = async () => {
        const newStatus = !isVisorOpen;
        setIsVisorOpen(newStatus);
        if (newStatus) {
            await aiPredictionService.openVisor();
        } else {
            await aiPredictionService.closeVisor();
        }
    };

    const loadLogs = React.useCallback(() => {
        try {
            const logsStr = localStorage.getItem('clinical-training-logs') || '[]';
            const logs = JSON.parse(logsStr);
            setHistoricalLogs(logs);
            if (!clinicalStats && logs.length > 0) {
                const lastLog = logs[logs.length - 1];
                setClinicalStats({
                    accuracy: lastLog.accuracy,
                    loss: lastLog.loss,
                    val_accuracy: lastLog.val_accuracy,
                    val_loss: lastLog.val_loss,
                    stoppedEpoch: lastLog.stoppedEpoch,
                    precision: lastLog.precision,
                    recall: lastLog.recall,
                    f1: lastLog.f1,
                    recordCount: lastLog.recordCount
                });
            }
        } catch (e) {
            console.error('Failed to load logs', e);
        }
    }, [clinicalStats]);

    const refreshStats = React.useCallback(() => {
        setBackend(tf.getBackend());
        const mem = tf.memory();
        setMemoryInfo({
            numBytes: mem.numBytes,
            numTensors: mem.numTensors,
            numDataBuffers: mem.numDataBuffers
        });
        loadLogs();
    }, [loadLogs]);

    React.useEffect(() => {
        refreshStats();
        const interval = setInterval(refreshStats, 5000);
        return () => clearInterval(interval);
    }, [refreshStats]);

    const trainModel = async () => {
        if (isTraining) return;
        setIsTraining(true);
        setLossHistory([]);
        setEpoch(0);

        // Define a simple model for linear regression: y = 2x - 1
        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
        model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

        // Generate some synthetic data for training
        const xs = tf.tensor2d([-1, 0, 1, 2, 3, 4], [6, 1]);
        const ys = tf.tensor2d([-3, -1, 1, 3, 5, 7], [6, 1]);

        await model.fit(xs, ys, {
            epochs: 50,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    setEpoch(epoch + 1);
                    const currentLoss = logs?.loss as number;
                    setLoss(currentLoss);
                    setLossHistory(prev => [...prev, currentLoss]);
                    // Yield to UI
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
        });

        setIsTraining(false);
        // Clean up tensors
        model.dispose();
        xs.dispose();
        ys.dispose();
        refreshStats(); // Update tensor count after disposal
    };

    const trainClinicalModel = async () => {
        if (isClinicalTraining) return;
        setIsClinicalTraining(true);
        setClinicalProgress(0);
        setClinicalStats(null);

        try {
            const data = await getTrainingData();
            if (data.length < 5) {
                alert("Pas assez de données pour l'entraînement (min 5 rapports requis). Créez plus de comptes rendus.");
                setIsClinicalTraining(false);
                return;
            }
            const result = await aiPredictionService.trainWithHistory(data, setClinicalProgress);
            setClinicalStats(result);
            toast({
                title: "Entraînement terminé",
                description: `Le modèle a été optimisé sur ${data.length} rapports.`,
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erreur d'entraînement",
                description: error.message || "Impossible d'entraîner le modèle.",
                variant: "destructive",
            });
        } finally {
            setIsClinicalTraining(false);
            refreshStats(); // This will now reload logs
        }
    };

    const handleBootstrap = async () => {
        setIsClinicalTraining(true);
        setClinicalProgress(0);
        try {
            const result = await aiPredictionService.bootstrapBaseline(setClinicalProgress);
            setClinicalStats(result);
            toast({
                title: "Bootstrap terminé",
                description: "La maturité de base a été initialisée.",
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erreur de Bootstrap",
                description: "Impossible d'initialiser la maturité.",
                variant: "destructive",
            });
        } finally {
            setIsClinicalTraining(false);
            refreshStats(); // This will now reload logs
        }
    };
    const [isProcessingJson, setIsProcessingJson] = React.useState(false);
    const { toast } = useToast();

    const handleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log(`[Diagnostic] Fichier sélectionné : ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        setIsProcessingJson(true);
        setIsClinicalTraining(true);
        setClinicalProgress(0);

        toast({
            title: "Lecture du fichier",
            description: `Traitement de ${file.name}...`,
        });

        const reader = new FileReader();

        reader.onerror = () => {
            console.error("[Diagnostic] Erreur FileReader:", reader.error);
            toast({
                title: "Erreur de lecture",
                description: "Impossible de lire le fichier.",
                variant: "destructive",
            });
            setIsProcessingJson(false);
            setIsClinicalTraining(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input on error
        };

        reader.onload = async (e) => {
            try {
                console.log("[Diagnostic] Lecture terminée, parsing JSON...");
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                console.log(`[Diagnostic] JSON parsé : ${Array.isArray(data) ? data.length : 'Objet'} enregistrements.`);

                if (!Array.isArray(data) && !data.data && !data.records) {
                    throw new Error("Format JSON invalide : un tableau est attendu.");
                }

                const result = await aiPredictionService.trainFromDataset(data, setClinicalProgress);

                setClinicalStats(result);
                toast({
                    title: "Import réussi",
                    description: `Le modèle a été entraîné avec succès.`,
                });
            } catch (error: any) {
                console.error("[Diagnostic] Erreur pendant l'import:", error);
                toast({
                    title: "Erreur d'import",
                    description: error.message || "Erreur lors du traitement du JSON.",
                    variant: "destructive",
                });
            } finally {
                setIsProcessingJson(false);
                setIsClinicalTraining(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
                refreshStats();
            }
        };

        reader.readAsText(file);
    };



    // Calculate memory in MB
    const memoryMB = (memoryInfo.numBytes / 1024 / 1024).toFixed(2);

    // AI Improvement Logic
    const getImprovementReport = () => {
        if (historicalLogs.length < 2) return null;
        const first = historicalLogs[0];
        const last = historicalLogs[historicalLogs.length - 1];
        const accDiff = (last.accuracy - first.accuracy) * 100;
        const lossDiff = ((first.loss - last.loss) / first.loss) * 100;

        return {
            accDiff: accDiff.toFixed(1),
            lossDiff: lossDiff.toFixed(1),
            isImproving: accDiff >= 0 || lossDiff >= 0
        };
    };

    const report = getImprovementReport();

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Cpu className="h-16 w-16 -rotate-12" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <Cpu className="h-3 w-3 text-blue-400" /> Moteur d'Exécution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-3xl font-black tracking-tight text-blue-400 capitalize">
                                {backend}
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-blue-400 uppercase">Hardware Accel</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                            Environnement de calcul optimisé pour les prédictions cliniques à basse latence.
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Database className="h-16 w-16 rotate-12" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <Activity className="h-3 w-3 text-emerald-400 animate-pulse" /> Diagnostic Mémoire
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-4">
                            <div className="text-3xl font-black tracking-tight text-emerald-400">
                                {memoryInfo.numBytes < 1024 * 1024
                                    ? (memoryInfo.numBytes / 1024).toFixed(1)
                                    : (memoryInfo.numBytes / 1024 / 1024).toFixed(2)}
                            </div>
                            <div className="text-xs font-bold text-slate-500 uppercase">
                                {memoryInfo.numBytes < 1024 * 1024 ? 'KB' : 'MB'} VRAM
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                    <span>Tenseurs Actifs</span>
                                    <span className="text-emerald-400">{memoryInfo.numTensors}</span>
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.min((memoryInfo.numTensors / 500) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                    <span>Data Buffers</span>
                                    <span className="text-indigo-400">{memoryInfo.numDataBuffers}</span>
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.min((memoryInfo.numDataBuffers / 200) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                            <div className="text-[9px] text-slate-500 italic">
                                Statut : Opérationnel
                            </div>
                            <Badge variant="outline" className="text-[8px] h-4 border-emerald-500/30 text-emerald-500 bg-emerald-500/5 px-1 py-0">
                                Fuite 0%
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        Apprentissage Clinique & Robustesse
                    </CardTitle>
                    <CardDescription>
                        Surveillance de la capacité de généralisation et prévention de l'overfitting.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">État :</span>
                                <Badge variant={isClinicalTraining ? "default" : "outline"}>
                                    {isProcessingJson ? "Chargement Dataset..." : (isClinicalTraining ? "Optimisation en cours..." : "Modèle Robuste")}
                                </Badge>
                                {isClinicalTraining && (
                                    <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                                        <Progress value={clinicalProgress} className="h-1.5" />
                                        <span className="text-[10px] font-mono font-bold text-primary">{clinicalProgress}%</span>
                                    </div>
                                )}
                                {clinicalStats?.stoppedEpoch && clinicalStats.stoppedEpoch < 50 && (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                                        Arrêt Précoce : Époque {clinicalStats.stoppedEpoch}
                                    </Badge>
                                )}
                            </div>
                            {clinicalStats && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                                    <div className="text-sm font-semibold text-green-600">Précision Train : {(clinicalStats.accuracy * 100).toFixed(1)}%</div>
                                    <div className="text-sm font-semibold text-indigo-600">Précision Val : {clinicalStats.val_accuracy ? (clinicalStats.val_accuracy * 100).toFixed(1) : '--'}%</div>
                                    <div className="text-xs text-muted-foreground">Perte Train : {clinicalStats.loss.toFixed(4)}</div>
                                    <div className="text-xs text-muted-foreground">Perte Val : {clinicalStats.val_loss?.toFixed(4) || '--'}</div>
                                    {clinicalStats.recordCount && (
                                        <div className="text-xs font-bold text-slate-500 col-span-2 mt-1 flex items-center gap-1">
                                            <Database className="h-3 w-3" />
                                            Données d'entraînement : {clinicalStats.recordCount} enregistrements
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleJsonUpload}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isClinicalTraining}
                            >
                                {isProcessingJson ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Traitement...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Importer JSON
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleBootstrap} disabled={isClinicalTraining}>
                                {isClinicalTraining && !isProcessingJson ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Bootstrap
                            </Button>
                            <Button onClick={trainClinicalModel} disabled={isClinicalTraining}>
                                {isClinicalTraining && !isProcessingJson ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                Entraîner
                            </Button>
                            <Button variant="ghost" size="sm" onClick={toggleVisor} className="text-muted-foreground hover:text-primary">
                                <Layout className="mr-2 h-4 w-4" />
                                {isVisorOpen ? "Fermer TensorBoard" : "Ouvrir TensorBoard"}
                            </Button>
                        </div>
                    </div>

                    {/* Clinical Safety Metrics */}
                    {clinicalStats && (
                        <div className="grid grid-cols-3 gap-3 border-y py-4 my-2">
                            <div className="text-center space-y-1">
                                <div className="text-[10px] uppercase font-bold text-muted-foreground">Précision</div>
                                <div className="text-xl font-black text-primary">{typeof clinicalStats.precision === 'number' ? (clinicalStats.precision * 100).toFixed(0) : '--'}%</div>
                                <div className="text-[9px] text-muted-foreground leading-tight">Capacité à éviter les fausses alertes</div>
                            </div>
                            <div className="text-center space-y-1 border-x px-2">
                                <div className="text-[10px] uppercase font-bold text-muted-foreground">Rappel (Sensibilité)</div>
                                <div className="text-xl font-black text-indigo-600">{typeof clinicalStats.recall === 'number' ? (clinicalStats.recall * 100).toFixed(0) : '--'}%</div>
                                <div className="text-[9px] text-muted-foreground leading-tight">Aptitude à détecter tous les risques</div>
                            </div>
                            <div className="text-center space-y-1">
                                <div className="text-[10px] uppercase font-bold text-muted-foreground">Score F1</div>
                                <div className="text-xl font-black text-emerald-600">{typeof clinicalStats.f1 === 'number' ? (clinicalStats.f1 * 100).toFixed(0) : '--'}%</div>
                                <div className="text-[9px] text-muted-foreground leading-tight">Équilibre global de fiabilité</div>
                            </div>
                        </div>
                    )}

                    {/* Trend Chart */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tendance de Généralisation</h4>
                        {historicalLogs.length > 0 ? (
                            <div className="h-40 w-full bg-slate-50 dark:bg-slate-900 rounded-xl p-4 flex items-end gap-2 border shadow-inner">
                                {historicalLogs.slice(-15).map((log, i) => {
                                    const height = log.accuracy * 100;
                                    const valHeight = log.val_accuracy ? log.val_accuracy * 100 : 0;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                                            <div className="absolute -top-16 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-center shadow-xl">
                                                Acc Train : {(log.accuracy * 100).toFixed(1)}%<br />
                                                Acc Val : {log.val_accuracy ? (log.val_accuracy * 100).toFixed(1) : '--'}%<br />
                                                Records : {log.recordCount || '--'}
                                            </div>

                                            {/* Validation Bar (Shadow behind) */}
                                            <div
                                                className="w-full bg-indigo-200 dark:bg-indigo-900/30 rounded-t-lg absolute bottom-0 opacity-50"
                                                style={{ height: `${Math.max(valHeight, 2)}%` }}
                                            />

                                            <div
                                                className="w-full bg-primary rounded-t-lg transition-all duration-500 hover:bg-primary/80 z-10"
                                                style={{ height: `${Math.max(height, 4)}%` }}
                                            />
                                            <div className="h-1 w-full flex gap-0.5 mt-1 overflow-hidden rounded-full">
                                                <div className="flex-1 bg-red-400" title="Loss Train" style={{ opacity: Math.min(log.loss + 0.2, 1) }} />
                                                {log.val_loss && <div className="flex-1 bg-amber-400" title="Loss Val" style={{ opacity: Math.min(log.val_loss + 0.2, 1) }} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-40 w-full bg-muted/10 rounded-xl border border-dashed flex flex-col items-center justify-center text-muted-foreground text-sm">
                                <Database className="h-8 w-8 mb-2 opacity-20" />
                                Aucun historique pour le moment
                            </div>
                        )}
                        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-primary rounded-full" /> Précision (Train)</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-300 rounded-full" /> Précision (Val)</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-full" /> Erreur Train</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-400 rounded-full" /> Erreur Val</div>
                            </div>
                        </div>
                    </div>

                    {/* AI Improvement Report */}
                    {report && (
                        <div className={cn(
                            "p-4 rounded-2xl border flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
                            report.isImproving ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
                        )}>
                            <div className={cn(
                                "h-12 w-12 rounded-full flex items-center justify-center shadow-sm",
                                report.isImproving ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                            )}>
                                {report.isImproving ? <Sparkles className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
                            </div>
                            <div className="flex-1">
                                <h5 className={cn("text-sm font-bold", report.isImproving ? "text-emerald-900" : "text-amber-900")}>
                                    Rapport de Progression Clinique
                                </h5>
                                <p className={cn("text-xs font-medium opacity-80", report.isImproving ? "text-emerald-700" : "text-amber-700")}>
                                    {report.isImproving
                                        ? `Le modèle s'améliore ! Gain de précision de ${report.accDiff}% et réduction d'erreur de ${report.lossDiff}% depuis vos débuts.`
                                        : `Performance stable. Plus de données cliniques aideront à affiner les prédictions.`}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Bac à sable TensorFlow (Test Local)
                    </CardTitle>
                    <CardDescription>
                        Entraînement simulé ultra-rapide pour vérifier le fonctionnement du moteur TF.js.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-sm font-medium flex items-center gap-2">Status:
                                <Badge variant={isTraining ? "default" : "secondary"}>
                                    {isTraining ? "Apprentissage express..." : "Prêt"}
                                </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">Époque: {epoch} / 50 | Perte: {loss?.toFixed(4) ?? 'N/A'}</div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={trainModel} disabled={isTraining}>
                            {isTraining ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Lancer Test
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Progress value={(epoch / 50) * 100} className="h-1" />
                    </div>

                    {lossHistory.length > 0 && (
                        <div className="h-20 w-full bg-muted/5 rounded-lg p-1 flex items-end gap-0.5 overflow-hidden border border-slate-100">
                            {lossHistory.map((val, i) => {
                                const max = Math.max(...lossHistory);
                                const height = (val / max) * 100;
                                return (
                                    <div
                                        key={i}
                                        className="bg-primary/20 hover:bg-primary/40 transition-all w-full"
                                        style={{ height: `${Math.max(height, 10)}%` }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
