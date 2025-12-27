
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
import { PlusCircle, Trash2, LineChart as LineChartIcon, Camera, AlertCircle } from "lucide-react";
import { type CecFormValues, HemodynamicMeasure } from "./schema";
import { MonitoringChart } from "./monitoring-chart";
import { MonitoringAlerts } from "./monitoring-alerts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const monitoringHeaders = [
  { key: 'time', label: 'Heure', type: 'time' },
  { key: 'pression_systolique', label: 'PAS (mmHg)', type: 'number' },
  { key: 'pression_diastolique', label: 'PAD (mmHg)', type: 'number' },
  { key: 'pam', label: 'PAM (mmHg)', type: 'number' },
  { key: 'fc', label: 'FC (/min)', type: 'number' },
  { key: 'spo2', label: 'SpO2 (%)', type: 'number' },
];


const getValueBadge = (value: number | undefined, field: string): { variant: 'default' | 'destructive' | 'secondary'; show: boolean } => {
  if (value === undefined || value === null) return { variant: 'default', show: false };

  if (field === 'pam') {
    // Adjusted for CEC context - lower values are acceptable
    if (value < 40 || value > 110) return { variant: 'destructive', show: true };
    if (value < 50 || value > 90) return { variant: 'secondary', show: true };
  } else if (field === 'fc') {
    if (value < 40 || value > 120) return { variant: 'secondary', show: true };
  } else if (field === 'spo2') {
    if (value < 85) return { variant: 'destructive', show: true };
    if (value < 92) return { variant: 'secondary', show: true };
  }

  return { variant: 'default', show: false };
};

const MonitoringRow = ({ index, control, remove }: { index: number; control: any; remove: (index: number) => void; }) => {
  const { setValue, watch } = useFormContext<CecFormValues>();
  const pas = watch(`hemodynamicMonitoring.${index}.pression_systolique`);
  const pad = watch(`hemodynamicMonitoring.${index}.pression_diastolique`);
  const pam = watch(`hemodynamicMonitoring.${index}.pam`);
  const fc = watch(`hemodynamicMonitoring.${index}.fc`);
  const spo2 = watch(`hemodynamicMonitoring.${index}.spo2`);

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
      {monitoringHeaders.map(p => {
        const currentValue = p.key === 'pam' ? pam : p.key === 'fc' ? fc : p.key === 'spo2' ? spo2 : undefined;
        const badge = getValueBadge(currentValue ?? undefined, p.key);

        return (
          <TableCell key={p.key} className="p-2">
            <FormField
              control={control}
              name={`hemodynamicMonitoring.${index}.${p.key as keyof HemodynamicMeasure}`}
              render={({ field: formField }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={p.type}
                        className={cn(
                          "min-w-[120px] text-center",
                          badge.show && "border-2",
                          badge.variant === 'destructive' && "border-red-500",
                          badge.variant === 'secondary' && "border-orange-500"
                        )}
                        step="any"
                        placeholder={p.type === 'text' ? 'HH:MM' : ''}
                        {...formField}
                        value={formField.value ?? ""}
                        onChange={e => formField.onChange(p.type === 'number' && e.target.value !== '' ? e.target.valueAsNumber : e.target.value)}
                        readOnly={p.key === 'pam'}
                      />
                      {badge.show && (
                        <AlertCircle className={cn(
                          "absolute right-2 top-2.5 h-4 w-4",
                          badge.variant === 'destructive' && "text-red-500",
                          badge.variant === 'secondary' && "text-orange-500"
                        )} />
                      )}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </TableCell>
        );
      })}
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

  const handleSnapshot = () => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    append({
      time,
      pression_systolique: undefined,
      pression_diastolique: undefined,
      pam: undefined,
      fc: undefined,
      spo2: undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChartIcon />
          Surveillance Hémodynamique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <MonitoringAlerts />
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
      <CardFooter className="flex gap-2">
        <Button
          type="button"
          variant="default"
          onClick={handleSnapshot}
          className="bg-primary"
        >
          <Camera className="mr-2 h-4 w-4" />
          📸 Snapshot
        </Button>
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
