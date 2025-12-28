"use client";

import * as React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse, isValid, differenceInMinutes } from "date-fns";
import { cecFormSchema, type CecFormValues, primingSolutes, type PrimingRow, type CardioplegiaDose } from "./schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Activity, Users, FileText, Printer, Save, Syringe, TestTube, Loader2, Share2, Brain, CheckCircle2, ShieldAlert, Wand2, AlertCircle, Info, RotateCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PatientInfo } from "./patient-info";
import { TeamInfo } from "./team-info";
import { MaterielTab } from "./materiel-tab";
import { DeroulementTab } from "./deroulement-tab";
import { BilanTab } from "./bilan-tab";
import { PreOpBilan } from "./pre-op-bilan";
import { ExamensComplementaires } from "./examens-complementaires";
import { ClinicalDetails } from "./clinical-details";
import { Sidebar } from "./sidebar";
import { ClipboardList } from "lucide-react";
import { ChecklistTab } from "./checklist-tab";
import { saveCecForm } from "@/services/cec";
import { testData } from './test-data';
import { generatePdf, generatePdfBlob } from "./pdf-generator";
import { useAuth } from "@/hooks/use-auth";
import { toDataURL } from 'qrcode';
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { aiPredictionService } from "@/services/ai-prediction";
import { validateReport, generateObservations } from "@/app/actions/knowledge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export function CECForm({ initialData, isReadOnly = false, onFormSave, onRiskUpdate }: { initialData?: CecFormValues; isReadOnly?: boolean; onFormSave?: (id: string) => void; onRiskUpdate?: (risk: number | null) => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
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
    nom_prenom: "",
    matricule: "",
    date_naissance: "",
    age: undefined,
    sexe: undefined,
    poids: undefined,
    taille: undefined,
    surface_corporelle: undefined,
    debit_theorique: undefined,
    origine: "",
    diagnostic: "",
    intervention: "",
    operateur: "",
    aide_op: "",
    instrumentiste: "",
    panseur: "",
    anesthesiste: "",
    technicien_anesthesie: "",
    gs: "",
    hte: "",
    hb: "",
    na: "",
    k: "",
    creat: "",
    protides: "",
    echo_coeur: "",
    coro: "",
    oxygenateur: "",
    circuit: "",
    canule_art: "",
    canule_vein: "",
    canule_vein_2: "",
    canule_cardio: "",
    canule_decharge: "",
    kit_hemo: "",
    heparine_circuit: undefined,
    heparine_malade: undefined,
    heparine_total: undefined,
    remplacement_valvulaire: undefined,
    valve_aortique: false,
    valve_mitrale: false,
    valve_tricuspide: false,
    hemodynamicMonitoring: [{}],
    bloodGases: [{}],
    autres_drogues: [],
    cardioplegiaDoses: [],
    priming: primingSolutes.map(solute => ({ id: solute, solute, initial: undefined, ajout: undefined })),
    duree_assistance: "",
    duree_cec: "",
    duree_clampage: "",
    diurese_totale: undefined,
    saignements: undefined,
    type_cardioplegie: undefined,
    autre_cardioplegie: "",
    entrees_apports_anesthesiques: undefined,
    entrees_priming: undefined,
    entrees_cardioplegie: undefined,
    sorties_diurese: undefined,
    sorties_hemofiltration: undefined,
    sorties_aspiration_perdue: undefined,
    sorties_sang_pompe_residuel: undefined,
    observations: "",
  };

  const form = useForm<CecFormValues>({
    resolver: zodResolver(cecFormSchema),
    defaultValues: initialData || EMPTY_DEFAULTS,
    mode: "onBlur",
  });

  const { watch, setValue, reset, getValues, formState: { isDirty } } = form;

  useUnsavedChanges(isDirty && !isSubmitting && !isReadOnly);

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

      if (!response.ok) {
        throw new Error('File upload failed');
      }

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

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const poids = watch("poids");
  const taille = watch("taille");
  const age = watch("age"); // Watch age directly
  const dateNaissance = watch("date_naissance");
  const hte = watch("hte");
  const primingValues = watch("priming");
  const cardioplegiaDoses = watch("cardioplegiaDoses");
  const bloodGases = watch("bloodGases") || [];

  // AI Transfusion Prediction Effect
  React.useEffect(() => {
    const hVal = parseFloat(hte || '0');
    // Require weight, height, age, and valid Hct to predict
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
      }, 800); // 800ms debounce
      return () => clearTimeout(timer);
    } else {
      setAiRisk(null);
      onRiskUpdate?.(null);
    }
  }, [poids, taille, age, hte]);

  React.useEffect(() => {
    if (poids && taille && poids > 0 && taille > 0) {
      // Formule de Du Bois
      const bsa = 0.007184 * Math.pow(poids, 0.425) * Math.pow(taille, 0.725);
      const debit = bsa * 2.4;
      setValue("surface_corporelle", parseFloat(bsa.toFixed(2)), { shouldValidate: true });
      setValue("debit_theorique", parseFloat(debit.toFixed(2)), { shouldValidate: true });

    } else {
      setValue("surface_corporelle", undefined);
      setValue("debit_theorique", undefined);
    }
  }, [poids, taille, setValue]);

  // Draft Auto-save Logic
  React.useEffect(() => {
    if (isReadOnly || initialData?.id) return;

    const draftKey = `cec_draft_${user?.username || 'guest'}`;
    const timer = setTimeout(() => {
      const data = getValues();
      localStorage.setItem(draftKey, JSON.stringify(data));
      // Notify other components in the same tab
      window.dispatchEvent(new CustomEvent('cec-draft-updated', { detail: data }));
    }, 2000);

    return () => clearTimeout(timer);
  }, [watch(), user?.username, isReadOnly]);

  // Load Draft
  React.useEffect(() => {
    if (isReadOnly || initialData?.id) return;
    const draftKey = `cec_draft_${user?.username || 'guest'}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Ask user if they want to restore? For now, we auto-load if form is empty
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
  }, []);

  React.useEffect(() => {
    if (dateNaissance) {
      // Handles both 'yyyy-MM-dd' and 'dd/MM/yyyy'
      let birthDate = parse(dateNaissance, 'yyyy-MM-dd', new Date());
      if (!isValid(birthDate)) {
        birthDate = parse(dateNaissance, 'dd/MM/yyyy', new Date());
      }

      if (isValid(birthDate)) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setValue("age", age >= 0 ? age : undefined, {
          shouldValidate: true,
        });
      } else {
        setValue("age", undefined);
      }
    } else {
      // Don't reset age if it's set manually or via API, only if dateNaissance maps to it.
      // But here dateNaissance drives age. We won't clear it forcefully to respect manual input if logic allows
      // For now, keep existing logic but ensure age is watched.
    }
  }, [dateNaissance, setValue]);

  React.useEffect(() => {
    const primingArray = Array.isArray(primingValues) ? primingValues : [];
    const total = primingArray.reduce((acc, row: Partial<PrimingRow>) => {
      const initialValue = Number(row?.initial) || 0;
      const ajoutValue = Number(row?.ajout) || 0;
      return acc + initialValue + ajoutValue;
    }, 0);
    setValue('entrees_priming', total > 0 ? total : undefined, { shouldDirty: true, shouldValidate: true });
  }, [primingValues, setValue]);

  React.useEffect(() => {
    const dosesArray = Array.isArray(cardioplegiaDoses) ? cardioplegiaDoses : [];
    const total = dosesArray.reduce((acc, dose: Partial<CardioplegiaDose>) => acc + (Number(dose?.dose) || 0), 0);
    setValue('entrees_cardioplegie', total > 0 ? total : undefined, { shouldDirty: true, shouldValidate: true });
  }, [cardioplegiaDoses, setValue]);

  const timelineEvents = watch("timelineEvents") || [];
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
      // Handle mid-night crossing if needed? (optional, usually cases don't cross midnight in a way HH:mm break)
      setValue('duree_cec', Math.max(0, diff).toString(), { shouldDirty: true });
    }

    if (clampage && declampage && isValid(clampage) && isValid(declampage)) {
      const diff = differenceInMinutes(declampage, clampage);
      setValue('duree_clampage', Math.max(0, diff).toString(), { shouldDirty: true });
    }

    // Calculate assistance duration (Déclampage to Fin CEC)
    if (declampage && finCec && isValid(declampage) && isValid(finCec)) {
      const diff = differenceInMinutes(finCec, declampage);
      setValue('duree_assistance', Math.max(0, diff).toString(), { shouldDirty: true });
    }
  }, [timelineEvents, setValue]);


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

  async function onSubmit(data: CecFormValues) {
    setIsSubmitting(true);
    try {
      const fullData = {
        ...data,
        createdByUsername: initialData?.id ? initialData.createdByUsername : user?.username,
        lastModifiedByUsername: user?.username,
      };
      const savedId = await saveCecForm(fullData);

      // Clear draft on success
      const draftKey = `cec_draft_${user?.username || 'guest'}`;
      localStorage.removeItem(draftKey);
      // Notify sidebar that draft is cleared
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

  const steps = [
    {
      title: "Checklist Pré-CEC",
      icon: ShieldCheck,
      content: <ChecklistTab isReadOnly={isReadOnly} />
    },
    {
      title: "Patient & Équipe", icon: Users, content: (
        <fieldset disabled={isReadOnly} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Informations Patient & Détails Cliniques
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6 pt-6">
              <PatientInfo />
              <ClinicalDetails />
            </CardContent>
          </Card>

          <TeamInfo />
        </fieldset>
      )
    },
    {
      title: "Bilan Pré-op", icon: TestTube, content: (
        <fieldset disabled={isReadOnly} className="space-y-6">
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="space-y-6 pt-6">
              <PreOpBilan />
              <ExamensComplementaires />
            </CardContent>
          </Card>
        </fieldset>
      )
    },
    { title: "Matériel", icon: Syringe, content: <MaterielTab isReadOnly={isReadOnly} /> },
    { title: "Perfusion (Gaz/Hemodyn)", icon: Activity, content: <DeroulementTab isReadOnly={isReadOnly} /> },
    { title: "Bilan Final", icon: FileText, content: <BilanTab isReadOnly={isReadOnly} /> },
  ];

  return (
    <FormProvider {...form}>
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Main Form Content */}
        <div className="flex-1 w-full space-y-6">
          {/* Stepper Header */}
          <div className="bg-card border rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-6 px-4">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = idx < activeStep;
                const isActive = idx === activeStep;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setActiveStep(idx)}>
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center transition-all border-2",
                      isActive ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" :
                        isCompleted ? "bg-emerald-100 border-emerald-500 text-emerald-600" :
                          "bg-muted border-transparent text-muted-foreground"
                    )}>
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-bold hidden md:block",
                      isActive ? "text-primary" : isCompleted ? "text-emerald-600" : "text-muted-foreground"
                    )}>{step.title}</span>
                  </div>
                );
              })}
            </div>

            <div className="relative h-2 bg-muted rounded-full overflow-hidden mx-4">
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
                style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 print:hidden" autoComplete="off">
            <div className="min-h-[400px] animate-in fade-in slide-in-from-right-4 duration-500">
              {steps[activeStep].content}
            </div>

            <footer className="flex justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(prev => prev - 1)}
                  className="rounded-xl"
                >
                  Précédent
                </Button>
                {!isReadOnly && (
                  <>
                    <Button type="button" variant="ghost" onClick={handleFillWithTestData} className="hidden sm:flex">
                      <TestTube className="mr-2 h-4 w-4" /> Test JSON
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      onClick={() => setIsClearConfirmOpen(true)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" /> Vider
                    </Button>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <div className="flex items-center gap-1 sm:gap-2 mr-2">
                  <Button type="button" variant="secondary" size="icon" onClick={handleGeneratePdf} disabled={isPrinting} className="rounded-xl sm:w-auto sm:px-4">
                    {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 sm:mr-2" />}
                    <span className="hidden sm:inline">Exporter PDF</span>
                  </Button>
                  <Button type="button" variant="secondary" size="icon" onClick={handleShare} disabled={isSharing} className="rounded-xl sm:w-auto sm:px-4">
                    {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4 sm:mr-2" />}
                    <span className="hidden sm:inline">Partager</span>
                  </Button>
                </div>

                {activeStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() => setActiveStep(prev => prev + 1)}
                    className="rounded-xl px-8 shadow-lg shadow-primary/20"
                  >
                    Suivant
                  </Button>
                ) : (
                  !isReadOnly && (
                    <Button type="submit" disabled={isSubmitting} className="rounded-xl px-8 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Finaliser
                    </Button>
                  )
                )}
              </div>
            </footer>
          </form>
        </div>

        {/* Real-time Monitoring Sidebar (New Revolutionized Version) */}
        <Sidebar
          watch={watch}
          activeStep={activeStep}
          aiRisk={aiRisk}
          isValidating={isValidating}
          isSummarizing={isSummarizing}
          aiAlerts={aiAlerts}
          onAiCheck={handleAiCheck}
          onGenerateSummary={handleGenerateSummary}
          isDirty={isDirty}
        />
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager le Compte Rendu</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" />}
            <p className="mt-4 text-sm text-muted-foreground">Scannez le code QR pour obtenir le lien</p>
            {shareableLink && (
              <div className="mt-4 w-full">
                <input type="text" readOnly value={shareableLink} className="w-full rounded-md border bg-muted px-3 py-2 text-sm" />
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(shareableLink);
                    toast({ title: 'Copié', description: 'Le lien a été copié dans le presse-papiers.' });
                  }}
                >
                  Copier le lien
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <RotateCcw className="h-5 w-5" />
              Confirmation de réinitialisation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400 py-2">
              Attention ! Cette action est irréversible. Toutes les données saisies dans le formulaire (équipe médicale, informations patient, gaz du sang, etc.) seront définitivement effacées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-slate-200">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-200"
              onClick={() => {
                form.reset(EMPTY_DEFAULTS);
                setActiveStep(0);
                toast({
                  title: "Formulaire vidé",
                  description: "Toutes les données ont été effacées.",
                });
              }}
            >
              Vider tout le formulaire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  );
}