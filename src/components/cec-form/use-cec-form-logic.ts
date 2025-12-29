"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse, isValid, differenceInMinutes } from "date-fns";
import { cecFormSchema, type CecFormValues, primingSolutes, type PrimingRow, type CardioplegiaDose, type TimelineEvent } from "./schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { aiPredictionService } from "@/services/ai-prediction";
import { validateReport, generateObservations } from "@/app/actions/knowledge";
import { useVoiceInput, type VoiceCommand } from "@/hooks/use-voice-input";
import { saveCecForm } from "@/services/cec";
import { testData } from './test-data';
import { generatePdf, generatePdfBlob } from "./pdf-generator";
import { toDataURL } from 'qrcode';

interface UseCecFormLogicProps {
    initialData?: CecFormValues;
    isReadOnly?: boolean;
    onFormSave?: (id: string) => void;
    onRiskUpdate?: (risk: number | null) => void;
    totalSteps: number;
}

export function useCecFormLogic({ initialData, isReadOnly = false, onFormSave, onRiskUpdate, totalSteps }: UseCecFormLogicProps) {
    const { toast } = useToast();
    const { user } = useAuth();

    // UI State
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isPrinting, setIsPrinting] = React.useState(false);
    const [isSharing, setIsSharing] = React.useState(false);
    const [qrCodeUrl, setQrCodeUrl] = React.useState('');
    const [shareableLink, setShareableLink] = React.useState('');
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [aiRisk, setAiRisk] = React.useState<number | null>(null);
    const [activeStep, setActiveStep] = React.useState(0);
    const [aiAlerts, setAiAlerts] = React.useState<any[]>([]);
    const [isValidating, setIsValidating] = React.useState(false);
    const [isSummarizing, setIsSummarizing] = React.useState(false);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = React.useState(false);

    // Form Defaults
    const EMPTY_DEFAULTS = {
        date_cec: new Date().toISOString().substring(0, 10),
        perfusionniste: user?.username,
        checklistPreCec: {
            identiteVerifiee: false,
            consentementSigne: false,
            dossierComplet: false,
            allergiesVerifiees: false,
            groupeSanguinConfirme: false,
            oxygenateurVerifie: false,
            circuitVerifie: false,
            canulesDisponibles: false,
            reservoirCardioplegie: false,
            pompesTestees: false,
            hemofiltrationPrete: false,
            heparineDisponible: false,
            protamineDisponible: false,
            primingPrepare: false,
            cardioplegiePrepare: false,
            medicamentsUrgence: false,
            defibrillateurOk: false,
            aspirateurOk: false,
            monitoringConnecte: false,
            analyseurCalibre: false,
            systemeThermiqueTeste: false,
            alarmesTestees: false,
            chirurgienPresent: false,
            anesthesistePresent: false,
            perfusionnistePresent: false,
            instrumentistePresent: false,
            briefingEffectue: false,
            salleOpPrete: false,
            temperatureOk: false,
            eclairageOk: false,
            accesUrgenceDegages: false,
            banqueSangContactee: false,
            notes: "",
        },
        // ... complete with rest of defaults if needed, but for brevity sticking to essentials, 
        // actually zod resolver handles most optional undefineds gracefully, but explicit initials are good.
        // Copying crucial structure from original:
        nom_prenom: "",
        matricule: "",
        date_naissance: "",
        hemodynamicMonitoring: [{}],
        bloodGases: [{}],
        autres_drogues: [],
        cardioplegiaDoses: [],
        priming: primingSolutes.map(solute => ({ id: solute, solute, initial: undefined, ajout: undefined })),
        timelineEvents: [] as TimelineEvent[],
    };

    const form = useForm<CecFormValues>({
        resolver: zodResolver(cecFormSchema),
        defaultValues: initialData || EMPTY_DEFAULTS,
        mode: "onBlur",
    });

    const { watch, setValue, reset, getValues, formState: { isDirty } } = form;

    // --- Voice Control ---
    const handleVoiceCommand = (msg: string, variant: "default" | "destructive" | "success" = "default") => {
        toast({
            title: "Commande Vocale",
            description: msg,
            className: variant === "success" ? "bg-green-100 border-green-500 text-green-800" : undefined
        });
    };

    const dynamicVoiceCommands = React.useMemo(() => {
        const addTimelineEvent = (type: TimelineEvent['type']) => {
            const events = getValues("timelineEvents") || [];
            const now = format(new Date(), 'HH:mm');
            setValue("timelineEvents", [...events, { type, name: type, time: now }], { shouldDirty: true });
            handleVoiceCommand(`Top ${type} enregistré à ${now}`, "success");
        };

        const baseCommands: VoiceCommand[] = [
            {
                command: "Suivant",
                keywords: ["suivant", "next", "après"],
                action: () => {
                    if (activeStep < totalSteps - 1) {
                        setActiveStep(prev => prev + 1);
                        handleVoiceCommand("Navigation vers l'étape suivante");
                    }
                }
            },
            {
                command: "Précédent",
                keywords: ["précédent", "retour", "back", "before"],
                action: () => {
                    if (activeStep > 0) {
                        setActiveStep(prev => prev - 1);
                        handleVoiceCommand("Navigation vers l'étape précédente");
                    }
                }
            },
            {
                command: "Aller à Checklist",
                keywords: ["checklist", "check-list", "vérification"],
                action: () => { setActiveStep(0); handleVoiceCommand("Navigation vers Checklist"); }
            },
            {
                command: "Aller à Patient",
                keywords: ["patient", "identité", "équipe"],
                action: () => { setActiveStep(1); handleVoiceCommand("Navigation vers Patient & Équipe"); }
            },
            {
                command: "Aller à Perfusion",
                keywords: ["perfusion", "gaz", "hémo", "déroulement"],
                action: () => { setActiveStep(4); handleVoiceCommand("Navigation vers Perfusion"); }
            },
        ];

        return [
            ...baseCommands,
            {
                command: "Départ CEC",
                keywords: ["départ c'est c", "départ cec", "départ", "démarrer cec", "start cec", "début cec"],
                action: () => addTimelineEvent("Départ CEC")
            },
            {
                command: "Fin CEC",
                keywords: ["fin cec", "arrêtez cec", "stop cec", "fin c'est c"],
                action: () => addTimelineEvent("Fin CEC")
            },
            {
                command: "Clampage",
                keywords: ["clampage", "cliquez clampage", "clamper", "aorte clampée"],
                action: () => addTimelineEvent("Clampage")
            },
            {
                command: "Déclampage",
                keywords: ["déclampage", "déclamper", "ouvrir aorte"],
                action: () => addTimelineEvent("Déclampage")
            }
        ];
    }, [getValues, setValue, activeStep, totalSteps]);

    const { isListening, toggleListening, lastTranscript } = useVoiceInput({
        commands: dynamicVoiceCommands,
        language: 'fr-FR'
    });

    // --- Effects & Logic ---

    useUnsavedChanges(isDirty && !isSubmitting && !isReadOnly);

    // Load Initial Data
    React.useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    // Watchers
    const poids = watch("poids");
    const taille = watch("taille");
    const age = watch("age");
    const dateNaissance = watch("date_naissance");
    const hte = watch("hte");
    const primingValues = watch("priming");
    const cardioplegiaDoses = watch("cardioplegiaDoses");
    const timelineEvents = watch("timelineEvents") || [];

    // 1. AI Transfusion Prediction
    React.useEffect(() => {
        const hVal = parseFloat(hte || '0');
        if (poids && taille && age && hVal > 0) {
            const timer = setTimeout(async () => {
                const risk = await aiPredictionService.predictTransfusionRisk({
                    poids: poids,
                    taille: taille,
                    age: age,
                    hematocrite: hVal
                });
                setAiRisk(risk);
                onRiskUpdate?.(risk);
            }, 800);
            return () => clearTimeout(timer);
        } else {
            setAiRisk(null);
            onRiskUpdate?.(null);
        }
    }, [poids, taille, age, hte, onRiskUpdate]);

    // 2. BSA & Flow Calculation
    React.useEffect(() => {
        if (poids && taille && poids > 0 && taille > 0) {
            const bsa = 0.007184 * Math.pow(poids, 0.425) * Math.pow(taille, 0.725);
            const debit = bsa * 2.4;
            setValue("surface_corporelle", parseFloat(bsa.toFixed(2)), { shouldValidate: true });
            setValue("debit_theorique", parseFloat(debit.toFixed(2)), { shouldValidate: true });
        } else {
            setValue("surface_corporelle", undefined);
            setValue("debit_theorique", undefined);
        }
    }, [poids, taille, setValue]);

    // 3. Draft Auto-Saving
    React.useEffect(() => {
        if (isReadOnly || initialData?.id) return;
        const draftKey = `cec_draft_${user?.username || 'guest'}`;
        const timer = setTimeout(() => {
            const data = getValues();
            localStorage.setItem(draftKey, JSON.stringify(data));
            window.dispatchEvent(new CustomEvent('cec-draft-updated', { detail: data }));
        }, 2000);
        return () => clearTimeout(timer);
    }, [watch(), user?.username, isReadOnly, initialData, getValues]);

    // 4. Draft Loading
    React.useEffect(() => {
        if (isReadOnly || initialData?.id) return;
        const draftKey = `cec_draft_${user?.username || 'guest'}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (!getValues('nom_prenom')) {
                    reset(parsed);
                    toast({
                        title: "Brouillon récupéré",
                        description: "Votre saisie précédente a été restaurée automatiquement.",
                    });
                }
            } catch (e) {
                console.error("Failed to parse draft", e);
            }
        }
    }, []); // Run once on mount

    // 5. Age Calculation
    React.useEffect(() => {
        if (dateNaissance) {
            let birthDate = parse(dateNaissance, 'yyyy-MM-dd', new Date());
            if (!isValid(birthDate)) {
                birthDate = parse(dateNaissance, 'dd/MM/yyyy', new Date());
            }
            if (isValid(birthDate)) {
                const today = new Date();
                let ageCalc = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    ageCalc--;
                }
                setValue("age", ageCalc >= 0 ? ageCalc : undefined, { shouldValidate: true });
            } else {
                setValue("age", undefined);
            }
        }
    }, [dateNaissance, setValue]);

    // 6. Totals Calculations (Priming, Cardio)
    React.useEffect(() => {
        const primingArray = Array.isArray(primingValues) ? primingValues : [];
        const total = primingArray.reduce((acc, row) => {
            const initialValue = Number(row?.initial) || 0;
            const ajoutValue = Number(row?.ajout) || 0;
            return acc + initialValue + ajoutValue;
        }, 0);
        setValue('entrees_priming', total > 0 ? total : undefined, { shouldDirty: true, shouldValidate: true });
    }, [primingValues, setValue]);

    React.useEffect(() => {
        const dosesArray = Array.isArray(cardioplegiaDoses) ? cardioplegiaDoses : [];
        const total = dosesArray.reduce((acc, dose) => acc + (Number(dose?.dose) || 0), 0);
        setValue('entrees_cardioplegie', total > 0 ? total : undefined, { shouldDirty: true, shouldValidate: true });
    }, [cardioplegiaDoses, setValue]);

    // 7. Timeline Durations
    React.useEffect(() => {
        if (!timelineEvents.length) return;
        const findTime = (type: string) => {
            const event = timelineEvents.find(e => e.type === type);
            if (!event?.time) return null;
            return parse(event.time, 'HH:mm', new Date());
        };
        const departCec = findTime('Départ CEC');
        const finCec = findTime('Fin CEC');
        const clampage = findTime('Clampage');
        const declampage = findTime('Déclampage');

        if (departCec && finCec && isValid(departCec) && isValid(finCec)) {
            const diff = differenceInMinutes(finCec, departCec);
            setValue('duree_cec', Math.max(0, diff).toString(), { shouldDirty: true });
        }
        if (clampage && declampage && isValid(clampage) && isValid(declampage)) {
            const diff = differenceInMinutes(declampage, clampage);
            setValue('duree_clampage', Math.max(0, diff).toString(), { shouldDirty: true });
        }
        if (declampage && finCec && isValid(declampage) && isValid(finCec)) {
            const diff = differenceInMinutes(finCec, declampage);
            setValue('duree_assistance', Math.max(0, diff).toString(), { shouldDirty: true });
        }
    }, [timelineEvents, setValue]);

    // --- Handlers ---

    const handleFillWithTestData = () => {
        reset(testData);
        toast({
            title: "Données de test chargées",
            description: "Le formulaire a été rempli avec les données de démonstration.",
        });
    };

    const handleAiCheck = async () => {
        setIsValidating(true);
        try {
            const data = getValues();
            const result = await validateReport(data);
            if (result.success) {
                setAiAlerts(result.data.alerts || []);
                if (result.data.alerts?.length === 0) {
                    toast({ title: "Cohérence validée", description: "L'IA n'a détecté aucune anomalie majeure." });
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Erreur Analyse", description: error.message, variant: "destructive" });
        } finally {
            setIsValidating(false);
        }
    };

    const handleGenerateSummary = async () => {
        setIsSummarizing(true);
        try {
            const data = getValues();
            const result = await generateObservations(data);
            if (result.success) {
                setValue('observations', result.data, { shouldDirty: true });
                toast({ title: "Résumé généré", description: "Les observations ont été mises à jour." });
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Erreur Génération", description: error.message, variant: "destructive" });
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleGeneratePdf = async () => {
        setIsPrinting(true);
        try {
            const data = getValues();
            await generatePdf(data);
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({ title: 'Erreur PDF', description: "Une erreur est survenue lors de la création du PDF.", variant: 'destructive' });
        } finally {
            setIsPrinting(false);
        }
    }

    const handleShare = async () => {
        setIsSharing(true);
        try {
            const data = getValues();
            const pdfBlob = await generatePdfBlob(data);
            const formData = new FormData();
            formData.append('file', pdfBlob, `${data.nom_prenom?.replace(/ /g, '_')}_${data.matricule}.pdf`);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error('File upload failed');
            const result = await response.json();
            const link = result.data.url;
            setShareableLink(link);
            const qrUrl = await toDataURL(link, { width: 300 });
            setQrCodeUrl(qrUrl);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error sharing file:", error);
            toast({ title: 'Erreur de Partage', description: "Une erreur est survenue lors du partage du fichier.", variant: 'destructive' });
        } finally {
            setIsSharing(false);
        }
    };

    async function onSubmit(data: CecFormValues) {
        setIsSubmitting(true);
        try {
            const fullData = {
                ...data,
                createdByUsername: initialData?.id ? initialData.createdByUsername : user?.username,
                lastModifiedByUsername: user?.username,
            };
            const savedId = await saveCecForm(fullData);
            const draftKey = `cec_draft_${user?.username || 'guest'}`;
            localStorage.removeItem(draftKey);
            window.dispatchEvent(new CustomEvent('cec-draft-updated', { detail: null }));

            toast({
                title: "Sauvegarde réussie !",
                description: "Le compte rendu a été enregistré avec succès.",
            });

            if (onFormSave) {
                onFormSave(savedId);
            } else if (savedId && !initialData?.id) {
                reset({ ...data, id: savedId });
                window.history.replaceState(null, '', `/compte-rendu/${savedId}?mode=edit`);
            }
        } catch (error) {
            console.error("Failed to save form:", error);
            toast({
                title: "Erreur de sauvegarde",
                description: "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleClearForm = () => {
        form.reset(EMPTY_DEFAULTS);
        setActiveStep(0);
        toast({
            title: "Formulaire vidé",
            description: "Toutes les données ont été effacées.",
        });
        setIsClearConfirmOpen(false);
    }

    return {
        form,
        activeStep,
        setActiveStep,
        isListening,
        toggleListening,
        lastTranscript,
        aiRisk,
        aiAlerts,
        isValidating,
        isSummarizing,
        handleAiCheck,
        handleGenerateSummary,
        isSubmitting,
        isPrinting,
        isSharing,
        handleGeneratePdf,
        handleShare,
        onSubmit,
        handleFillWithTestData,
        isModalOpen,
        setIsModalOpen,
        qrCodeUrl,
        shareableLink,
        isClearConfirmOpen,
        setIsClearConfirmOpen,
        handleClearForm,
        isDirty
    };
}
