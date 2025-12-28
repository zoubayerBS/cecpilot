"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    ShieldCheck,
    User,
    Package,
    Pill,
    Zap,
    Users,
    Building,
    CheckCircle2,
    AlertCircle,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface ChecklistItem {
    id: string;
    label: string;
    field: string;
}

interface ChecklistSection {
    title: string;
    icon: React.ElementType;
    items: ChecklistItem[];
    color: string;
}

const checklistSections: ChecklistSection[] = [
    {
        title: "Vérifications Patient",
        icon: User,
        color: "text-blue-600",
        items: [
            { id: "1", label: "Identité patient vérifiée (nom, prénom, date de naissance)", field: "identiteVerifiee" },
            { id: "2", label: "Consentement éclairé signé", field: "consentementSigne" },
            { id: "3", label: "Dossier médical complet disponible", field: "dossierComplet" },
            { id: "4", label: "Allergies vérifiées", field: "allergiesVerifiees" },
            { id: "5", label: "Groupe sanguin confirmé", field: "groupeSanguinConfirme" },
        ],
    },
    {
        title: "Vérifications Matériel",
        icon: Package,
        color: "text-purple-600",
        items: [
            { id: "6", label: "Oxygénateur vérifié et testé", field: "oxygenateurVerifie" },
            { id: "7", label: "Circuit assemblé et vérifié (absence de fuites)", field: "circuitVerifie" },
            { id: "8", label: "Canules disponibles (artérielle, veineuse, cardioplégie)", field: "canulesDisponibles" },
            { id: "9", label: "Réservoir de cardioplégie prêt", field: "reservoirCardioplegie" },
            { id: "10", label: "Pompes testées (débit, alarmes)", field: "pompesTestees" },
            { id: "11", label: "Système d'hémofiltration prêt (si nécessaire)", field: "hemofiltrationPrete" },
        ],
    },
    {
        title: "Vérifications Médicaments & Solutions",
        icon: Pill,
        color: "text-green-600",
        items: [
            { id: "12", label: "Héparine disponible (dose calculée)", field: "heparineDisponible" },
            { id: "13", label: "Protamine disponible", field: "protamineDisponible" },
            { id: "14", label: "Solutions de priming préparées", field: "primingPrepare" },
            { id: "15", label: "Cardioplégie préparée", field: "cardioplegiePrepare" },
            { id: "16", label: "Médicaments d'urgence disponibles", field: "medicamentsUrgence" },
        ],
    },
    {
        title: "Vérifications Équipement de Sécurité",
        icon: Zap,
        color: "text-orange-600",
        items: [
            { id: "17", label: "Défibrillateur opérationnel", field: "defibrillateurOk" },
            { id: "18", label: "Aspirateur chirurgical fonctionnel", field: "aspirateurOk" },
            { id: "19", label: "Monitoring hémodynamique connecté", field: "monitoringConnecte" },
            { id: "20", label: "Analyseur de gaz du sang calibré", field: "analyseurCalibre" },
            { id: "21", label: "Système de réchauffement/refroidissement testé", field: "systemeThermiqueTeste" },
            { id: "22", label: "Alarmes testées", field: "alarmesTestees" },
        ],
    },
    {
        title: "Vérifications Équipe",
        icon: Users,
        color: "text-pink-600",
        items: [
            { id: "23", label: "Chirurgien présent", field: "chirurgienPresent" },
            { id: "24", label: "Anesthésiste présent", field: "anesthesistePresent" },
            { id: "25", label: "Perfusionniste prêt", field: "perfusionnistePresent" },
            { id: "26", label: "Instrumentiste prêt", field: "instrumentistePresent" },
            { id: "27", label: "Briefing d'équipe effectué", field: "briefingEffectue" },
        ],
    },
    {
        title: "Vérifications Environnement",
        icon: Building,
        color: "text-cyan-600",
        items: [
            { id: "28", label: "Salle opératoire prête", field: "salleOpPrete" },
            { id: "29", label: "Température salle contrôlée", field: "temperatureOk" },
            { id: "30", label: "Éclairage optimal", field: "eclairageOk" },
            { id: "31", label: "Accès d'urgence dégagés", field: "accesUrgenceDegages" },
            { id: "32", label: "Banque de sang contactée", field: "banqueSangContactee" },
        ],
    },
];

