
"use client";

import * as React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { type CecFormValues } from './schema';
import { Scale } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';

export function BalanceIO() {
    const { control, setValue } = useFormContext<CecFormValues>();

    const entrees = useWatch({
        control,
        name: [
            'entrees_apports_anesthesiques',
            'entrees_priming',
            'entrees_cardioplegie'
        ]
    });

    const sorties = useWatch({
        control,
        name: [
            'sorties_diurese',
            'sorties_hemofiltration',
            'sorties_aspiration_perdue',
            'sorties_sang_pompe_residuel'
        ]
    });
    
    const bloodGases = useWatch({ control, name: 'bloodGases' });

    const totalEntrees = React.useMemo(() => {
        return (entrees[0] || 0) + (entrees[1] || 0) + (entrees[2] || 0);
    }, [entrees]);

    const totalDiurese = React.useMemo(() => {
        const bgArray = Array.isArray(bloodGases) ? bloodGases : [];
        return bgArray.reduce((acc, col) => acc + (Number(col?.diurese) || 0), 0);
    }, [bloodGases]);

    const totalSorties = React.useMemo(() => {
        return (totalDiurese || 0) + (sorties[1] || 0) + (sorties[2] || 0) + (sorties[3] || 0);
    }, [totalDiurese, sorties]);


    React.useEffect(() => {
        setValue('total_entrees', totalEntrees > 0 ? totalEntrees : undefined, { shouldValidate: true });
    }, [totalEntrees, setValue]);

    React.useEffect(() => {
        setValue('sorties_diurese', totalDiurese > 0 ? totalDiurese : undefined, { shouldValidate: true, shouldDirty: true });
        setValue('total_sorties', totalSorties > 0 ? totalSorties : undefined, { shouldValidate: true });
    }, [totalDiurese, totalSorties, setValue]);

    const grandTotal = totalEntrees + totalSorties;
    const entreesPercentage = grandTotal > 0 ? (totalEntrees / grandTotal) * 100 : 0;
    const sortiesPercentage = grandTotal > 0 ? (totalSorties / grandTotal) * 100 : 0;


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Scale />
                    Bilan Entrées / Sorties
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Entrées */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-center">Entrées</h3>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">Apports anesthésiques</TableCell>
                                    <TableCell className="w-1/3">
                                         <FormField
                                            control={control}
                                            name="entrees_apports_anesthesiques"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} className="pr-10" />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">ml</span>
                                                    </div>
                                                </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Priming</TableCell>
                                    <TableCell>
                                        <FormField
                                            control={control}
                                            name="entrees_priming"
                                            render={({ field }) => (
                                                 <FormItem>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input readOnly type="number" {...field} value={field.value ?? ''} className="pr-10 bg-muted" />
                                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">ml</span>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Cardioplégie</TableCell>
                                    <TableCell>
                                         <FormField
                                            control={control}
                                            name="entrees_cardioplegie"
                                            render={({ field }) => (
                                                 <FormItem>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input readOnly type="number" {...field} value={field.value ?? ''} className="pr-10 bg-muted" />
                                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">ml</span>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Sorties */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-center">Sorties</h3>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">Diurèse</TableCell>
                                    <TableCell className="w-1/3">
                                        <FormField
                                            control={control}
                                            name="sorties_diurese"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input readOnly type="number" {...field} value={field.value ?? ''} className="pr-10 bg-muted" />
                                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">ml</span>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Hémofiltration</TableCell>
                                    <TableCell>
                                        <FormField control={control} name="sorties_hemofiltration" render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} className="pr-10" />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">ml</span>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Aspiration perdue</TableCell>
                                    <TableCell>
                                        <FormField control={control} name="sorties_aspiration_perdue" render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} className="pr-10" />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">ml</span>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Sang du pompe résiduel</TableCell>
                                    <TableCell>
                                         <FormField control={control} name="sorties_sang_pompe_residuel" render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} className="pr-10" />
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">ml</span>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4 pt-4">
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-bold text-lg">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-muted p-2 rounded-md">
                            <span>Total Entrées :</span>
                            <span>{totalEntrees} ml</span>
                        </div>
                        <Progress value={entreesPercentage} className="h-2 [&>div]:bg-red-500" />
                    </div>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center bg-muted p-2 rounded-md">
                            <span>Total Sorties :</span>
                            <span>{totalSorties} ml</span>
                        </div>
                        <Progress value={sortiesPercentage} className="h-2 [&>div]:bg-blue-500" />
                    </div>
                </div>
                 <Separator />
                <div className="text-center font-bold text-xl bg-card p-3 rounded-md shadow-inner">
                    Bilan Total : {totalEntrees - totalSorties} ml
                </div>
            </CardFooter>
        </Card>
    );
}
