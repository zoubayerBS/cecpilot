
"use client";

import * as React from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import type { CecFormValues, UtilityCategory } from './schema';
import { Syringe, Droplets, Package, PlusCircle, Trash2 } from 'lucide-react';
import { Combobox } from "../ui/combobox";

interface MaterielTabProps {
    isReadOnly: boolean;
}

interface PrimingTotals {
    initial: number;
    ajout: number;
    total: number;
}

const equipmentFields: Array<{ name: UtilityCategory; label: string }> = [
    { name: 'oxygenateur', label: 'Oxygénateur' },
    { name: 'circuit', label: 'Circuit' },
    { name: 'canule_art', label: 'Canule Artérielle' },
    { name: 'canule_vein', label: 'Canule Veineuse' },
    { name: 'canule_cardio', label: 'Canule Cardioplégie' },
    { name: 'canule_decharge', label: 'Canule Décharge' },
    { name: 'kit_hemo', label: 'Kit Hémofiltration' },
];


import { useQuery } from '@tanstack/react-query';
import { getUtilities } from '@/services/utilities';
import { Skeleton } from '@/components/ui/skeleton';


export function MaterielTab({ isReadOnly }: MaterielTabProps) {
    const { control, setValue } = useFormContext<CecFormValues>();

    const { fields: drogueFields, append: appendDrogue, remove: removeDrogue } =
        useFieldArray({ control, name: 'autres_drogues' });
    
    const { fields: primingFields } = useFieldArray({
      control,
      name: "priming",
    });

    const equipmentCategories = React.useMemo(() => equipmentFields.map(f => f.name), []);
    const { data: equipmentOptions, isLoading: isLoadingEquipment } = useQuery({
        queryKey: ['utilities', equipmentCategories],
        queryFn: () => getUtilities(equipmentCategories),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: equipmentCategories.length > 0 && !isReadOnly,
    });

    const watchHeparineCircuit = useWatch({ control, name: 'heparine_circuit' });
    const watchHeparineMalade = useWatch({ control, name: 'heparine_malade' });
    const primingValues = useWatch({ control, name: 'priming' });

    React.useEffect(() => {
        if (!isReadOnly) {
            const total = (Number(watchHeparineCircuit) || 0) + (Number(watchHeparineMalade) || 0);
            setValue('heparine_total', total > 0 ? total : undefined);
        }
    }, [watchHeparineCircuit, watchHeparineMalade, setValue, isReadOnly]);

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


    return (
        <fieldset disabled={isReadOnly} className="space-y-8 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package size={20} />Équipement et Canules
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-6">
                        {isLoadingEquipment ? (
                            equipmentFields.map(item => (
                                <div key={item.name} className="space-y-2">
                                    <FormLabel>{item.label}</FormLabel>
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))
                        ) : (
                            equipmentFields.map((item) => (
                                <FormField
                                    key={item.name}
                                    name={item.name}
                                    control={control}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{item.label}</FormLabel>
                                        <FormControl>
                                            <Combobox
                                                category={item.name}
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                options={equipmentOptions?.[item.name] ?? []}
                                                disabled={isReadOnly || isLoadingEquipment}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            ))
                        )}
                    </CardContent>
                </Card>

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

                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium">Autres drogues administrées</h3>
                                {!isReadOnly && (
                                    <Button type="button" size="sm" variant="outline"
                                        onClick={() => appendDrogue({ nom: '', dose: '', unite: '', heure: '' })}>
                                        <PlusCircle className="mr-2" /> Ajouter une drogue
                                    </Button>
                                )}
                            </div>

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
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Droplets size={20} />Priming et remplissage
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
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
                                    return (
                                        <TableRow key={item.id || index}>
                                            <TableCell className="font-medium">{item.solute}</TableCell>
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
        </fieldset>
    );
}
