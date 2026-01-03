
'use client';

import * as React from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    BrainCircuit,
    Calculator,
    Droplets, Sparkles,
    Wind,
    Activity,
    ShieldAlert,
    Bot,
    HeartPulse,
    User,
    Ruler,
    Weight,
    Pipette,
    BarChart,
    Thermometer,
    FlaskConical,
    Loader2,
    TestTube,
    Lightbulb,
    Book
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { aiPredictionService, HematologyInput, PerfusionInput, ComplicationInput } from '@/services/ai-prediction';
// import { generateCecPlan } from '@/ai/flows/generate-cec-plan'; // Temporarily removed
// import { analyzeAcidBase } from '@/ai/flows/analyze-acid-base'; // Temporarily removed

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import dynamic from 'next/dynamic';

const KnowledgeBase = dynamic(() => import('@/components/tools/knowledge-base').then(mod => mod.KnowledgeBase), {
    ssr: false,
    loading: () => (
        <Card className="min-h-[400px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </Card>
    )
});

const calculatorSchema = z.object({
    poids: z.coerce.number().positive("Le poids est requis.").optional(),
    taille: z.coerce.number().positive("La taille est requise.").optional(),
    sexe: z.enum(['homme', 'femme']),
    age: z.coerce.number().positive("L'âge est requis.").optional(),
    hematocriteInitial: z.coerce.number().min(10, "Ht > 10").max(70, "Ht < 70").optional(),
    volumePriming: z.coerce.number().positive("Volume > 0").optional(),
    hbInitial: z.coerce.number().positive("Hb > 0").optional(),
    dureeCec: z.coerce.number().positive("Durée > 0").optional(),
    // Acid-base fields
    ph: z.coerce.number().min(6).max(8).optional(),
    paco2: z.coerce.number().positive().optional(),
    hco3: z.coerce.number().positive().optional(),
    k: z.coerce.number().positive().optional(),
});

type CalculatorValues = z.infer<typeof calculatorSchema>;

const ResultField = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{value} <span className="text-xs font-normal text-muted-foreground">{unit}</span></span>
    </div>
);

