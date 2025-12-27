
"use client";

import * as React from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import type { CecFormValues, UtilityCategory } from './schema';
import { Syringe, Droplets, Package, PlusCircle, Trash2, Pill, Calculator, CheckCircle2, AlertTriangle, RefreshCcw, FlaskConical, Droplet, CircleDot, Wind, Cable, Filter, ArrowUpRight, ArrowDownLeft, Heart, Minimize2, Layers } from 'lucide-react';
import { Combobox } from "../ui/combobox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { PrimingChart } from './priming-chart';
import { PrimingAlerts } from './priming-alerts';
import { getPrimingCategory, PrimingCategory } from './schema';
import { EQUIPMENT_SETS } from './equipment-sets';

interface MaterielTabProps {
    isReadOnly: boolean;
}

interface PredefinedDrug {
    nom: string;
    dose: string;
    unite: string;
    category: 'vasopressor' | 'anticoagulant' | 'diuretic' | 'other';
}

const predefinedDrugs: PredefinedDrug[] = [
    { nom: 'Adrénaline', dose: '1', unite: 'mg', category: 'vasopressor' },
    { nom: 'Noradrénaline', dose: '5', unite: 'mg', category: 'vasopressor' },
    { nom: 'Dobutamine', dose: '250', unite: 'mg', category: 'vasopressor' },
    { nom: 'Milrinone', dose: '10', unite: 'mg', category: 'vasopressor' },
    { nom: 'Protamine', dose: '0', unite: 'mg', category: 'anticoagulant' },
    { nom: 'Chlorure de Calcium', dose: '1', unite: 'g', category: 'other' },
    { nom: 'Bicarbonate de Sodium', dose: '50', unite: 'mEq', category: 'other' },
    { nom: 'Mannitol', dose: '12.5', unite: 'g', category: 'diuretic' },
    { nom: 'Furosémide', dose: '20', unite: 'mg', category: 'diuretic' },
];

interface PrimingTotals {
    initial: number;
    ajout: number;
    total: number;
}

const CATEGORY_COLORS: Record<PrimingCategory, string> = {
    'cristalloide': '#3b82f6', // blue-500
    'colloide': '#22c55e', // green-500
    'produit_sanguin': '#ef4444', // red-500
    'autre': '#6b7280' // gray-500
};

const CATEGORY_LABELS: Record<PrimingCategory, string> = {
    'cristalloide': 'Cristalloïdes',
    'colloide': 'Colloïdes',
    'produit_sanguin': 'Produits Sanguins',
    'autre': 'Autres'
};

const circuitFields: Array<{ name: keyof CecFormValues; category: UtilityCategory; label: string, icon: any }> = [
    { name: 'oxygenateur', category: 'oxygenateur', label: 'Oxygénateur', icon: Wind },
    { name: 'circuit', category: 'circuit', label: 'Circuit', icon: Cable },
    { name: 'kit_hemo', category: 'kit_hemo', label: 'Kit Hémofiltration', icon: Filter },
];

const cannulaFields: Array<{ name: keyof CecFormValues; category: UtilityCategory; label: string, icon: any }> = [
    { name: 'canule_art', category: 'canule_art', label: 'Canule Artérielle', icon: ArrowUpRight },
    { name: 'canule_vein', category: 'canule_vein', label: 'Canule Veineuse', icon: ArrowDownLeft },
    { name: 'canule_vein_2', category: 'canule_vein', label: 'Canule Veineuse 2', icon: ArrowDownLeft },
    { name: 'canule_cardio', category: 'canule_cardio', label: 'Canule Cardioplégie', icon: Heart },
    { name: 'canule_decharge', category: 'canule_decharge', label: 'Canule Décharge', icon: Minimize2 },
];


import { useQuery } from '@tanstack/react-query';
import { getUtilities } from '@/services/utilities';
import { Skeleton } from '@/components/ui/skeleton';


