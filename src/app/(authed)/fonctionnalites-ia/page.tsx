
'use client';

import * as React from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    BrainCircuit,
    Calculator,
    Droplets,
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
    Lightbulb
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { predictHematology } from '@/ai/flows/predict-hematology';
import { optimizePerfusion } from '@/ai/flows/optimize-perfusion';
import { predictComplications } from '@/ai/flows/predict-complications';
import { analyzeAcidBase } from '@/ai/flows/analyze-acid-base';
import { generateCecPlan } from '@/ai/flows/generate-cec-plan';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


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

// Types duplicated from predict-hematology.ts to avoid "use server" export issues
const HematologyPredictionInputSchema = z.object({
  weightKg: z.number().describe('Poids du patient en kilogrammes.'),
  heightCm: z.number().describe('Taille du patient en centimètres.'),
  sex: z.enum(['homme', 'femme']).describe('Sexe du patient.'),
  initialHematocrit: z.number().describe('Niveau d\'hématocrite initial en %.'),
  initialHemoglobin: z.number().describe('Niveau d\'hémoglobine initial en g/dL.'),
  primingVolumeMl: z.number().describe('Volume du liquide d\'amorçage en millilitres.'),
});
type HematologyPredictionInput = z.infer<typeof HematologyPredictionInputSchema>;

const HematologyPredictionOutputSchema = z.object({
  transfusionRisk: z.object({
    isRisk: z.boolean().describe('Indique s\'il existe un risque significatif de nécessiter une transfusion sanguine.'),
    assessment: z.string().describe('Une brève évaluation du risque transfusionnel, expliquant le raisonnement.'),
  }),
  transfusionRecommendation: z.object({
    recommendation: z.string().describe('Recommandation de transfusion, par exemple, "Aucune transfusion requise", "Préparer 1 culot globulaire", etc.'),
    justification: z.string().describe('Justification de la recommandation de transfusion basée sur les niveaux prédits d\'hématocrite/hémoglobine.'),
  }),
  anemiaDetection: z.object({
    isAnemia: z.boolean().describe('Indique si le patient est susceptible d\'avoir ou de développer une anémie sévère pendant la procédure.'),
    assessment: z.string().describe('Évaluation du statut de l\'anémie et de son impact potentiel sur la procédure.'),
  }),
});
type HematologyPredictionOutput = z.infer<typeof HematologyPredictionOutputSchema>;


// Types duplicated from optimize-perfusion.ts to avoid "use server" export issues
const OptimizePerfusionInputSchema = z.object({
  poids: z.number().describe('Poids du patient en kilogrammes.'),
  debitCec: z.number().describe('Débit de la CEC en L/min.'),
  hb: z.number().describe('Niveau d\'hémoglobine actuel en g/dL.'),
  surfaceCorporelle: z.number().describe('Surface corporelle du patient en m².'),
});
type OptimizePerfusionInput = z.infer<typeof OptimizePerfusionInputSchema>;

const OptimizePerfusionOutputSchema = z.object({
  do2: z.number().describe('Délivrance en oxygène calculée en ml/min/m².'),
  isAdequate: z.boolean().describe('Indique si la DO2 est adéquate (généralement > 280 ml/min/m²).'),
  assessment: z.string().describe('Une brève évaluation de l\'état de la perfusion.'),
  recommendation: z.string().describe('Recommandation pour optimiser la perfusion si nécessaire.'),
});
type OptimizePerfusionOutput = z.infer<typeof OptimizePerfusionOutputSchema>;

// Types duplicated from predict-complications.ts
const ComplicationsPredictionInputSchema = z.object({
    age: z.number().describe('Âge du patient en années.'),
    poids: z.number().describe('Poids du patient en kilogrammes.'),
    hb: z.number().describe('Niveau d\'hémoglobine en g/dL.'),
    dureeCecMinutes: z.number().describe('Durée anticipée de la CEC en minutes.'),
    hemodilution: z.number().describe('Hématocrite estimé après priming en %.'),
});
type ComplicationsPredictionInput = z.infer<typeof ComplicationsPredictionInputSchema>;

const ComplicationsPredictionOutputSchema = z.object({
    hypotension: z.object({
        risk: z.enum(['Faible', 'Modéré', 'Élevé']),
        assessment: z.string(),
    }),
    sirs: z.object({
        risk: z.enum(['Faible', 'Modéré', 'Élevé']),
        assessment: z.string(),
    }),
    coagulopathie: z.object({
        risk: z.enum(['Faible', 'Modéré', 'Élevé']),
        assessment: z.string(),
    }),
});
type ComplicationsPredictionOutput = z.infer<typeof ComplicationsPredictionOutputSchema>;


