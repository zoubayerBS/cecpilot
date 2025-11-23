"use client";

import * as React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cecFormSchema, type CecFormValues, primingSolutes, type PrimingRow, type CardioplegiaDose } from "./schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Activity, Users, FileText, Printer, Save, Syringe, TestTube, Loader2, Share2 } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientInfo } from "./patient-info";
import { TeamInfo } from "./team-info";
import { MaterielTab } from "./materiel-tab";
import { DeroulementTab } from "./deroulement-tab";
import { BilanTab } from "./bilan-tab";
import { PreOpBilan } from "./pre-op-bilan";
import { ExamensComplementaires } from "./examens-complementaires";
import { saveCecForm } from "@/services/cec";
import { testData } from './test-data';
import { generatePdf, generatePdfBlob } from "./pdf-generator";
import { useAuth } from "@/hooks/use-auth";
import { toDataURL } from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export function CECForm({ initialData, isReadOnly = false, onFormSave }: { initialData?: CecFormValues; isReadOnly?: boolean; onFormSave?: (id: string) => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');
  const [shareableLink, setShareableLink] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  const form = useForm<CecFormValues>({
    resolver: zodResolver(cecFormSchema),
    defaultValues: initialData || {
      date_cec: new Date().toISOString().substring(0, 10),
      perfusionniste: user?.username,
      nom_prenom: "",
      poids: undefined,
      taille: undefined,
      surface_corporelle: undefined,
      hemodynamicMonitoring: [{}],
      bloodGases: [{}],
      autres_drogues: [],
      cardioplegiaDoses: [],
      priming: primingSolutes.map(solute => ({ id: solute, solute, initial: undefined, ajout: undefined })),
    },
    mode: "onBlur",
  });

  const { watch, setValue, reset, getValues } = form;

  const handleGeneratePdf = async () => {
    setIsPrinting(true);
    try {
        const data = getValues();
        await generatePdf(data);
    } catch(error) {
        console.error("Error generating PDF:", error);
        toast({ title: 'Erreur PDF', description: "Une erreur est survenue lors de la création du PDF.", variant: 'destructive'});
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
  const dateNaissance = watch("date_naissance");
  const primingValues = watch("priming");
  const cardioplegiaDoses = watch("cardioplegiaDoses");

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

  React.useEffect(() => {
    if (dateNaissance) {
      try {
        const birthDate = new Date(dateNaissance);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        setValue("age", age >= 0 ? age : undefined, { shouldValidate: true });
      } catch (e) {
        setValue("age", undefined);
      }
    } else {
        setValue("age", undefined);
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


  const handleFillWithTestData = () => {
    reset(testData);
    toast({
      title: "Données de test chargées",
      description: "Le formulaire a été rempli avec les données de démonstration.",
    });
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
        toast({
            title: "Sauvegarde réussie !",
            description: "Le compte rendu a été enregistré avec succès.",
        });
        
        if (onFormSave) {
          onFormSave(savedId);
        } else if (savedId && !initialData?.id) {
          // If a new form is created, update the URL
          reset({ ...data, id: savedId }); // update form state with new ID
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

  return (
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 print:hidden" autoComplete="off">

            <Tabs defaultValue="patient-equipe">
                <TabsList className="h-auto w-full justify-around bg-card">
                    <TabsTrigger value="patient-equipe" className="flex flex-col h-full gap-1 p-3">
                        <Users className="size-5" />
                        <span>Patient & Équipe</span>
                    </TabsTrigger>
                    <TabsTrigger value="materiel" className="flex flex-col h-full gap-1 p-3">
                        <Syringe className="size-5" />
                        <span>Matériel & Drogues</span>
                    </TabsTrigger>
                    <TabsTrigger value="deroulement" className="flex flex-col h-full gap-1 p-3">
                        <Activity className="size-5" />
                       <span>Déroulement CEC</span>
                    </TabsTrigger>
                    <TabsTrigger value="bilan" className="flex flex-col h-full gap-1 p-3">
                        <FileText className="size-5" />
                        <span>Bilan & Observations</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="patient-equipe">
                    <fieldset disabled={isReadOnly} className="space-y-8 py-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informations Générales</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
                                <PatientInfo />
                                <div className="space-y-8">
                                    <TeamInfo />
                                    <PreOpBilan />
                                    <ExamensComplementaires />
                                </div>
                            </CardContent>
                        </Card>
                    </fieldset>
                </TabsContent>

                <TabsContent value="materiel">
                    <MaterielTab isReadOnly={isReadOnly} />
                </TabsContent>

                <TabsContent value="deroulement">
                    <DeroulementTab isReadOnly={isReadOnly} />
                </TabsContent>

                <TabsContent value="bilan">
                    <BilanTab isReadOnly={isReadOnly} />
                </TabsContent>
            </Tabs>

            <footer className="flex flex-wrap justify-end items-center gap-4 py-8 border-t">
              {!isReadOnly && (
                <>
                  <Button type="button" variant="ghost" onClick={handleFillWithTestData}>
                    <TestTube className="mr-2" />Remplir pour Test
                  </Button>
                </>
              )}
               <Button type="button" variant="secondary" onClick={handleGeneratePdf} disabled={isPrinting}>
                  {isPrinting ? <Loader2 className="mr-2 animate-spin" /> : <Printer className="mr-2" />}
                  PDF
               </Button>
               <Button type="button" variant="secondary" onClick={handleShare} disabled={isSharing}>
                  {isSharing ? <Loader2 className="mr-2 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                  Partager
               </Button>
              
              {!isReadOnly && (
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2" />
                    )}
                    Enregistrer
                </Button>
              )}
            </footer>
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
        </form>
      </FormProvider>
  );
}