export function MaterielTab({ isReadOnly }: MaterielTabProps) {
    const { control, setValue, watch } = useFormContext<CecFormValues>();

    const { fields: drogueFields, append: appendDrogue, remove: removeDrogue } =
        useFieldArray({ control, name: 'autres_drogues' });

    const { fields: primingFields, replace: replacePriming } = useFieldArray({
        control,
        name: "priming",
    });

    const equipmentCategories = React.useMemo(() => {
        const all = [...circuitFields, ...cannulaFields];
        return Array.from(new Set(all.map(f => f.category)));
    }, []);
    const { data: equipmentOptions, isLoading: isLoadingEquipment } = useQuery({
        queryKey: ['utilities', equipmentCategories],
        queryFn: () => getUtilities(equipmentCategories),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: equipmentCategories.length > 0 && !isReadOnly,
    });

    const watchHeparineCircuit = useWatch({ control, name: 'heparine_circuit' });
    const watchHeparineMalade = useWatch({ control, name: 'heparine_malade' });
    const watchHeparineTotal = useWatch({ control, name: 'heparine_total' });

    const watchPoids = useWatch({ control, name: 'poids' });
    const watchSurface = useWatch({ control, name: 'surface_corporelle' });
    const primingValues = useWatch({ control, name: 'priming' });

    // Watch Equipment for smart checks
    const watchOxy = useWatch({ control, name: 'oxygenateur' });
    const watchCircuit = useWatch({ control, name: 'circuit' });

    // Calculate total heparin
    React.useEffect(() => {
        if (!isReadOnly) {
            const total = (Number(watchHeparineCircuit) || 0) + (Number(watchHeparineMalade) || 0);
            setValue('heparine_total', total > 0 ? total : undefined);
        }
    }, [watchHeparineCircuit, watchHeparineMalade, setValue, isReadOnly]);

    // Calculate suggested Protamine dose
    const suggestedProtamine = React.useMemo(() => {
        const totalHeparin = Number(watchHeparineTotal) || 0;
        if (totalHeparin === 0) return null;
        // 1 mg Protamine for 100 UI Heparin
        return Math.round(totalHeparin / 100);
    }, [watchHeparineTotal]);

    const handleQuickAddDrug = (drug: PredefinedDrug) => {
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        let dose = drug.dose;

        // Special handling for Protamine
        if (drug.nom === 'Protamine' && suggestedProtamine) {
            dose = suggestedProtamine.toString();
        }

        // Weight-based calculation for Mannitol
        if (drug.nom === 'Mannitol' && watchPoids) {
            const calculatedDose = (Number(watchPoids) * 0.5).toFixed(1);
            dose = calculatedDose;
        }

        appendDrogue({
            nom: drug.nom,
            dose,
            unite: drug.unite,
            heure: time
        });
    };

    const primingTotals: PrimingTotals = React.useMemo(() => {
        const primingArray = Array.isArray(primingValues) ? primingValues : [];
        return primingArray.reduce<PrimingTotals>(
            (acc, row) => {
                const initialValue = Number(row?.initial) || 0;
                const ajoutValue = Number(row?.ajout) || 0;
                acc.initial += initialValue;
                acc.ajout += ajoutValue;
                acc.total += initialValue + ajoutValue;
                return acc;
            },
            { initial: 0, ajout: 0, total: 0 }
        );
    }, [primingValues]);

    const primingFieldsToRender = Array.isArray(primingValues) ? primingValues : [];

    // --- Priming Logic ---

    // 1. Category Totals Calculation
    const primingStats = React.useMemo(() => {
        const stats: Record<PrimingCategory, number> = {
            'cristalloide': 0,
            'colloide': 0,
            'produit_sanguin': 0,
            'autre': 0
        };

        primingFieldsToRender.forEach(item => {
            if (!item.solute) return;
            const category = getPrimingCategory(item.solute);
            const total = (Number(item.initial) || 0) + (Number(item.ajout) || 0);
            stats[category] += total;
        });

        const chartData = Object.entries(stats).map(([key, value]) => ({
            category: key as PrimingCategory,
            value,
            label: CATEGORY_LABELS[key as PrimingCategory],
            color: CATEGORY_COLORS[key as PrimingCategory]
        }));

        return { stats, chartData };
    }, [primingFieldsToRender]);

    // 2. Volume Suggestions
    const suggestedVolume = React.useMemo(() => {
        const pbsa = Number(watchSurface) || 0;
        const weight = Number(watchPoids) || 0;

        let min = 0;
        let max = 0;
        let label = "";

        if (weight < 40 && weight > 0) {
            // Pediatric: 20-30 ml/kg (approximate rule for priming, can vary)
            // Using user request: 20-30 ml/kg
            min = weight * 20;
            max = weight * 30;
            label = "Pédiatrique (20-30 ml/kg)";
        } else if (weight >= 40 || pbsa > 1.2) {
            // Adult
            min = 1200;
            max = 1500;
            label = "Adulte Standard";
        }

        return { min, max, label };
    }, [watchPoids, watchSurface]);

    const isVolumeInTarget = primingTotals.total >= suggestedVolume.min && primingTotals.total <= suggestedVolume.max;

    // 3. Quick Fill Handlers
    const handleQuickFill = (type: 'adult' | 'pediatric' | 'hemodilution') => {
        const newPriming = [...primingFieldsToRender];

        const updateOrAdd = (name: string, volume: number) => {
            const existingIndex = newPriming.findIndex(p => p.solute === name);
            if (existingIndex >= 0) {
                newPriming[existingIndex] = { ...newPriming[existingIndex], initial: volume };
            } else {
                newPriming.push({ solute: name, initial: volume, ajout: 0 });
            }
        };

        if (type === 'adult') {
            updateOrAdd('Ringer Lactate', 1000);
            updateOrAdd('Plasmagel', 500);
        } else if (type === 'pediatric') {
            const weight = Number(watchPoids) || 5;
            // Simple logic: 20ml/kg split
            const total = weight * 25;
            updateOrAdd('Ringer Lactate', Math.round(total * 0.6));
            updateOrAdd('Plasmagel', Math.round(total * 0.4));
        } else if (type === 'hemodilution') {
            updateOrAdd('Plasma Frais Congelé', 500);
            updateOrAdd('Concentré Globulaire', 500);
            updateOrAdd('Ringer Lactate', 500);
        }

        replacePriming(newPriming);
    };

    // Sort by Category for Display
    const sortedPrimingFields = React.useMemo(() => {
        // Create a copy to sort, but we need to map back to original indices to use correct field names
        // Actually, since useFieldArray indices shift when we sort, we should probably just sort VISUALLY if we rendered with maps
        // But here we are iterating over values. 
        // CAUTION: If we sort the rendered list but the inputs are bound by index `priming.${index}`, 
        // writing to the sorted index will write to the wrong underlying data index if they don't match.
        // So we CANNOT easily sort the inputs by just reordering the map loop unless we reorder the actual data.
        // For now, let's keep the user-defined order but maybe add a "Sort" button that calls replacePriming()
        return primingFieldsToRender.map((field, index) => ({ ...field, originalIndex: index }));
    }, [primingFieldsToRender]);

    const handleSortByCategory = () => {
        const order: Record<PrimingCategory, number> = {
            'produit_sanguin': 1,
            'colloide': 2,
            'cristalloide': 3,
            'autre': 4
        };

        const sorted = [...primingFieldsToRender].sort((a, b) => {
            const catA = getPrimingCategory(a.solute || '');
            const catB = getPrimingCategory(b.solute || '');
            return (order[catA] || 99) - (order[catB] || 99);
        });

        replacePriming(sorted);
    };

    const handleApplySet = (setId: string) => {
        const set = EQUIPMENT_SETS.find(s => s.id === setId);
        if (set) {
            Object.entries(set.values).forEach(([key, value]) => {
                setValue(key as keyof CecFormValues, value as any, { shouldDirty: true });
            });
        }
    };

    // Equipment Smart Checks
    const equipmentWarnings = React.useMemo(() => {
        const warnings: string[] = [];
        const weight = Number(watchPoids) || 0;

        if (weight === 0) return warnings;

        // Check Pediatric on Adult (>40kg)
        if (weight > 40) {
            if (watchOxy && (watchOxy.toLowerCase().includes('fx05') || watchOxy.toLowerCase().includes('baby'))) {
                warnings.push("Attention : Oxygénateur pédiatrique (FX05/Baby) sélectionné pour un adulte");
            }
            if (watchCircuit && (watchCircuit.toLowerCase().includes('ped') || watchCircuit.toLowerCase().includes('pédiatrique'))) {
                warnings.push("Attention : Circuit pédiatrique sélectionné pour un adulte");
            }
        }

        // Check Adult on Pediatric (<20kg)
        if (weight < 20) {
            if (watchOxy && (watchOxy.toLowerCase().includes('inspire') || watchOxy.toLowerCase().includes('adulte'))) {
                if (watchOxy.includes('8') || watchOxy.includes('Standard')) {
                    warnings.push("Attention : Oxygénateur Adulte sélectionné pour un patient pédiatrique");
                }
            }
        }

        return warnings;
    }, [watchPoids, watchOxy, watchCircuit]);

    return (
        <fieldset disabled={isReadOnly} className="space-y-8 py-4">
            {/* Equipment Row */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2">
                            <Package size={20} />Équipement et Canules
                            {watchSurface && (
                                <Badge variant="secondary" className="font-normal text-xs ml-2 border-primary/20 bg-primary/5">
                                    BSA: {watchSurface} m²
                                </Badge>
                            )}
                        </div>

                        {!isReadOnly && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-normal text-muted-foreground mr-2 hidden sm:inline">Sets Rapides:</span>
                                {EQUIPMENT_SETS.map(set => (
                                    <TooltipProvider key={set.id}>
                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs px-2"
                                                    onClick={() => handleApplySet(set.id)}
                                                >
                                                    <Layers className="h-3 w-3 mr-1" />
                                                    {set.label}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                                <p>{set.description}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {/* Warnings */}
                    {equipmentWarnings.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {equipmentWarnings.map((warning, i) => (
                                <div key={i} className="flex items-center gap-2 p-3 text-sm rounded bg-orange-50 text-orange-800 border border-orange-200">
                                    <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                                    <span>{warning}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Section 1: Circuit & Oxygenation */}
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                            <Cable className="h-4 w-4" /> Circuit & Oxygénation
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                            {isLoadingEquipment ? (
                                circuitFields.map(item => <Skeleton key={item.name} className="h-10 w-full" />)
                            ) : (
                                circuitFields.map((item) => (
                                    <FormField
                                        key={item.name}
                                        name={item.name}
                                        control={control}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {item.label}
                                                </FormLabel>
                                                <FormControl>
                                                    <Combobox
                                                        category={item.category}
                                                        value={(field.value as string) ?? ""}
                                                        onChange={field.onChange}
                                                        options={equipmentOptions?.[item.category] ?? []}
                                                        disabled={isReadOnly || isLoadingEquipment}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Section 2: Cannulation */}
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4" /> Canulation
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                            {isLoadingEquipment ? (
                                cannulaFields.map(item => <Skeleton key={item.name} className="h-10 w-full" />)
                            ) : (
                                cannulaFields.map((item) => (
                                    <FormField
                                        key={item.name}
                                        name={item.name}
                                        control={control}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {item.label}
                                                </FormLabel>
                                                <FormControl>
                                                    <Combobox
                                                        category={item.category}
                                                        value={(field.value as string) ?? ""}
                                                        onChange={field.onChange}
                                                        options={equipmentOptions?.[item.category] ?? []}
                                                        disabled={isReadOnly || isLoadingEquipment}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Drugs Row */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Syringe size={20} />Anticoagulation et Drogues
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-3 gap-4 items-end">
                        <FormField
                            name="heparine_circuit"
                            control={control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Héparine Circuit</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                                                autoComplete="off"
                                                className="pr-8"
                                            />
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">Mg</span>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="heparine_malade"
                            control={control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Héparine Malade</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                                                autoComplete="off"
                                                className="pr-8"
                                            />
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">Mg</span>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="heparine_total"
                            control={control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Héparine Total</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                {...field}
                                                readOnly
                                                value={field.value ?? ''}
                                                autoComplete="off"
                                                className="pr-8 bg-muted"
                                            />
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">Mg</span>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                        NB: EXACYL DONNE PAR LES ANESTHESISTES
                    </p>

                    {/* Protamine Calculator */}
                    {suggestedProtamine && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 text-blue-900">
                                <Calculator className="h-4 w-4" />
                                <span className="font-bold text-sm">Calcul Protamine</span>
                            </div>
                            <p className="text-sm text-blue-800">
                                Héparine totale : <span className="font-bold">{watchHeparineTotal} UI</span>
                            </p>
                            <p className="text-sm text-blue-800">
                                Protamine suggérée : <span className="font-bold text-lg">{suggestedProtamine} mg</span>
                                <span className="text-xs ml-2">(1 mg pour 100 UI)</span>
                            </p>
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium flex items-center gap-2">
                                <Pill className="h-4 w-4" />
                                Drogues administrées
                            </h3>
                            {!isReadOnly && (
                                <Button type="button" size="sm" variant="outline"
                                    onClick={() => appendDrogue({ nom: '', dose: '', unite: '', heure: '' })}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Ajouter manuellement
                                </Button>
                            )}
                        </div>

                        {/* Quick Add Buttons */}
                        {!isReadOnly && (
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ajout Rapide</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {predefinedDrugs.map((drug) => (
                                        <Button
                                            key={drug.nom}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleQuickAddDrug(drug)}
                                            className="justify-start text-xs h-8"
                                        >
                                            <Pill className="h-3 w-3 mr-1.5" />
                                            {drug.nom}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {drogueFields.length > 0 && (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40%]">Nom</TableHead>
                                            <TableHead className="w-[15%]">Dose</TableHead>
                                            <TableHead className="w-[15%]">Unité</TableHead>
                                            <TableHead className="w-[20%]">Heure</TableHead>
                                            {!isReadOnly && <TableHead className="w-[10%]"></TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {drogueFields.map((field, index) => (
                                            <TableRow key={field.id}>
                                                <TableCell>
                                                    <FormField name={`autres_drogues.${index}.nom`} control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Ex: Adrénaline" />} />
                                                </TableCell>
                                                <TableCell><FormField name={`autres_drogues.${index}.dose`} control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Ex: 1" autoComplete="off" />} /></TableCell>
                                                <TableCell><FormField name={`autres_drogues.${index}.unite`} control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Ex: mg" autoComplete="off" />} /></TableCell>
                                                <TableCell><FormField name={`autres_drogues.${index}.heure`} control={control} render={({ field }) => <Input type="time" {...field} value={field.value ?? ''} />} /></TableCell>
                                                {!isReadOnly && (
                                                    <TableCell>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDrogue(index)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Priming Row */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Droplets size={20} />Priming et remplissage
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">

                    {/* Top Section: Analysis & Smart Suggestions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* 1. Priming Composition Chart */}
                        <div className="lg:col-span-1">
                            <PrimingChart
                                data={primingStats.chartData}
                                totalVolume={primingTotals.total}
                            />
                        </div>

                        {/* 2. Smart Suggestions & Totals */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Suggestion Card */}
                            {suggestedVolume.min > 0 && (
                                <div className={`p-4 rounded-lg border ${isVolumeInTarget ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Calculator className="h-4 w-4 text-blue-700" />
                                            <h4 className="font-semibold text-sm text-blue-900">Suggestion Volume ({suggestedVolume.label})</h4>
                                        </div>
                                        {isVolumeInTarget && (
                                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Dans la cible
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-blue-900">
                                            {suggestedVolume.min} - {suggestedVolume.max} ml
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            (Actuel: <span className={isVolumeInTarget ? "font-bold text-green-600" : "font-bold"}>{primingTotals.total} ml</span>)
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Safety Alerts */}
                            <PrimingAlerts
                                totalVolume={primingTotals.total}
                                totalsByCategory={primingStats.stats}
                                patientWeight={Number(watchPoids)}
                            />

                            {/* Quick Actions */}
                            {!isReadOnly && (
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickFill('adult')}
                                        className="text-xs"
                                    >
                                        <RefreshCcw className="h-3 w-3 mr-2" />
                                        Standard Adulte
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickFill('pediatric')}
                                        className="text-xs"
                                    >
                                        <RefreshCcw className="h-3 w-3 mr-2" />
                                        Pédiatrique
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickFill('hemodilution')}
                                        className="text-xs"
                                    >
                                        <RefreshCcw className="h-3 w-3 mr-2" />
                                        Hémodilution
                                    </Button>

                                    <div className="flex-1" />

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSortByCategory}
                                        className="text-xs"
                                    >
                                        Trier par catégorie
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/4">Soluté</TableHead>
                                    <TableHead>Initial (ml)</TableHead>
                                    <TableHead>Ajout (ml)</TableHead>
                                    <TableHead>Total (ml)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {primingFieldsToRender.map((item, index) => {
                                    const initialValue = Number(item?.initial) || 0;
                                    const ajoutValue = Number(item?.ajout) || 0;
                                    const total = initialValue + ajoutValue;
                                    const category = item.solute ? getPrimingCategory(item.solute) : 'autre';
                                    const categoryColor = CATEGORY_COLORS[category];
                                    const isFilled = total > 0;

                                    // Icons mapping
                                    const CategoryIcon = {
                                        'cristalloide': Droplets,
                                        'colloide': FlaskConical,
                                        'produit_sanguin': Droplet,
                                        'autre': CircleDot
                                    }[category];

                                    return (
                                        <TableRow key={item.id || index} className={isFilled ? "bg-muted/10" : ""}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {item.solute}
                                                    {item.solute && (
                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={300}>
                                                                <TooltipTrigger asChild>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="px-1.5 py-0.5 h-6 w-6 flex items-center justify-center rounded-full cursor-help transition-colors hover:bg-opacity-20"
                                                                        style={{
                                                                            color: categoryColor,
                                                                            borderColor: categoryColor + '40',
                                                                            backgroundColor: categoryColor + '10'
                                                                        }}
                                                                    >
                                                                        <CategoryIcon className="h-3.5 w-3.5" />
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{CATEGORY_LABELS[category]}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <FormField
                                                    name={`priming.${index}.initial`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                                                            autoComplete="off"
                                                            className="w-full"
                                                        />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FormField
                                                    name={`priming.${index}.ajout`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                                                            autoComplete="off"
                                                            className="w-full"
                                                        />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input readOnly value={total > 0 ? total : ''} className="w-full bg-muted" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="font-bold bg-muted/50">
                                    <TableCell>Total</TableCell>
                                    <TableCell><Input readOnly value={String(primingTotals.initial > 0 ? primingTotals.initial : '')} /></TableCell>
                                    <TableCell><Input readOnly value={String(primingTotals.ajout > 0 ? primingTotals.ajout : '')} /></TableCell>
                                    <TableCell>
                                        <div className="relative">
                                            <Input readOnly value={String(primingTotals.total > 0 ? primingTotals.total : '')} className="pr-10" />
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">ml</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </fieldset >
    );
}