// Types duplicated from analyze-acid-base.ts
const AcidBaseAnalysisInputSchema = z.object({
    poids: z.number().describe('Poids du patient en kilogrammes.'),
    ph: z.number().describe('La valeur du pH sanguin.'),
    paco2: z.number().describe('La pression partielle de dioxyde de carbone (PaCO2) en mmHg.'),
    hco3: z.number().describe('La concentration en bicarbonate (HCO3-) en mmol/L.'),
    k: z.number().describe('La concentration en potassium (K+) en mEq/L.'),
    hematocrite: z.number().describe('Le niveau d\'hématocrite en %.'),
});
type AcidBaseAnalysisInput = z.infer<typeof AcidBaseAnalysisInputSchema>;

const AcidBaseAnalysisOutputSchema = z.object({
    acidBaseStatus: z.object({
        status: z.string().describe("Le trouble acido-basique principal identifié (ex: 'Acidose métabolique compensée', 'Équilibre normal')."),
        assessment: z.string().describe("Une évaluation détaillée du trouble, expliquant les valeurs clés."),
    }),
    electrolyteStatus: z.object({
        status: z.string().describe("Le statut électrolytique principal identifié (ex: 'Hyperkaliémie modérée', 'Kaliémie normale')."),
        assessment: z.string().describe("Une évaluation du statut du potassium et d'autres électrolytes pertinents."),
    }),
    recommendations: z.array(z.string()).describe("Une liste de recommandations concrètes pour corriger les troubles identifiés."),
});
type AcidBaseAnalysisOutput = z.infer<typeof AcidBaseAnalysisOutputSchema>;

// Types duplicated from generate-cec-plan.ts
const CecPlanInputSchema = z.object({
    poids: z.number().optional(),
    taille: z.number().optional(),
    sexe: z.enum(['homme', 'femme']),
    age: z.number().optional(),
    hematocriteInitial: z.number().optional(),
    hbInitial: z.number().optional(),
    volumePriming: z.number().optional(),
    dureeCec: z.number().optional(),
    ph: z.number().optional(),
    paco2: z.number().optional(),
    hco3: z.number().optional(),
    k: z.number().optional(),
    bsa: z.number().optional(),
    debitTheorique: z.number().optional(),
    hematocritePostPriming: z.number().optional(),
});
type CecPlanInput = z.infer<typeof CecPlanInputSchema>;

const CecPlanOutputSchema = z.object({
  plan: z.array(
    z.object({
      title: z.string().describe('Titre de la section du plan (ex: "Plan de Perfusion", "Gestion des Risques").'),
      content: z.array(z.string()).describe('Liste des points ou recommandations pour cette section.'),
    })
  ).describe('Un plan de CEC personnalisé et détaillé.'),
  alerts: z.array(
      z.object({
          riskLevel: z.enum(['Élevé', 'Modéré', 'Faible']).describe("Niveau de risque de l'alerte."),
          description: z.string().describe("Description de l'alerte prédictive."),
      })
  ).describe('Liste des alertes prédictives les plus importantes.'),
});
type CecPlanOutput = z.infer<typeof CecPlanOutputSchema>;


const ResultField = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{value} <span className="text-xs font-normal text-muted-foreground">{unit}</span></span>
    </div>
);

const HematologyPrediction = () => {
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<HematologyPredictionOutput | null>(null);
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
            const input: HematologyPredictionInput = {
                weightKg: Number(poids),
                heightCm: Number(taille),
                sex: sexe,
                initialHematocrit: Number(hematocriteInitial),
                primingVolumeMl: Number(volumePriming),
                initialHemoglobin: Number(hbInitial)
            };
            const prediction = await predictHematology(input);
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
                    Prédiction Hématologique & Transfusion
                </CardTitle>
                <CardDescription>
                   Évaluation du risque transfusionnel, recommandation de culots globulaires et détection d'anémie.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {result && (
                    <div className="space-y-4">
                        <Alert variant={result.transfusionRisk.isRisk ? 'destructive' : 'default'}>
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>Risque Transfusionnel</AlertTitle>
                            <AlertDescription>
                                {result.transfusionRisk.assessment}
                            </AlertDescription>
                        </Alert>
                         <div className="space-y-2">
                             <ResultField label="Anémie Sévère" value={result.anemiaDetection.isAnemia ? 'Oui' : 'Non'} unit="" />
                             <p className="text-xs text-muted-foreground">{result.anemiaDetection.assessment}</p>
                         </div>
                         <Separator />
                          <div className="space-y-2">
                            <ResultField label="Recommandation Transfusion" value={result.transfusionRecommendation.recommendation} unit="" />
                             <p className="text-xs text-muted-foreground">{result.transfusionRecommendation.justification}</p>
                          </div>
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
                    Lancer l'analyse IA
                </Button>
            </CardFooter>
        </Card>
    );
};

