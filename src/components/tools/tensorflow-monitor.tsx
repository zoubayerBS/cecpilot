'use client';

import * as React from 'react';
import * as tf from '@tensorflow/tfjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Cpu, Database, Play, RotateCw, Loader2, Sparkles } from 'lucide-react';
import { getTrainingData } from '@/services/training-data';
import { aiPredictionService } from '@/services/ai-prediction';

export function TensorFlowMonitor() {
    const [backend, setBackend] = React.useState<string>('unknown');
    const [memoryInfo, setMemoryInfo] = React.useState<{ numBytes: number; numTensors: number, numDataBuffers: number }>({ numBytes: 0, numTensors: 0, numDataBuffers: 0 });
    const [isTraining, setIsTraining] = React.useState(false);
    const [epoch, setEpoch] = React.useState(0);
    const [loss, setLoss] = React.useState<number | null>(null);
    const [lossHistory, setLossHistory] = React.useState<number[]>([]);

    // Clinical Training State
    const [isClinicalTraining, setIsClinicalTraining] = React.useState(false);
    const [clinicalStats, setClinicalStats] = React.useState<{ accuracy: number; loss: number } | null>(null);

    const refreshStats = React.useCallback(() => {
        setBackend(tf.getBackend());
        const mem = tf.memory();
        setMemoryInfo({
            numBytes: mem.numBytes,
            numTensors: mem.numTensors,
            numDataBuffers: mem.numDataBuffers
        });
    }, []);

    React.useEffect(() => {
        refreshStats();
        const interval = setInterval(refreshStats, 2000);
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
                    await new Promise(resolve => setTimeout(resolve, 100));
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
        setClinicalStats(null);

        try {
            // 1. Fetch Data
            const data = await getTrainingData();
            console.log(`Fetched ${data.length} records for training.`);

            if (data.length < 5) {
                alert("Pas assez de données pour l'entraînement (min 5 rapports requis). Créez plus de comptes rendus.");
                setIsClinicalTraining(false);
                return;
            }

            // 2. Train
            const result = await aiPredictionService.trainWithHistory(data);
            setClinicalStats(result);

        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'entraînement.");
        } finally {
            setIsClinicalTraining(false);
            refreshStats();
        }
    };

    const handleBootstrap = async () => {
        setIsClinicalTraining(true);
        try {
            const result = await aiPredictionService.bootstrapBaseline();
            setClinicalStats(result);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'initialisation de la maturité.");
        } finally {
            setIsClinicalTraining(false);
            refreshStats();
        }
    };

    // Calculate memory in MB
    const memoryMB = (memoryInfo.numBytes / 1024 / 1024).toFixed(2);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Cpu className="h-4 w-4" /> Backend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{backend}</div>
                        <p className="text-xs text-muted-foreground">Moteur de calcul actif</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Database className="h-4 w-4" /> Mémoire
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{memoryMB} MB</div>
                        <div className="flex gap-4 mt-1">
                            <p className="text-xs text-muted-foreground">{memoryInfo.numTensors} Tenseurs</p>
                            <p className="text-xs text-muted-foreground">{memoryInfo.numDataBuffers} Buffers</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Zone d'Entraînement de Démonstration
                    </CardTitle>
                    <CardDescription>
                        Entraînement en temps réel d'un modèle de régression linéaire (y = 2x - 1) dans le navigateur.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-sm font-medium">Status:
                                <Badge variant={isTraining ? "default" : "secondary"} className="ml-2">
                                    {isTraining ? "En cours d'apprentissage..." : "En attente"}
                                </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">Époque: {epoch} / 50</div>
                            <div className="text-sm text-muted-foreground">Perte (Loss): {loss?.toFixed(4) ?? 'N/A'}</div>
                        </div>
                        <Button onClick={trainModel} disabled={isTraining}>
                            {isTraining ? <RotateCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Lancer le Test
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progression</span>
                            <span>{Math.round((epoch / 50) * 100)}%</span>
                        </div>
                        <Progress value={(epoch / 50) * 100} />
                    </div>

                    {lossHistory.length > 0 && (
                        <div className="h-32 w-full bg-muted/20 rounded-md p-2 flex items-end gap-1 overflow-hidden border">
                            {lossHistory.map((val, i) => {
                                // Normalize height for visualization
                                const max = Math.max(...lossHistory);
                                const height = (val / max) * 100;
                                return (
                                    <div
                                        key={i}
                                        className="bg-primary/50 hover:bg-primary transition-all w-full"
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                        title={`Epoch ${i}: ${val}`}
                                    />
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBootstrap}
                    disabled={isClinicalTraining}
                    className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Renforcer la Maturité Clinique
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClinicalStats({ accuracy: 0, loss: 0 })}
                    disabled={isTraining}
                >
                    Réinitialiser
                </Button>
            </div>

            <Card className="border-primary/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        Apprentissage Clinique (Données Réelles)
                    </CardTitle>
                    <CardDescription>
                        Entraîner le modèle prédictif sur l'historique complet des comptes rendus CEC.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-sm font-medium">État:
                                <Badge variant={isClinicalTraining ? "default" : "outline"} className="ml-2">
                                    {isClinicalTraining ? "Entraînement en cours..." : "Prêt"}
                                </Badge>
                            </div>
                            {clinicalStats && (
                                <>
                                    <div className="text-sm font-semibold text-green-600">Précision Finale: {(clinicalStats.accuracy * 100).toFixed(1)}%</div>
                                    <div className="text-xs text-muted-foreground">Perte Finale: {clinicalStats.loss.toFixed(4)}</div>
                                </>
                            )}
                        </div>
                        <Button onClick={trainClinicalModel} disabled={isClinicalTraining}>
                            {isClinicalTraining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                            Charger l'historique et Entraîner
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