export function ChecklistTab({ isReadOnly = false }: { isReadOnly?: boolean }) {
    const { watch, setValue } = useFormContext();
    const { user } = useAuth();
    const checklist = watch("checklistPreCec") || {};

    // Calculate progress
    const totalItems = checklistSections.reduce((sum, section) => sum + section.items.length, 0);
    const completedItems = checklistSections.reduce(
        (sum, section) => sum + section.items.filter((item) => checklist[item.field] === true).length,
        0
    );
    const progress = Math.round((completedItems / totalItems) * 100);
    const isComplete = progress === 100;

    const handleCheckAll = () => {
        const allChecked: any = {
            completedAt: new Date().toISOString(),
            completedBy: user?.username || "Unknown",
        };

        checklistSections.forEach((section) => {
            section.items.forEach((item) => {
                allChecked[item.field] = true;
            });
        });

        setValue("checklistPreCec", allChecked, { shouldDirty: true });
    };

    const handleCheckboxChange = (field: string, checked: boolean) => {
        setValue(`checklistPreCec.${field}`, checked, { shouldDirty: true });

        // Update completion metadata if all items are checked
        if (checked) {
            const newChecklist = { ...checklist, [field]: true };
            const newCompleted = checklistSections.reduce(
                (sum, section) => sum + section.items.filter((item) => newChecklist[item.field] === true).length,
                0
            );

            if (newCompleted === totalItems) {
                setValue("checklistPreCec.completedAt", new Date().toISOString(), { shouldDirty: true });
                setValue("checklistPreCec.completedBy", user?.username || "Unknown", { shouldDirty: true });
            }
        }
    };

    return (
        <fieldset disabled={isReadOnly} className="space-y-6">
            <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Checklist de Sécurité Pré-CEC</CardTitle>
                                <CardDescription className="mt-1">
                                    Vérification complète avant le démarrage de la circulation extracorporelle
                                </CardDescription>
                            </div>
                        </div>
                        {isComplete ? (
                            <Badge className="bg-emerald-500 text-white px-4 py-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Complété
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="px-4 py-2 text-sm">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                En cours
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">Progression</span>
                            <span className={cn(
                                "font-bold",
                                isComplete ? "text-emerald-600" : "text-muted-foreground"
                            )}>
                                {completedItems} / {totalItems} items
                            </span>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <p className="text-xs text-muted-foreground text-right">{progress}% complété</p>
                    </div>

                    {/* Quick Actions */}
                    {!isReadOnly && !isComplete && (
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={handleCheckAll}
                                variant="outline"
                                className="flex-1"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Tout valider
                            </Button>
                        </div>
                    )}

                    {/* Completion Info */}
                    {checklist.completedAt && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <Clock className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm text-emerald-700 dark:text-emerald-400">
                                Complété le {new Date(checklist.completedAt).toLocaleString("fr-FR")}
                                {checklist.completedBy && ` par ${checklist.completedBy}`}
                            </span>
                        </div>
                    )}

                    {/* Checklist Sections */}
                    <Accordion type="multiple" defaultValue={["section-0", "section-1"]} className="space-y-2">
                        {checklistSections.map((section, sectionIndex) => {
                            const sectionCompleted = section.items.filter((item) => checklist[item.field] === true).length;
                            const sectionProgress = Math.round((sectionCompleted / section.items.length) * 100);
                            const Icon = section.icon;

                            return (
                                <AccordionItem
                                    key={sectionIndex}
                                    value={`section-${sectionIndex}`}
                                    className="border rounded-lg overflow-hidden"
                                >
                                    <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-3">
                                                <Icon className={cn("h-5 w-5", section.color)} />
                                                <span className="font-semibold">{section.title}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-muted-foreground">
                                                    {sectionCompleted}/{section.items.length}
                                                </span>
                                                {sectionProgress === 100 && (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                )}
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4 pt-2">
                                        <div className="space-y-3">
                                            {section.items.map((item) => {
                                                const isChecked = checklist[item.field] === true;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={cn(
                                                            "flex items-start gap-3 p-3 rounded-lg border transition-all",
                                                            isChecked
                                                                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                                                : "bg-muted/30 border-transparent hover:border-muted-foreground/20"
                                                        )}
                                                    >
                                                        <Checkbox
                                                            id={`checklist-${item.id}`}
                                                            checked={isChecked}
                                                            onCheckedChange={(checked) =>
                                                                handleCheckboxChange(item.field, checked as boolean)
                                                            }
                                                            className="mt-0.5"
                                                        />
                                                        <label
                                                            htmlFor={`checklist-${item.id}`}
                                                            className={cn(
                                                                "text-sm cursor-pointer flex-1",
                                                                isChecked
                                                                    ? "text-emerald-700 dark:text-emerald-400 font-medium"
                                                                    : "text-foreground"
                                                            )}
                                                        >
                                                            {item.label}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>

                    {/* Notes Section */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notes / Remarques</label>
                        <Textarea
                            placeholder="Ajoutez des remarques ou observations concernant la checklist..."
                            value={checklist.notes || ""}
                            onChange={(e) => setValue("checklistPreCec.notes", e.target.value, { shouldDirty: true })}
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                </CardContent>
            </Card>
        </fieldset>
    );
}