const PerfusionOptimization = ({ bsa, debitTheoriqueLmin }: { bsa?: string, debitTheoriqueLmin?: string }) => {
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<OptimizePerfusionOutput | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const form = useFormContext<CalculatorValues>();

    const handleOptimization = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        const formValues = form.getValues();
        const { poids, hbInitial } = formValues;

        if (!poids || !bsa || !debitTheoriqueLmin || !hbInitial) {
             setError("Veuillez remplir Poids, Taille et Hb initiale pour lancer l'analyse.");
             setLoading(false);
             return;
        }

        try {
            const input: OptimizePerfusionInput = {
                poids: Number(poids),
                surfaceCorporelle: Number(bsa),
                debitCec: Number(debitTheoriqueLmin),
                hb: Number(hbInitial),
            };
            const optimization = await optimizePerfusion(input);
            setResult(optimization);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de l'optimisation.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Activity />
                    Optimisation de la Perfusion
                </CardTitle>
                <CardDescription>
                   Calcul de la DO₂ critique, alerte de débit inadéquat et simulation de scénarios.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {result && (
                    <div className="space-y-4">
                        <Alert variant={!result.isAdequate ? 'destructive' : 'default'}>
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>État de la Perfusion</AlertTitle>
                            <AlertDescription>
                                {result.assessment}
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                             <ResultField label="DO₂ Calculée" value={result.do2.toFixed(2)} unit="ml/min/m²" />
                             <p className="text-xs text-muted-foreground">{result.recommendation}</p>
                         </div>
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
                 <Button onClick={handleOptimization} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                    Analyser la Perfusion
                </Button>
            </CardFooter>
        </Card>
    );
};

const ComplicationsPrediction = ({ hematocritePostPriming }: { hematocritePostPriming?: string }) => {
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<ComplicationsPredictionOutput | null>(null);
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
            const input: ComplicationsPredictionInput = {
                age: Number(age),
                poids: Number(poids),
                hb: Number(hbInitial),
                dureeCecMinutes: Number(dureeCec),
                hemodilution: Number(hematocritePostPriming),
            };
            const prediction = await predictComplications(input);
            setResult(prediction);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de la prédiction des complications.");
        } finally {
            setLoading(false);
        }
    };

    const getRiskVariant = (risk: 'Faible' | 'Modéré' | 'Élevé') => {
        if (risk === 'Élevé') return 'destructive';
        if (risk === 'Modéré') return 'default'; // yellow would be better
        return 'default';
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <ShieldAlert />
                    Prédiction des Complications
                </CardTitle>
                <CardDescription>
                    Analyse des risques d'hypotension, de SIRS, et de coagulopathie.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {result && (
                    <div className="space-y-4">
                        <Alert variant={getRiskVariant(result.hypotension.risk)}>
                            <AlertTitle>Risque d'Hypotension: {result.hypotension.risk}</AlertTitle>
                            <AlertDescription>{result.hypotension.assessment}</AlertDescription>
                        </Alert>
                         <Alert variant={getRiskVariant(result.sirs.risk)}>
                            <AlertTitle>Risque de SIRS: {result.sirs.risk}</AlertTitle>
                            <AlertDescription>{result.sirs.assessment}</AlertDescription>
                        </Alert>
                         <Alert variant={getRiskVariant(result.coagulopathie.risk)}>
                            <AlertTitle>Risque de Coagulopathie: {result.coagulopathie.risk}</AlertTitle>
                            <AlertDescription>{result.coagulopathie.assessment}</AlertDescription>
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
                    Analyser les Risques
                </Button>
            </CardFooter>
        </Card>
    );
};


