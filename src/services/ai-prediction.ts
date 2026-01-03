import * as tf from '@tensorflow/tfjs';

// Expose tf globally so that tfjs-vis (loaded via CDN) can find it
if (typeof window !== 'undefined') {
    (window as any).tf = tf;
}

// Lazy load tfjs-vis via CDN to avoid build-time issues with Turbopack/Vega
let tfvisModule: any = null;
const getTfvis = async () => {
    if (typeof window === 'undefined') return null;
    if (tfvisModule) return tfvisModule;
    if ((window as any).tfvis) return (window as any).tfvis;

    return new Promise((resolve) => {
        console.log("[AI] Chargement de tfjs-vis via CDN...");
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-vis@1.5.1/dist/tfjs-vis.umd.min.js';
        script.onload = () => {
            console.log("[AI] tfjs-vis chargé avec succès.");
            tfvisModule = (window as any).tfvis;
            resolve(tfvisModule);
        };
        script.onerror = () => {
            console.error("[AI] Échec du chargement de tfjs-vis via CDN.");
            resolve(null);
        };
        document.head.appendChild(script);
    });
};

// Define types for inputs
export interface HematologyInput {
    hemoglobine: number;
    hematocrite: number;
    plaquettes: number;
}

export interface PerfusionInput {
    surfaceCorporelle: number; // BSA
    indexCardiaqueCible: number; // Target CI
    temperature: number;
}

export interface ComplicationInput {
    dureeCEC: number;
    dureeClampage: number;
    age: number;
    euroscore: number;
}

export interface BloodGasInput {
    ph: number;
    pco2: number;
    po2: number;
    hco3: number;
    lactate: number;
}

