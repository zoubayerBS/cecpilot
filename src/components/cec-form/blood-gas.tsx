
"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
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
import { PlusCircle, TestTube, Trash2 } from "lucide-react";
import { type CecFormValues, type BloodGasColumn } from "./schema";
import { BloodGasChart } from "./blood-gas-chart";

const parameters: { key: keyof Omit<BloodGasColumn, 'id'|'time'>; label: string; unit?: string; step?: string }[] = [
    { key: 'act', label: 'ACT', unit: 'sec' },
    { key: 'temperature', label: 'T°', unit: '°C' },
    { key: 'ht', label: 'Ht', unit: '%' },
    { key: 'hb', label: 'Hb', unit: 'g/dL' },
    { key: 'pao2', label: 'Pao2', unit: 'mmHg' },
    { key: 'paco2', label: 'Paco2', unit: 'mmHg' },
    { key: 'ph', label: 'pH', step: '0.01' },
    { key: 'sat', label: 'Sat', unit: '%' },
    { key: 'hco3', label: 'HCO3-', unit: 'mmol/L' },
    { key: 'be', label: 'BE', unit: 'mmol/L' },
    { key: 'k', label: 'K+', unit: 'mEq/L' },
    { key: 'na', label: 'Na+', unit: 'mEq/L' },
    { key: 'ca', label: 'Ca++', unit: 'mEq/L' },
    { key: 'lactate', label: 'Lactate', unit: 'mmol/L' },
    { key: 'diurese', label: 'Diurèse', unit: 'ml' },
];


export function BloodGas() {
  const { control } = useFormContext<CecFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "bloodGases",
  });

  const addColumn = () => {
    if (fields.length < 10) { // Limit number of columns
        append({ time: '' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TestTube />
            Gaz du Sang
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="overflow-x-auto lg:col-span-1">
            <div className="min-w-max">
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[200px] sticky left-0 bg-card z-10">Paramètre</TableHead>
                        {fields.map((field, index) => (
                            <TableHead key={field.id} className="text-center w-[130px] min-w-[130px]">
                            <div className="flex items-center justify-center gap-1">
                                <FormField
                                control={control}
                                name={`bloodGases.${index}.time`}
                                render={({ field: formField }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input
                                        placeholder={index === 0 ? "Avant CEC" : ".... min CEC"}
                                        className="w-28 text-center"
                                        {...formField}
                                        value={formField.value ?? ""}
                                        />
                                    </FormControl>
                                    </FormItem>
                                )}
                                />
                                {index > 0 && (
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                )}
                            </div>
                            </TableHead>
                        ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parameters.map((param) => (
                        <TableRow key={param.key}>
                            <TableCell className="font-medium w-[200px] sticky left-0 bg-card z-10">
                            {param.label}
                            {param.unit && <span className="text-xs text-muted-foreground ml-1">({param.unit})</span>}
                            </TableCell>
                            {fields.map((field, index) => (
                            <TableCell key={`${field.id}-${param.key}`} className="w-[130px] min-w-[130px]">
                                <FormField
                                control={control}
                                name={`bloodGases.${index}.${param.key}`}
                                render={({ field: formField }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Input
                                        type="number"
                                        className="w-full text-center"
                                        step={param.step || "any"}
                                        {...formField}
                                        value={formField.value ?? ""}
                                        onChange={e => formField.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                                        />
                                    </FormControl>
                                    </FormItem>
                                )}
                                />
                            </TableCell>
                            ))}
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
              </div>
          </div>
          <div className="w-full h-full flex flex-col justify-center">
            <BloodGasChart />
        </div>
      </CardContent>
       <CardFooter>
        <Button
          type="button"
          variant="outline"
          onClick={addColumn}
          disabled={fields.length >= 10}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une colonne
        </Button>
      </CardFooter>
    </Card>
  );
}
