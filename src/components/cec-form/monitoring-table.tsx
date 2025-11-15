
"use client";

import * as React from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, LineChart as LineChartIcon } from "lucide-react";
import { type CecFormValues, HemodynamicMeasure } from "./schema";
import { MonitoringChart } from "./monitoring-chart";

const monitoringHeaders = [
    { key: 'time', label: 'Heure', type: 'time'},
    { key: 'pression_systolique', label: 'PAS (mmHg)', type: 'number'},
    { key: 'pression_diastolique', label: 'PAD (mmHg)', type: 'number'},
    { key: 'pam', label: 'PAM (mmHg)', type: 'number'},
    { key: 'fc', label: 'FC (/min)', type: 'number'},
    { key: 'spo2', label: 'SpO2 (%)', type: 'number'},
];


const MonitoringRow = ({ index, control, remove }: { index: number; control: any; remove: (index: number) => void; }) => {
    const { setValue, watch } = useFormContext<CecFormValues>();
    const pas = watch(`hemodynamicMonitoring.${index}.pression_systolique`);
    const pad = watch(`hemodynamicMonitoring.${index}.pression_diastolique`);
    const pam = watch(`hemodynamicMonitoring.${index}.pam`);

    React.useEffect(() => {
        const pasNum = Number(pas);
        const padNum = Number(pad);
        if (!isNaN(pasNum) && !isNaN(padNum) && pasNum > 0 && padNum > 0) {
            const calculatedPam = Math.round(padNum + (pasNum - padNum) / 3);
            if (pam !== calculatedPam) {
               setValue(`hemodynamicMonitoring.${index}.pam`, calculatedPam, { shouldValidate: true, shouldDirty: true });
            }
        } else if (pam !== undefined) {
             setValue(`hemodynamicMonitoring.${index}.pam`, undefined, { shouldValidate: true, shouldDirty: true });
        }
    }, [pas, pad, pam, index, setValue]);

    return (
        <TableRow>
            {monitoringHeaders.map(p => (
                <TableCell key={p.key} className="p-2">
                    <FormField
                        control={control}
                        name={`hemodynamicMonitoring.${index}.${p.key as keyof HemodynamicMeasure}`}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        type={p.type}
                                        className="min-w-[120px] text-center"
                                        step="any"
                                        placeholder={p.type === 'text' ? 'HH:MM' : ''}
                                        {...formField}
                                        value={formField.value ?? ""}
                                        onChange={e => formField.onChange(p.type === 'number' && e.target.value !== '' ? e.target.valueAsNumber : e.target.value)}
                                        readOnly={p.key === 'pam'}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </TableCell>
            ))}
            <TableCell className="p-2">
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </TableCell>
        </TableRow>
    );
};


export function MonitoringTable() {
  const { control } = useFormContext<CecFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "hemodynamicMonitoring",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <LineChartIcon />
            Surveillance Hémodynamique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <MonitoringChart />
        <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {monitoringHeaders.map(h => <TableHead key={h.key} className="text-center">{h.label}</TableHead>)}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <MonitoringRow key={field.id} index={index} control={control} remove={() => remove(index)} />
                ))}
              </TableBody>
            </Table>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ time: '', pression_systolique: undefined, pression_diastolique: undefined, pam: undefined, fc: undefined, spo2: undefined })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une ligne
        </Button>
      </CardFooter>
    </Card>
  );
}