const HematologyPrediction = () => {
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<any>(null); // Use any or define adapter type
    const [error, setError] = React.useState<string | null>(null);
    const form = useFormContext<CalculatorValues>();

    const handlePrediction = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        const formValues = form.getValues();
        const { poids, taille, sexe, hematocriteInitial, volumePriming, hbInitial } = formValues;

        if (!poids || !taille || !sexe || !hematocriteInitial || !volumePriming || !hbInitial) {
            setError("Veuillez remplir toutes les données patient et priming pour lancer la prédiction.");
            setLoading(false);
            return;
        }

        try {
            const input: HematologyInput & { poids?: number, taille?: number, age?: number } = {
                hemoglobine: Number(hbInitial),
                hematocrite: Number(hematocriteInitial),
                plaquettes: 150000,
                poids: Number(poids),
                taille: Number(taille),
                age: 60, // Default or add field to form if exist
            };
            const prediction = await aiPredictionService.predictHematologyRisks(input);
            setResult(prediction);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de la prédiction.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Droplets />
                    Prédiction Hématologique & Transfusion (TF.js)
                </CardTitle>
                <CardDescription>
                    Évaluation du risque basée sur des modèles prédictifs locaux.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {result && (
                    <div className="space-y-4">
                        <Alert variant={result.riskLevel === 'Élevé' ? 'destructive' : 'default'}>
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>Risque: {result.riskLevel}</AlertTitle>
                            <AlertDescription>
                                {result.message} (Confiance: {result.confidence * 100}%)
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handlePrediction} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                    Lancer l'analyse TF.js
                </Button>
            </CardFooter>
        </Card>
    );
};

const PerfusionOptimization = ({ bsa, debitTheoriqueLmin }: { bsa?: string, debitTheoriqueLmin?: string }) => {
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);
    const form = useFormContext<CalculatorValues>();

    // New inputs for advanced optimization
    const [targetCI, setTargetCI] = React.useState("2.4");
    const [temperature, setTemperature] = React.useState("36");

    // Feedback / Training state
    const [showTraining, setShowTraining] = React.useState(false);
    const [actualFlow, setActualFlow] = React.useState("");
    const [trainingStatus, setTrainingStatus] = React.useState<string | null>(null);

    const handleOptimization = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        setTrainingStatus(null);
        const formValues = form.getValues();
        const { poids, hbInitial } = formValues;

        if (!poids || !bsa || !debitTheoriqueLmin || !hbInitial) {
            setError("Veuillez remplir Poids, Taille et Hb initiale pour lancer l'analyse.");
            setLoading(false);
            return;
        }

        try {
            const input: PerfusionInput = {
                surfaceCorporelle: Number(bsa),
                indexCardiaqueCible: Number(targetCI),
                temperature: Number(temperature)
            };
            const optimization = await aiPredictionService.optimizePerfusion(input);
            setResult(optimization);
            setShowTraining(true);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de l'optimisation.");
        } finally {
            setLoading(false);
        }
    };

    const handleTrain = async () => {
        if (!actualFlow || isNaN(Number(actualFlow)) || !bsa) return;

        setTrainingStatus("Enregistrement...");
        try {
            const input: PerfusionInput = {
                surfaceCorporelle: Number(bsa),
                indexCardiaqueCible: Number(targetCI),
                temperature: Number(temperature)
            };

            await aiPredictionService.addPerfusionTrainingData(input, Number(actualFlow));
            const retrain = await aiPredictionService.retrainPerfusionModel();

            if (retrain.success) {
                setTrainingStatus("Apprentissage réussi ! " + retrain.message);
                setTimeout(() => setTrainingStatus(null), 3000);
            } else {
                setTrainingStatus("Erreur: " + retrain.message);
            }
        } catch (e) {
            setTrainingStatus("Erreur technique local.");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Activity />
                    Optimisation de la Perfusion (TF.js)
                </CardTitle>
                <CardDescription>
                    Calcul de débit cible par tenseurs avec apprentissage continu.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Index Cardiaque Cible</label>
                        <Input
                            type="number"
                            step="0.1"
                            value={targetCI}
                            onChange={(e) => setTargetCI(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Température (°C)</label>
                        <Input
                            type="number"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                        />
                    </div>
                </div>

                {result && (
                    <div className="space-y-4 pt-4 border-t">
                        <Alert>
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>Débit Cible Calculé</AlertTitle>
                            <AlertDescription>
                                {result.recommendation}
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <ResultField label="Target Flow" value={result.targetFlowRate} unit="L/min" />
                        </div>
                    </div>
                )}

                {showTraining && (
                    <div className="bg-muted/30 p-4 rounded-lg space-y-3 border border-dashed">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            Apprentissage / Correction
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            Le débit proposé ne correspond pas à votre pratique ? Entrez la valeur réelle pour que l'IA apprenne.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Débit réel (L/min)"
                                type="number"
                                step="0.1"
                                value={actualFlow}
                                onChange={(e) => setActualFlow(e.target.value)}
                            />
                            <Button size="sm" variant="secondary" onClick={handleTrain} disabled={!actualFlow}>
                                Apprendre
                            </Button>
                        </div>
                        {trainingStatus && <p className="text-xs font-medium text-primary animate-pulse">{trainingStatus}</p>}
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleOptimization} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                    Calculer & Optimiser
                </Button>
            </CardFooter>
        </Card>
    );
};

const ComplicationsPrediction = ({ hematocritePostPriming }: { hematocritePostPriming?: string }) => {
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);
    const form = useFormContext<CalculatorValues>();

    const handlePrediction = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        const formValues = form.getValues();
        const { age, poids, hbInitial, dureeCec } = formValues;

        if (!age || !poids || !hbInitial || !dureeCec || !hematocritePostPriming) {
            setError("Veuillez remplir Âge, Poids, Hb, Durée CEC et calculer l'Ht post-priming.");
            setLoading(false);
            return;
        }

        try {
            const input: ComplicationInput = {
                age: Number(age),
                dureeCEC: Number(dureeCec),
                dureeClampage: Number(dureeCec) * 0.7, // Estimate
                euroscore: 2 // Default or add field
            };
            const prediction = await aiPredictionService.predictComplications(input);
            setResult(prediction);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de la prédiction des complications.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <ShieldAlert />
                    Prédiction des Complications (TF.js)
                </CardTitle>
                <CardDescription>
                    Score de risque calculé.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {result && (
                    <div className="space-y-4">
                        <Alert variant={result.riskCategory === 'Élevé' ? 'destructive' : 'default'}>
                            <AlertTitle>Risque Global: {result.riskCategory}</AlertTitle>
                            <AlertDescription>{result.details}</AlertDescription>
                        </Alert>
                        <ResultField label="Score" value={result.riskScore} unit="/ 100" />
                    </div>
                )}
                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handlePrediction} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                    Calculer le Risque
                </Button>
            </CardFooter>
        </Card>
    );
};




export default function FeaturesPage() {
    const [results, setResults] = React.useState<any>({});

    const form = useForm<CalculatorValues>({
        resolver: zodResolver(calculatorSchema),
        defaultValues: {
            sexe: 'homme',
            poids: undefined,
            taille: undefined,
            age: undefined,
            dureeCec: undefined,
            hematocriteInitial: undefined,
            volumePriming: undefined,
            hbInitial: undefined,
            ph: undefined,
            paco2: undefined,
            hco3: undefined,
            k: undefined,
        },
        mode: 'onChange',
    });

    const poids = form.watch('poids');
    const taille = form.watch('taille');
    const sexe = form.watch('sexe');
    const hematocriteInitial = form.watch('hematocriteInitial');
    const volumePriming = form.watch('volumePriming');


    React.useEffect(() => {
        const p = Number(poids);
        const t = Number(taille);

        if (p > 0 && t > 0) {
            const bsa = 0.007184 * Math.pow(t, 0.725) * Math.pow(p, 0.425);

            let ebv = 0;
            const tailleM = t / 100;
            if (sexe === 'homme') {
                ebv = (0.3669 * Math.pow(tailleM, 3)) + (0.03219 * p) + 0.6041;
            } else {
                ebv = (0.3561 * Math.pow(tailleM, 3)) + (0.03308 * p) + 0.1833;
            }
            const ebvMl = ebv * 1000;

            let hematocritePostPriming = undefined;
            if (hematocriteInitial && volumePriming && ebvMl > 0) {
                const hi = Number(hematocriteInitial);
                const vp = Number(volumePriming);
                const redCellVolume = (ebvMl * hi) / 100;
                const finalVolume = ebvMl + vp;
                hematocritePostPriming = (redCellVolume / finalVolume) * 100;
            }

            const debitTheoriqueLmin = bsa * 2.4;

            setResults({
                bsa: bsa.toFixed(2),
                ebv: ebv.toFixed(2),
                ebvMl: ebvMl.toFixed(0),
                hematocritePostPriming: hematocritePostPriming?.toFixed(1),
                debitTheoriqueLmin: debitTheoriqueLmin.toFixed(2),
                debitTheoriqueLminM2: (debitTheoriqueLmin / bsa).toFixed(2),
            });
        } else {
            setResults({});
        }

    }, [poids, taille, sexe, hematocriteInitial, volumePriming]);


    return (
        <>
            <header className="bg-card shadow-sm">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <BrainCircuit className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Assistant Calculs & Prédictions IA
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Utilisez cet outil pour obtenir des estimations physiologiques et des prédictions basées sur les données du patient.
                    </p>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <FormProvider {...form}>
                    <form className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Colonne d'inputs */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Données du Patient
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="poids"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><Weight className="h-4 w-4" />Poids</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" placeholder="ex: 70" {...field} value={field.value ?? ''} />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">kg</span>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="taille"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><Ruler className="h-4 w-4" />Taille</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" placeholder="ex: 175" {...field} value={field.value ?? ''} />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">cm</span>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="age"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">Âge</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" placeholder="ex: 65" {...field} value={field.value ?? ''} />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">ans</span>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sexe"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sexe</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                                        <FormItem className="flex items-center space-x-2">
                                                            <FormControl><RadioGroupItem value="homme" /></FormControl>
                                                            <FormLabel className="font-normal">Homme</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-2">
                                                            <FormControl><RadioGroupItem value="femme" /></FormControl>
                                                            <FormLabel className="font-normal">Femme</FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Pipette className="h-5 w-5" />
                                        Données de CEC & Hémato
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="hematocriteInitial"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">Hématocrite initial</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" placeholder="ex: 42" {...field} value={field.value ?? ''} />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">%</span>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="hbInitial"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">Hémoglobine initiale</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" placeholder="ex: 14" {...field} value={field.value ?? ''} />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">g/dL</span>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="volumePriming"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">Volume du priming</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" placeholder="ex: 1500" {...field} value={field.value ?? ''} />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">ml</span>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dureeCec"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">Durée CEC prévue</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" placeholder="ex: 90" {...field} value={field.value ?? ''} />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">min</span>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TestTube className="h-5 w-5" />
                                        Gaz du Sang (pour analyse)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="ph" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>pH</FormLabel>
                                            <FormControl><Input type="number" step="0.01" placeholder="ex: 7.40" {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="paco2" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>PaCO₂</FormLabel>
                                            <FormControl><Input type="number" placeholder="ex: 40" {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="hco3" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>HCO₃⁻</FormLabel>
                                            <FormControl><Input type="number" placeholder="ex: 24" {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="k" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>K⁺ (Potassium)</FormLabel>
                                            <FormControl><Input type="number" step="0.1" placeholder="ex: 4.2" {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Colonne de résultats */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-primary">
                                        <Calculator />
                                        Calculs Physiologiques
                                    </CardTitle>
                                    <CardDescription>Les valeurs sont calculées automatiquement à partir des données saisies.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <ResultField label="Surface Corporelle (BSA)" value={results.bsa || '...'} unit="m²" />
                                        <ResultField label="Volume Sanguin Estimé (EBV)" value={results.ebvMl || '...'} unit="ml" />
                                        <ResultField label="Débit Théorique de CEC" value={results.debitTheoriqueLmin || '...'} unit="L/min" />
                                        <ResultField label="Index Cardiaque Théorique" value={results.debitTheoriqueLminM2 || '...'} unit="L/min/m²" />
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <ResultField label="Hématocrite post-priming estimé" value={results.hematocritePostPriming || '...'} unit="%" />
                                        <CardDescription className="text-xs pt-2">Requiert le poids, la taille, le sexe, l'hématocrite initial et le volume du priming.</CardDescription>
                                    </div>
                                </CardContent>
                            </Card>

                            <HematologyPrediction />
                            <PerfusionOptimization bsa={results.bsa} debitTheoriqueLmin={results.debitTheoriqueLmin} />
                            <ComplicationsPrediction hematocritePostPriming={results.hematocritePostPriming} />
                        </div>
                    </form>
                </FormProvider>

                {/* Global AI Assistant Section */}
                <div className="mt-12 space-y-6 border-t pt-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Assistant IA Clinique Global</h2>
                            <p className="text-sm text-muted-foreground">Expertise en temps réel basée sur les standards internationaux (EACTS, SCTS, AHA).</p>
                        </div>
                    </div>
                    <KnowledgeBase />
                </div>
            </main>
        </>
    );
}