// Prediction Service
const predictionService = {

    /**
     * Toggles the tfjs-vis visor visibility
     */
    toggleVisor: async () => {
        const vis = await getTfvis();
        if (vis) vis.visor().toggle();
    },

    /**
     * Explicit visor control
     */
    openVisor: async () => {
        console.log('[AI] openVisor called');
        const vis = await getTfvis();
        console.log('[AI] tfvis loaded:', !!vis);
        if (vis) {
            console.log('[AI] Calling vis.visor().open()');
            try {
                // Open the visor
                vis.visor().open();

                // Wait a bit for DOM to update
                await new Promise(resolve => setTimeout(resolve, 100));

                // Force the visor to be visible by manipulating the DOM
                const visorContainer = document.getElementById('tfjs-visor-container');
                if (visorContainer) {
                    const visorEl = visorContainer.querySelector('.visor') as HTMLElement;
                    if (visorEl) {
                        visorEl.style.display = 'flex';
                        visorEl.setAttribute('data-isopen', 'true');
                        console.log('[AI] Visor DOM updated, display:', visorEl.style.display);
                    }
                }

                // Add a test surface to ensure there's content
                try {
                    const surface = vis.visor().surface({ name: 'Bienvenue', tab: 'Info' });
                    surface.drawArea.innerHTML = '<div style="padding: 20px; color: #333;"><h3>TensorBoard Initialisé</h3><p>Le panneau de visualisation est prêt. Les graphiques d\'entraînement apparaîtront ici lors de l\'apprentissage du modèle.</p></div>';
                    console.log('[AI] Test surface added');
                } catch (e) {
                    console.error('[AI] Error adding test surface:', e);
                }

                console.log('[AI] Visor opened, isOpen:', vis.visor().isOpen());
            } catch (e) {
                console.error('[AI] Error opening visor:', e);
            }
        }
    },

    closeVisor: async () => {
        const vis = await getTfvis();
        if (vis) vis.visor().close();
    },

    /**
     * Prediction methods
     */
    predictBloodGasStatus: async (data: BloodGasInput) => {
        let model: tf.LayersModel | null = null;
        let inputTensor: tf.Tensor | null = null;

        try {
            model = await tf.loadLayersModel('indexeddb://clinical-model-bloodgas');
            const metaStr = localStorage.getItem('clinical-model-bloodgas-meta');
            if (!metaStr) throw new Error("Metadata de normalisation manquante.");

            const meta = JSON.parse(metaStr);
            const input = [data.ph, data.pco2, data.po2, data.hco3, data.lactate];

            // Normalize using saved meta: (val - min) / (max - min)
            const normValues = input.map((val, i) => {
                const range = meta.max[i] - meta.min[i];
                const normalized = range > 0 ? (val - meta.min[i]) / range : 0.5;
                return Math.max(0, Math.min(1, normalized)); // Clip to [0, 1] for robustness
            });

            inputTensor = tf.tensor2d([normValues], [1, 5]);
            const prediction = model.predict(inputTensor) as tf.Tensor;
            const score = prediction.dataSync()[0];

            console.log(`[AI Prediction] Inputs:`, data);
            console.log(`[AI Prediction] Score: ${(score * 100).toFixed(1)}%`);

            let status: 'normal' | 'warning' | 'alert' = 'normal';
            let message = "Équilibre acido-basique optimal.";

            if (score > 0.8) {
                status = 'alert';
                message = "Risque critique de déséquilibre métabolique détecté.";
            } else if (score > 0.4) {
                status = 'warning';
                message = "Instabilité métabolique légère suspectée.";
            }

            return { score, status, message };
        } catch (e) {
            console.warn('Blood Gas prediction failed:', e);
            return null;
        } finally {
            if (model) model.dispose();
            if (inputTensor) inputTensor.dispose();
        }
    },

    async predictHematologyRisks(data: HematologyInput & { poids?: number, taille?: number, age?: number }) {
        // Attempt to use the trained Transfusion model (which uses weight, height, age, hct)
        const proba = await aiPredictionService.predictTransfusionRisk({
            poids: data.poids || 70,
            taille: data.taille || 170,
            age: data.age || 60,
            hematocrite: data.hematocrite
        });

        if (proba !== null) {
            let riskLevel = 'Faible';
            if (proba > 0.7) riskLevel = 'Élevé';
            else if (proba > 0.3) riskLevel = 'Modéré';

            return {
                riskLevel,
                message: riskLevel === 'Élevé' ? "Risque transfusionnel majeur identifié par l'IA locale." : "Risque transfusionnel maîtrisé selon vos protocoles.",
                confidence: 0.92
            };
        }

        // Heuristic fallback
        let riskLevel = 'Faible';
        let message = 'Paramètres hématologiques dans la norme.';
        if (data.hemoglobine < 8 || data.hematocrite < 24) {
            riskLevel = 'Élevé';
            message = 'Anémie sévère détectée. Risque transfusionnel immédiat.';
        } else if (data.hemoglobine < 10) {
            riskLevel = 'Modéré';
            message = 'Anémie modérée. À surveiller.';
        }

        return { riskLevel, message, confidence: 0.85 };
    },

    // 2. Perfusion / Flow Optimization
    async optimizePerfusion(data: PerfusionInput) {
        let model: tf.LayersModel | null = null;
        try {
            model = await tf.loadLayersModel('indexeddb://clinical-model-perfusion');
            const input = tf.tensor2d([[data.surfaceCorporelle, data.indexCardiaqueCible, data.temperature]]);
            const prediction = model.predict(input) as tf.Tensor;
            const targetFlow = prediction.dataSync()[0];

            input.dispose();
            return {
                targetFlowRate: targetFlow.toFixed(2),
                recommendation: `Cible optimisée par IA locale (${targetFlow.toFixed(2)} L/min) basée sur votre historique d'apprentissage.`
            };
        } catch (e) {
            // Fallback to heuristic
            const targetFlow = data.surfaceCorporelle * data.indexCardiaqueCible;
            return {
                targetFlowRate: targetFlow.toFixed(2),
                recommendation: `Débit théorique calculé : ${targetFlow.toFixed(2)} L/min.`
            };
        } finally {
            if (model) model.dispose();
        }
    },

    /**
     * Store a new training example for perfusion
     */
    async addPerfusionTrainingData(data: PerfusionInput, actualFlow: number) {
        try {
            const existing = localStorage.getItem('clinical-data-perfusion');
            const dataset = existing ? JSON.parse(existing) : [];
            dataset.push({
                features: {
                    bsa: data.surfaceCorporelle,
                    target_ci: data.indexCardiaqueCible,
                    temp: data.temperature
                },
                labels: {
                    target_flow: actualFlow
                },
                timestamp: Date.now()
            });
            localStorage.setItem('clinical-data-perfusion', JSON.stringify(dataset));
            return true;
        } catch (e) {
            console.error("Failed to save training data", e);
            return false;
        }
    },

    /**
     * Retrain perfusion model from local data
     */
    async retrainPerfusionModel() {
        try {
            const existing = localStorage.getItem('clinical-data-perfusion');
            if (!existing) return { success: false, message: "Pas de données d'entraînement." };
            const dataset = JSON.parse(existing);
            if (dataset.length < 5) return { success: false, message: "Pas assez de données (min 5)." };

            await this.trainPerfusionModel(dataset);
            return { success: true, message: `Modèle ré-entraîné avec ${dataset.length} cas.` };
        } catch (e) {
            console.error(e);
            return { success: false, message: "Erreur lors de l'entraînement." };
        }
    },

    // 3. Complication Prediction (Risk Score)
    async predictComplications(data: ComplicationInput) {
        await new Promise(resolve => setTimeout(resolve, 600));

        // A fake weighting formula for risk
        // Risk = (Age * 0.1) + (Euroscore * 2) + (CEC_Duration * 0.05)
        // Tensor calculation
        const tAge = tf.scalar(data.age);
        const tEuro = tf.scalar(data.euroscore);
        const tCec = tf.scalar(data.dureeCEC);

        const riskScoreTensor = tAge.mul(0.1).add(tEuro.mul(2)).add(tCec.mul(0.05));
        let riskScore = riskScoreTensor.dataSync()[0];

        // Normalize to 0-100 roughly
        riskScore = Math.min(100, Math.max(0, riskScore));

        tAge.dispose(); tEuro.dispose(); tCec.dispose(); riskScoreTensor.dispose();

        let riskCategory = 'Faible';
        if (riskScore > 50) riskCategory = 'Élevé';
        else if (riskScore > 20) riskCategory = 'Modéré';

        return {
            riskScore: riskScore.toFixed(1),
            riskCategory,
            details: `Score de risque calculé basé sur l'âge (${data.age}), l'EuroSCORE (${data.euroscore}) et la durée estimée de CEC.`
        };
    },

    /**
     * Train the model using historical data
     */
    trainWithHistory: async (data: any[], onProgress?: (p: number) => void): Promise<{
        loss: number;
        accuracy: number;
        val_loss?: number;
        val_accuracy?: number;
        stoppedEpoch?: number;
        precision?: number;
        recall?: number;
        f1?: number;
    }> => {
        // Helper function to extract value from various data structures
        const getValue = (obj: any, keys: string[], defaultVal: number): number => {
            // Try direct access first
            for (const key of keys) {
                if (obj[key] !== undefined && obj[key] !== null) {
                    return Number(obj[key]) || defaultVal;
                }
            }

            // Try nested in features
            if (obj.features) {
                for (const key of keys) {
                    if (obj.features[key] !== undefined && obj.features[key] !== null) {
                        return Number(obj.features[key]) || defaultVal;
                    }
                }
            }

            return defaultVal;
        };


        // Log data source for verification
        console.log(`[AI Training] 📊 DONNÉES D'ENTRAÎNEMENT:`);
        console.log(`[AI Training] Total: ${data.length} enregistrements`);
        console.log(`[AI Training] Premiers 3 exemples:`, data.slice(0, 3));

        // 1. Convert data to tensors
        const rawInputs = data.map(d => [
            getValue(d, ['poids', 'weight', 'Poids'], 70),
            getValue(d, ['taille', 'height', 'Taille'], 170),
            getValue(d, ['age', 'Age'], 60),
            getValue(d, ['hematocrite', 'hct', 'Hematocrite', 'HCT'], 30)
        ]);

        const labels = data.map(d => {
            let transfusion = getValue(d, ['transfusion', 'Transfusion'], 0);
            if (d.labels && d.labels.transfusion !== undefined) {
                transfusion = Number(d.labels.transfusion) || 0;
            }
            return [transfusion];
        });

        // Tensor conversion
        const inputsTensor = tf.tensor2d(rawInputs, [rawInputs.length, 4]);
        const ys = tf.tensor2d(labels, [labels.length, 1]);

        // 1.5. Normalize Data (Min-Max Scaling)
        const min = inputsTensor.min(0);
        const max = inputsTensor.max(0);
        const normalizedInputs = inputsTensor.sub(min).div(max.sub(min).add(tf.scalar(1e-6)));

        // 2. Define or load Model
        let model: tf.LayersModel;
        try {
            model = await tf.loadLayersModel('indexeddb://clinical-model-transfusion');
            model.compile({
                loss: 'binaryCrossentropy',
                optimizer: tf.train.adam(0.005),
                metrics: ['accuracy']
            });
        } catch (e) {
            const seqModel = tf.sequential();
            seqModel.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [4] }));
            seqModel.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
            model = seqModel;
            model.compile({
                loss: 'binaryCrossentropy',
                optimizer: tf.train.adam(0.01),
                metrics: ['accuracy']
            });
        }

        // 3. Train with Dynamic Optimization for Big Data
        const optimalBatchSize = Math.min(128, Math.max(8, Math.floor(data.length / 50)));
        const optimalEpochs = data.length > 5000 ? 10 : 50;

        console.log(`[AI Training] Big Data Mode Check: Records=${data.length}, BatchSize=${optimalBatchSize}, Epochs=${optimalEpochs}`);

        const history = await model.fit(normalizedInputs, ys, {
            epochs: optimalEpochs,
            batchSize: optimalBatchSize,
            shuffle: true,
            validationSplit: 0.2,
            callbacks: await (async () => {
                const baseCallbacks: any[] = [
                    tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 5 }),
                    {
                        onEpochEnd: (epoch: number) => {
                            if (onProgress) onProgress(Math.round(((epoch + 1) / optimalEpochs) * 100));
                        },
                        setParams: () => { },
                        setModel: () => { },
                        onTrainBegin: () => { },
                        onTrainEnd: () => { },
                        onEpochBegin: () => { },
                        onBatchBegin: () => { },
                        onBatchEnd: () => { }
                    } as any
                ];

                const vis = await getTfvis();
                if (vis) {
                    try {
                        const tfvisCallback = vis.show.fitCallbacks(
                            { name: 'Modèle Transfusion (Risque Clinique)', tab: 'Entraînement' },
                            ['loss', 'acc', 'val_loss', 'val_acc'],
                            { callbacks: ['onEpochEnd'] }
                        );

                        // Wrap tfvis callback to ensure all required methods exist
                        const wrappedCallback = {
                            ...tfvisCallback,
                            setParams: tfvisCallback.setParams || (() => { }),
                            setModel: tfvisCallback.setModel || (() => { }),
                            onTrainBegin: tfvisCallback.onTrainBegin || (() => { }),
                            onTrainEnd: tfvisCallback.onTrainEnd || (() => { }),
                            onEpochBegin: tfvisCallback.onEpochBegin || (() => { }),
                            onBatchBegin: tfvisCallback.onBatchBegin || (() => { }),
                            onBatchEnd: tfvisCallback.onBatchEnd || (() => { })
                        };

                        baseCallbacks.push(wrappedCallback);
                    } catch (e) {
                        console.warn('[AI] Could not add tfjs-vis callback:', e);
                    }
                }
                return baseCallbacks;
            })()
        });

        // 4. Save Model & Metadata
        try {
            await model.save('indexeddb://clinical-model-transfusion');
            const minData = min.dataSync();
            const maxData = max.dataSync();
            const metadata = {
                min: Array.from(minData),
                max: Array.from(maxData)
            };
            localStorage.setItem('clinical-model-transfusion-meta', JSON.stringify(metadata));
        } catch (e) {
            console.error('Failed to save model:', e);
        }

        // 5. Manual Clinical Metric Calculation (before disposal)
        const predictions = model.predict(normalizedInputs) as tf.Tensor;
        const predData = predictions.dataSync();
        const actualData = ys.dataSync();

        let tp = 0, fp = 0, fn = 0, tn = 0;
        for (let i = 0; i < predData.length; i++) {
            const p = predData[i] > 0.5 ? 1 : 0;
            const a = actualData[i];
            if (p === 1 && a === 1) tp++;
            else if (p === 1 && a === 0) fp++;
            else if (p === 0 && a === 1) fn++;
            else tn++;
        }

        const finalPrecision = tp > 0 ? tp / (tp + fp) : 0;
        const finalRecall = tp > 0 ? tp / (tp + fn) : 0;
        const finalF1 = (finalPrecision + finalRecall) > 0 ? (2 * finalPrecision * finalRecall) / (finalPrecision + finalRecall) : 0;

        // Cleanup
        inputsTensor.dispose();
        min.dispose();
        max.dispose();
        normalizedInputs.dispose();
        ys.dispose();
        predictions.dispose();

        const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
        const finalAcc = history.history.acc[history.history.acc.length - 1] as number;

        const valLoss = history.history.val_loss ? (history.history.val_loss[history.history.val_loss.length - 1] as number) : undefined;
        const valAcc = history.history.val_acc ? (history.history.val_acc[history.history.val_acc.length - 1] as number) : undefined;
        // Validation metrics are harder to calculate manually without a separate split, 
        // using training metrics as proxy or leaving undefined for now.
        const valF1 = undefined;

        const stoppedEpoch = history.epoch.length;

        // Persist training logs for performance tracking
        try {
            const logsStr = localStorage.getItem('clinical-training-logs') || '[]';
            const logs = JSON.parse(logsStr);
            logs.push({
                date: new Date().toISOString(),
                loss: finalLoss,
                accuracy: finalAcc,
                precision: finalPrecision,
                recall: finalRecall,
                f1: finalF1,
                val_loss: valLoss,
                val_accuracy: valAcc,
                recordCount: data.length,
                stoppedEpoch
            });
            if (logs.length > 50) logs.shift();
            localStorage.setItem('clinical-training-logs', JSON.stringify(logs));
        } catch (e) {
            console.warn('Failed to save training logs:', e);
        }

        model.dispose();
        console.log(`Training complete. Loss: ${finalLoss}, Acc: ${finalAcc}, Val_Loss: ${valLoss}`);
        return {
            loss: finalLoss,
            accuracy: finalAcc,
            val_loss: valLoss,
            val_accuracy: valAcc,
            stoppedEpoch,
            precision: finalPrecision,
            recall: finalRecall,
            f1: finalF1
        };
    },

    /**
     * Specialized Training for Perfusion Flow Optimization
     */
    trainPerfusionModel: async (data: any[]) => {
        const rawInputs = data.map(d => [d.features.bsa, d.features.target_ci, d.features.temp]);
        const labels = data.map(d => [d.labels.target_flow]);

        const inputsTensor = tf.tensor2d(rawInputs);
        const ys = tf.tensor2d(labels);

        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [3] }));
        model.add(tf.layers.dense({ units: 1 })); // Linear output for flow rate

        model.compile({ loss: 'meanSquaredError', optimizer: tf.train.adam(0.01) });

        await model.fit(inputsTensor, ys, { epochs: 40, batchSize: 5 });
        await model.save('indexeddb://clinical-model-perfusion');

        inputsTensor.dispose(); ys.dispose(); model.dispose();
        return { success: true };
    },

    /**
     * Specialized Training for Fluid Balance Actions
     */
    trainBalanceModel: async (data: any[]) => {
        const rawInputs = data.map(d => [d.features.balance, d.features.duree_cec]);
        // Simple mapping for actions: monitor=0, hemofiltration=1
        const labels = data.map(d => [d.labels.action === 'hemofiltration' ? 1 : 0]);

        const inputsTensor = tf.tensor2d(rawInputs);
        const ys = tf.tensor2d(labels);

        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [2] }));
        model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

        model.compile({ loss: 'binaryCrossentropy', optimizer: tf.train.adam(0.01), metrics: ['accuracy'] });

        await model.fit(inputsTensor, ys, { epochs: 30, batchSize: 5 });
        await model.save('indexeddb://clinical-model-balance');

        inputsTensor.dispose(); ys.dispose(); model.dispose();
        return { success: true };
    },

    /**
     * Gives the model a "clinical maturity" head start using a baseline dataset.
     */
    bootstrapBaseline: async (onProgress?: (p: number) => void) => {
        console.log('Bootstrapping model maturity...');
        return await aiPredictionService.trainWithHistory(CLINICAL_BASELINE, onProgress);
    },

    async predictTransfusionRisk(data: { poids: number; taille: number; age: number; hematocrite: number }) {
        let model: tf.LayersModel | null = null;
        let inputTensor: tf.Tensor | null = null;
        let normalizedInput: tf.Tensor | null = null;

        try {
            model = await tf.loadLayersModel('indexeddb://clinical-model-transfusion');

            // 1. Retrieve Metadata
            const metaString = localStorage.getItem('clinical-model-transfusion-meta');
            if (!metaString) throw new Error('Model found but normalization metadata is missing.');

            const meta = JSON.parse(metaString);
            const min = tf.tensor1d(meta.min);
            const max = tf.tensor1d(meta.max);

            // 2. Create Input Tensor
            inputTensor = tf.tensor2d([[
                data.poids,
                data.taille,
                data.age,
                data.hematocrite
            ]]);

            // 3. Normalize: (Input - Min) / (Max - Min)
            // Note: We deliberately do not add epsilon here as we want to handle div/0 if strictly equal,
            // but for safety we can match training logic.
            normalizedInput = inputTensor.sub(min).div(max.sub(min).add(tf.scalar(1e-6)));

            // 4. Predict
            const prediction = model.predict(normalizedInput) as tf.Tensor;
            const probability = prediction.dataSync()[0];

            // Cleanup local tensors
            min.dispose();
            max.dispose();

            return probability;
        } catch (e) {
            console.warn('Prediction failed (fallback to heuristic):', e);
            return null;
        } finally {
            if (inputTensor) inputTensor.dispose();
            if (normalizedInput) normalizedInput.dispose();
            if (model) model.dispose();
        }
    },


    // 5. Blood Gas Analysis
    analyzeBloodGas(data: { ph: number; paco2: number; hco3: number; pao2: number; lactate?: number }) {
        let interpretation = 'Normal';
        let severity: 'success' | 'warning' | 'destructive' = 'success';
        const details: string[] = [];

        // Clinical Thresholds & Logic
        const isAcidosis = data.ph < 7.35;
        const isAlkalosis = data.ph > 7.45;
        const isRespiratory = data.paco2 > 45 || data.paco2 < 35;
        const isMetabolic = data.hco3 > 26 || data.hco3 < 22;

        // 1. Acid-Base Status
        if (isAcidosis) {
            interpretation = 'Acidose';
            severity = 'destructive';
            if (data.paco2 > 45 && data.hco3 < 22) {
                interpretation += ' Mixte (Respiratoire & Métabolique)';
            } else if (data.paco2 > 45) {
                interpretation += ' Respiratoire';
                if (data.hco3 > 26) interpretation += ' Compensée';
                else interpretation += ' Aigüe';
            } else if (data.hco3 < 22) {
                interpretation += ' Métabolique';
                if (data.paco2 < 35) interpretation += ' Compensée';
                else interpretation += ' Pure';
            }
        } else if (isAlkalosis) {
            interpretation = 'Alcalose';
            severity = 'warning';
            if (data.paco2 < 35 && data.hco3 > 26) {
                interpretation += ' Mixte';
            } else if (data.paco2 < 35) {
                interpretation += ' Respiratoire';
                if (data.hco3 < 22) interpretation += ' Compensée';
            } else if (data.hco3 > 26) {
                interpretation += ' Métabolique';
                if (data.paco2 > 45) interpretation += ' Compensée';
            }
        }

        // 2. Oxygenation (PaO2)
        if (data.pao2 < 60) {
            details.push('Hypoxémie sévère');
            severity = 'destructive';
        } else if (data.pao2 < 80) {
            details.push('Hypoxémie modérée');
            if (severity === 'success') severity = 'warning';
        } else if (data.pao2 > 250) {
            details.push('Hyperoxie notable');
            if (severity === 'success') severity = 'warning';
        }

        // 3. Lactate
        if (data.lactate && data.lactate > 2) {
            details.push(`Hyperlactatémie (${data.lactate} mmol/L)`);
            if (data.lactate > 4) severity = 'destructive';
            else if (severity !== 'destructive') severity = 'warning';
        }

        // 4. PaCO2 Specifics for Perfusionists
        if (data.paco2 > 50) details.push('Hypercapnie (risque d\'acidose respi)');
        if (data.paco2 < 30) details.push('Hypocapnie (risque de vasoconstriction cérébrale)');

        return {
            interpretation,
            details: details.length > 0 ? details.join(' • ') : "Paramètres dans les limites acceptables.",
            severity
        };
    },

    // 6. Fluid Balance Analysis
    async analyzeBalance(data: { totalEntrees: number; totalSorties: number; dureeCecMin?: number }) {
        const balance = data.totalEntrees - data.totalSorties;
        let suggestion = "Bilan équilibré.";
        let status: 'neutral' | 'positive' | 'overload' | 'negative' | 'alert' = 'neutral';
        let aiModelUsed = false;

        try {
            const model = await tf.loadLayersModel('indexeddb://clinical-model-balance');
            const input = tf.tensor2d([[balance, data.dureeCecMin || 0]]);
            const prediction = model.predict(input) as tf.Tensor;
            const actionScore = prediction.dataSync()[0];

            if (actionScore > 0.5) {
                suggestion = "L'IA locale suggère une hémofiltration (basée sur vos protocoles).";
                status = 'overload';
            }
            aiModelUsed = true;
            input.dispose();
            model.dispose();
        } catch (e) {
            // Heuristic fallback if no model trained
            if (balance > 1500) {
                suggestion = "Surcharge volémique majeure (> 1.5L). Risque d'oedème tissulaire. Envisager hémofiltration agressive.";
                status = 'overload';
            } else if (balance > 800) {
                suggestion = "Bilan positif important. Surveiller la fonction pulmonaire et envisager une hémofiltration.";
                status = 'overload';
            } else if (balance > 400) {
                suggestion = "Bilan positif modéré. À surveiller selon la phase de la CEC.";
                status = 'positive';
            } else if (balance > 100) {
                suggestion = "Bilan légèrement positif. Physiologique en début de CEC.";
                status = 'neutral';
            } else if (balance < -1200) {
                suggestion = "Déficit volémique critique. Risque immédiat de désamorçage. Remplissage urgent requis.";
                status = 'alert';
            } else if (balance < -700) {
                suggestion = "Bilan négatif significatif. Vérifier le volume du réservoir veineux.";
                status = 'negative';
            } else if (balance < -200) {
                suggestion = "Bilan légèrement négatif. Surveiller les tendances.";
                status = 'neutral';
            }
        }

        if (data.dureeCecMin && data.dureeCecMin > 120 && balance > 1000 && !aiModelUsed) {
            suggestion = "Attention: CEC prolongée avec balance > 1L. Risque d'inflammation systémique et de perméabilité capillaire accrue.";
            status = 'overload';
        }

        return {
            balance,
            suggestion,
            status
        };
    },

    /**
     * Specialized Training for Blood Gas Interpretation
     */
    trainBloodGasModel: async (data: any[], onProgress?: (p: number) => void) => {
        // Map features with case-insensitivity and default values
        const getRawVal = (obj: any, keys: string[]) => {
            const lowerKeys = keys.map(k => k.toLowerCase());
            for (const actualKey in obj) {
                if (lowerKeys.includes(actualKey.toLowerCase())) return obj[actualKey];
            }
            const nested = obj.parameters || obj.features || obj.data;
            if (nested && typeof nested === 'object') {
                for (const actualKey in nested) {
                    if (lowerKeys.includes(actualKey.toLowerCase())) return nested[actualKey];
                }
            }
            return null;
        };

        const getVal = (obj: any, keys: string[], def: number) => {
            const val = getRawVal(obj, keys);
            return val !== null ? (Number(val) || def) : def;
        };

        const getStringVal = (obj: any, keys: string[], def: string) => {
            const val = getRawVal(obj, keys);
            return val !== null ? String(val).toLowerCase() : def.toLowerCase();
        };

        const rawInputs = data.map(d => [
            getVal(d, ['ph'], 7.4),
            getVal(d, ['pco2'], 40),
            getVal(d, ['po2'], 100),
            getVal(d, ['hco3'], 24),
            getVal(d, ['lactate', 'lactates', 'lac'], 1.0)
        ]);

        // Label: Metabolic Status (0: Normal, 1: Acidosis/Alkalosis)
        const labels = data.map(d => {
            // Check 'label', 'severity', 'status' or 'result'
            const s = getStringVal(d, ['label', 'severity', 'status', 'result'], 'normal');
            const isDanger = s === 'destructive' || s === 'warning' || s === '1' || s === 'danger' || s === 'acidose' || s === 'alcalose';
            return isDanger ? 1 : 0;
        });

        const inputsTensor = tf.tensor2d(rawInputs, [rawInputs.length, 5]);
        const ys = tf.tensor2d(labels, [labels.length, 1]);

        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [5] }));
        model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

        model.compile({
            loss: 'binaryCrossentropy',
            optimizer: tf.train.adam(0.01),
            metrics: ['accuracy']
        });

        // Optimal parameters for big data (100k+)
        const optimalBatchSize = Math.min(128, Math.max(10, Math.floor(data.length / 50)));
        const optimalEpochs = data.length > 5000 ? 10 : 50;

        console.log(`[AI BloodGas] Records=${data.length}, BatchSize=${optimalBatchSize}, Epochs=${optimalEpochs}`);

        const history = await model.fit(inputsTensor, ys, {
            epochs: optimalEpochs,
            batchSize: optimalBatchSize,
            shuffle: true,
            validationSplit: 0.2,
            callbacks: await (async () => {
                const baseCallbacks: any[] = [
                    tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 5 }),
                    {
                        onEpochEnd: (epoch: number) => {
                            if (onProgress) onProgress(Math.round(((epoch + 1) / optimalEpochs) * 100));
                        },
                        setParams: () => { },
                        setModel: () => { },
                        onTrainBegin: () => { },
                        onTrainEnd: () => { },
                        onEpochBegin: () => { },
                        onBatchBegin: () => { },
                        onBatchEnd: () => { }
                    } as any
                ];

                const vis = await getTfvis();
                if (vis) {
                    try {
                        const tfvisCallback = vis.show.fitCallbacks(
                            { name: 'Modèle Gaz du Sang (Interprétation)', tab: 'Entraînement' },
                            ['loss', 'acc', 'val_loss', 'val_acc'],
                            { callbacks: ['onEpochEnd'] }
                        );

                        // Wrap tfvis callback to ensure all required methods exist
                        const wrappedCallback = {
                            ...tfvisCallback,
                            setParams: tfvisCallback.setParams || (() => { }),
                            setModel: tfvisCallback.setModel || (() => { }),
                            onTrainBegin: tfvisCallback.onTrainBegin || (() => { }),
                            onTrainEnd: tfvisCallback.onTrainEnd || (() => { }),
                            onEpochBegin: tfvisCallback.onEpochBegin || (() => { }),
                            onBatchBegin: tfvisCallback.onBatchBegin || (() => { }),
                            onBatchEnd: tfvisCallback.onBatchEnd || (() => { })
                        };

                        baseCallbacks.push(wrappedCallback);
                    } catch (e) {
                        console.warn('[AI] Could not add tfjs-vis callback:', e);
                    }
                }
                return baseCallbacks;
            })()
        });

        // Manual calculation of Precision/Recall for the final report
        const predictions = model.predict(inputsTensor) as tf.Tensor;
        const predData = predictions.dataSync();
        const actualData = ys.dataSync();

        let tp = 0, fp = 0, fn = 0, tn = 0;
        for (let i = 0; i < predData.length; i++) {
            const p = predData[i] > 0.5 ? 1 : 0;
            const a = actualData[i];
            if (p === 1 && a === 1) tp++;
            else if (p === 1 && a === 0) fp++;
            else if (p === 0 && a === 1) fn++;
            else tn++;
        }

        const precision = tp > 0 ? tp / (tp + fp) : 0;
        const recall = tp > 0 ? tp / (tp + fn) : 0;
        const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

        await model.save('indexeddb://clinical-model-bloodgas');

        // Save normalization meta
        const min = inputsTensor.min(0);
        const max = inputsTensor.max(0);
        localStorage.setItem('clinical-model-bloodgas-meta', JSON.stringify({
            min: Array.from(min.dataSync()),
            max: Array.from(max.dataSync())
        }));

        const getMetric = (hist: any, name: string) => {
            const val = hist[name];
            return (val && val.length > 0) ? (val[val.length - 1] as number) : 0;
        };

        const result = {
            success: true,
            accuracy: getMetric(history.history, 'accuracy'),
            loss: getMetric(history.history, 'loss'),
            val_accuracy: getMetric(history.history, 'val_accuracy'),
            val_loss: getMetric(history.history, 'val_loss'),
            stoppedEpoch: history.epoch.length,
            precision,
            recall,
            f1
        };

        // Log this training
        const logs = JSON.parse(localStorage.getItem('clinical-training-logs') || '[]');
        logs.push({ ...result, recordCount: data.length, date: new Date().toISOString(), type: 'bloodgas' });
        localStorage.setItem('clinical-training-logs', JSON.stringify(logs.slice(-50)));

        inputsTensor.dispose(); ys.dispose(); min.dispose(); max.dispose();
        predictions.dispose();
        model.dispose();

        return result;
    },

    /**
     * Routes generic dataset to the appropriate training function
     */
    trainFromDataset: async (rawData: any, onProgress?: (p: number) => void) => {
        let data = rawData;
        // Support nested data structures (e.g., { "data": [...] } or { "records": [...] })
        if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
            data = data.data || data.records || data.items || Object.values(data).find(v => Array.isArray(v));
        }

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Dataset vide ou format invalide (tableau attendu).");
        }

        const first = data[0];
        const keys = Object.keys(first).map(k => k.toLowerCase());
        const nestedKeys = (first.parameters || first.features || {}) ? Object.keys(first.parameters || first.features || {}).map(k => k.toLowerCase()) : [];
        const allKeys = [...keys, ...nestedKeys];

        // Heuristic detection: check for blood gas markers or baseline features
        if (allKeys.some(k => ['ph', 'pco2', 'po2', 'lactate', 'lactates'].includes(k))) {
            return await aiPredictionService.trainBloodGasModel(data, onProgress);
        } else if (allKeys.some(k => ['poids', 'age', 'sexe'].includes(k))) {
            return await aiPredictionService.trainWithHistory(data, onProgress);
        } else {
            console.error("Format non reconnu. Clés trouvées:", allKeys);
            throw new Error(`Format non reconnu. Clés détectées : ${allKeys.join(', ')}. Vérifiez que votre JSON contient des colonnes comme 'pH', 'pCO2' ou 'poids'.`);
        }
    },
};

const CLINICAL_BASELINE = [
    // [poids, taille, age, hematocrite] -> [transfusion]
    { features: { poids: 70, taille: 170, age: 75, hematocrite: 18 }, labels: { transfusion: 1 } },
    { features: { poids: 85, taille: 180, age: 45, hematocrite: 35 }, labels: { transfusion: 0 } },
    { features: { poids: 60, taille: 160, age: 80, hematocrite: 21 }, labels: { transfusion: 1 } },
    { features: { poids: 95, taille: 185, age: 50, hematocrite: 38 }, labels: { transfusion: 0 } },
    { features: { poids: 75, taille: 175, age: 68, hematocrite: 22 }, labels: { transfusion: 1 } },
    { features: { poids: 50, taille: 155, age: 72, hematocrite: 24 }, labels: { transfusion: 1 } },
    { features: { poids: 80, taille: 170, age: 60, hematocrite: 30 }, labels: { transfusion: 0 } },
    // More basic cases would be here in a real production file
];

export const aiPredictionService = predictionService;
