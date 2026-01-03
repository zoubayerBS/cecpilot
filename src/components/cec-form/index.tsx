"use client";

import * as React from "react";
import { FormProvider } from "react-hook-form";
import { type CecFormValues } from "./schema";
import { Button } from "../ui/button";
import { Activity, Users, FileText, Syringe, TestTube, Share2, ShieldCheck, ClipboardList, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientInfo } from "./patient-info";
import { TeamInfo } from "./team-info";
import { MaterielTab } from "./materiel-tab";
import { DeroulementTab } from "./deroulement-tab";
import { BilanTab } from "./bilan-tab";
import { PreOpBilan } from "./pre-op-bilan";
import { ExamensComplementaires } from "./examens-complementaires";
import { ClinicalDetails } from "./clinical-details";
import { Sidebar } from "./sidebar";
import { ChecklistTab } from "./checklist-tab";
import { useToast } from "@/hooks/use-toast";

import { CecFormHeader } from "./form-header";
import { CecFormFooter } from "./form-footer";
import { useCecFormLogic } from "./use-cec-form-logic";

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
                <ClipboardList className="h-6 w-6" />
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

  const {
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
  } = useCecFormLogic({
    initialData,
    isReadOnly,
    onFormSave,
    onRiskUpdate,
    totalSteps: steps.length
  });

  return (
    <FormProvider {...form}>
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-6">

          <CecFormHeader
            steps={steps}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            isListening={isListening}
            toggleListening={toggleListening}
            lastTranscript={lastTranscript}
          />

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 print:hidden" autoComplete="off">
            <div className="min-h-[400px] animate-in fade-in slide-in-from-right-4 duration-500">
              {steps[activeStep].content}
            </div>

            <CecFormFooter
              activeStep={activeStep}
              totalSteps={steps.length}
              isReadOnly={isReadOnly}
              isSubmitting={isSubmitting}
              isPrinting={isPrinting}
              isSharing={isSharing}
              onPrevious={() => setActiveStep(prev => prev - 1)}
              onNext={() => setActiveStep(prev => prev + 1)}
              onGeneratePdf={handleGeneratePdf}
              onShare={handleShare}
              onFillTestData={handleFillWithTestData}
              onClear={() => setIsClearConfirmOpen(true)}
            />
          </form>
        </div>

        <Sidebar
          watch={form.watch}
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
              <RotateCcw className="h-6 w-6" />
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
              onClick={handleClearForm}
            >
              Vider tout le formulaire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  );
}