const AcidBaseAnalysis = () => {
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<AcidBaseAnalysisOutput | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const { getValues } = useFormContext<CalculatorValues>();

    const handleAnalysis = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        const formValues = getValues();
        const { poids, ph, paco2, hco3, k, hematocriteInitial } = formValues;

        if (!poids || !ph || !paco2 || !hco3 || !k || !hematocriteInitial) {
            setError("Veuillez remplir Poids et toutes les valeurs de gaz du sang pour lancer l'analyse.");
            setLoading(false);
            return;
        }

        try {
            const input: AcidBaseAnalysisInput = {
                poids: Number(poids),
                ph: Number(ph),
                paco2: Number(paco2),
                hco3: Number(hco3),
                k: Number(k),
                hematocrite: Number(hematocriteInitial),
            };
            const analysis = await analyzeAcidBase(input);
            setResult(analysis);
        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de l'analyse acido-basique.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <FlaskConical />
                    Gestion Acido-Basique & Électrolytique
                </CardTitle>
                <CardDescription>
                    Détection des troubles, proposition de correction pour le bicarbonate et les électrolytes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {result && (
                    <div className="space-y-4">
                        <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertTitle>{result.acidBaseStatus.status}</AlertTitle>
                            <AlertDescription>{result.acidBaseStatus.assessment}</AlertDescription>
                        </Alert>
                        <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertTitle>{result.electrolyteStatus.status}</AlertTitle>
                            <AlertDescription>{result.electrolyteStatus.assessment}</AlertDescription>
                        </Alert>
                        <Separator />
                        <div className="space-y-2">
                             <p className="font-semibold">Recommandations de Correction :</p>
                             <ul className="list-disc list-inside space-y-1 text-sm">
                                {result.recommendations.map((rec, i) => (
                                    <li key={i}>{rec}</li>
                                ))}
                             </ul>
                         </div>
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
                 <Button onClick={handleAnalysis} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                    Analyser
                </Button>
            </CardFooter>
        </Card>
    );
};

const ComprehensiveAssistant = ({ allData }: { allData: any }) => {
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<CecPlanOutput | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const form = useFormContext<CalculatorValues>();

    const handleGeneration = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        const formValues = form.getValues();
        const requiredFields: (keyof CalculatorValues)[] = ['poids', 'taille', 'sexe', 'age', 'hematocriteInitial', 'hbInitial', 'volumePriming', 'dureeCec'];
        const missingFields = requiredFields.filter(field => !formValues[field]);
        
        if (missingFields.length > 0) {
            setError(`Veuillez remplir les champs suivants pour une analyse complète : ${missingFields.join(', ')}.`);
            setLoading(false);
            return;
        }

        try {
            const input: CecPlanInput = {
                poids: Number(formValues.poids),
                taille: Number(formValues.taille),
                sexe: formValues.sexe,
                age: Number(formValues.age),
                hematocriteInitial: Number(formValues.hematocriteInitial),
                hbInitial: Number(formValues.hbInitial),
                volumePriming: Number(formValues.volumePriming),
                dureeCec: Number(formValues.dureeCec),
                ph: formValues.ph ? Number(formValues.ph) : undefined,
                paco2: formValues.paco2 ? Number(formValues.paco2) : undefined,
                hco3: formValues.hco3 ? Number(formValues.hco3) : undefined,
                k: formValues.k ? Number(formValues.k) : undefined,
                bsa: allData.bsa ? Number(allData.bsa) : undefined,
                debitTheorique: allData.debitTheoriqueLmin ? Number(allData.debitTheoriqueLmin) : undefined,
                hematocritePostPriming: allData.hematocritePostPriming ? Number(allData.hematocritePostPriming) : undefined,
            };
            
            const cecPlan = await generateCecPlan(input);
            setResult(cecPlan);

        } catch (e) {
            console.error(e);
            setError("Une erreur est survenue lors de la génération du plan.");
        } finally {
            setLoading(false);
        }
    };
    
    const getRiskVariant = (risk: 'Faible' | 'Modéré' | 'Élevé') => {
        if (risk === 'Élevé') return 'destructive';
        if (risk === 'Modéré') return 'default';
        return 'default';
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Bot />
                    Assistant Décisionnel IA Complet
                </CardTitle>
                <CardDescription>
                    Génération d'un plan de CEC personnalisé et alertes prédictives en temps réel.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 {result && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-lg mb-2">Alertes Principales</h3>
                            <div className="space-y-2">
                                {result.alerts.map((alert, index) => (
                                    <Alert key={index} variant={getRiskVariant(alert.riskLevel)}>
                                        <ShieldAlert className="h-4 w-4" />
                                        <AlertTitle>Risque {alert.riskLevel}</AlertTitle>
                                        <AlertDescription>{alert.description}</AlertDescription>
                                    </Alert>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg mb-2">Plan de CEC Recommandé</h3>
                            <div className="space-y-4">
                                {result.plan.map((section, index) => (
                                    <div key={index} className="p-4 bg-muted/50 rounded-lg">
                                        <h4 className="font-semibold mb-2">{section.title}</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                            {section.content.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                 <Button onClick={handleGeneration} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                    Générer le Plan de CEC
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
                            <ComprehensiveAssistant allData={results} />
                            <HematologyPrediction />
                            <PerfusionOptimization 
                                bsa={results.bsa}
                                debitTheoriqueLmin={results.debitTheoriqueLmin}
                            />
                            <ComplicationsPrediction 
                                hematocritePostPriming={results.hematocritePostPriming}
                            />
                            <AcidBaseAnalysis />
                        </div>
                    </form>
               </FormProvider>
            </main>
        </>
    );

}

    