
"use client";

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
import { PlusCircle, TestTube, Trash2, Brain } from "lucide-react";
import { type CecFormValues, type BloodGasColumn } from "./schema";
import { BloodGasChart } from "./blood-gas-chart";
import { aiPredictionService } from "@/services/ai-prediction";
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface BloodGasParam {
  key: keyof Omit<BloodGasColumn, 'id' | 'time'>;
  label: string;
  unit?: string;
  step?: string;
  min?: number;
  max?: number;
}

const categories: { title: string, params: BloodGasParam[] }[] = [
  {
    title: "Gazométrie & Acido-Basique",
    params: [
      { key: 'ph', label: 'pH', step: '0.01', min: 7.35, max: 7.45 },
      { key: 'pao2', label: 'PaO2', unit: 'mmHg', min: 80, max: 250 },
      { key: 'paco2', label: 'PaCO2', unit: 'mmHg', min: 35, max: 45 },
      { key: 'hco3', label: 'HCO3-', unit: 'mmol/L', min: 22, max: 26 },
      { key: 'be', label: 'BE', unit: 'mmol/L', min: -3, max: 3 },
      { key: 'sat', label: 'Sat', unit: '%', min: 95, max: 100 },
    ]
  },
  {
    title: "Électrolytes & Métabolisme",
    params: [
      { key: 'na', label: 'Na+', unit: 'mEq/L', min: 135, max: 145 },
      { key: 'k', label: 'K+', unit: 'mEq/L', min: 3.5, max: 5.0 },
      { key: 'ca', label: 'Ca++', unit: 'mEq/L', min: 1.15, max: 1.35 },
      { key: 'lactate', label: 'Lactate', unit: 'mmol/L', min: 0.5, max: 2.0 },
      { key: 'diurese', label: 'Diurèse', unit: 'ml', min: 30 },
      { key: 'temperature', label: 'T°', unit: '°C', min: 28, max: 38 },
    ]
  },
  {
    title: "Hématologie & Coagulation",
    params: [
      { key: 'act', label: 'ACT', unit: 'sec', min: 400 },
      { key: 'hb', label: 'Hb', unit: 'g/dL', min: 8 },
      { key: 'ht', label: 'Ht', unit: '%', min: 24 },
    ]
  }
];


export function BloodGas() {
  const { control } = useFormContext<CecFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "bloodGases",
  });

  const bloodGases = useWatch({ control, name: "bloodGases" });
  const [analysis, setAnalysis] = React.useState<{ interpretation: string, details: string, severity: string } | null>(null);

  React.useEffect(() => {
    if (bloodGases && bloodGases.length > 0) {
      // Analyze the last complete entry
      // We iterate backwards to find the last entry with enough data
      for (let i = bloodGases.length - 1; i >= 0; i--) {
        const entry = bloodGases[i];
        if (entry.ph && entry.paco2 && entry.hco3) {
          const result = aiPredictionService.analyzeBloodGas({
            ph: Number(entry.ph),
            paco2: Number(entry.paco2),
            hco3: Number(entry.hco3),
            pao2: Number(entry.pao2) || 100, // Default if missing
            lactate: Number(entry.lactate)
          });
          setAnalysis(result);
          return;
        }
      }
      setAnalysis(null);
    } else {
      setAnalysis(null);
    }
  }, [bloodGases]);

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
      <CardContent className="space-y-6">
        {/* AI Analysis Alert */}
        {analysis && (
          <Alert className={`border-l-4 ${analysis.severity === 'destructive'
            ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
            : analysis.severity === 'warning'
              ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
              : 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
            }`}>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${analysis.severity === 'destructive' ? 'bg-red-100 text-red-600' :
                analysis.severity === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                <Brain className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTitle className="text-base font-bold m-0">Interprétation IA Clinical</AlertTitle>
                  <Badge className={
                    analysis.severity === 'destructive' ? 'bg-red-500 hover:bg-red-600' :
                      analysis.severity === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                        'bg-green-500 hover:bg-green-600'
                  }>
                    {analysis.interpretation}
                  </Badge>
                </div>
                <AlertDescription className="text-sm font-medium opacity-90">
                  {analysis.details}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    {categories.map((cat) => (
                      <React.Fragment key={cat.title}>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={fields.length + 1} className="py-1 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/20">
                            {cat.title}
                          </TableCell>
                        </TableRow>
                        {cat.params.map((param) => (
                          <TableRow key={param.key} className="transition-colors">
                            <TableCell className="font-medium w-[200px] sticky left-0 bg-card z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                              <div className="flex flex-col">
                                <span className="text-sm">{param.label}</span>
                                {param.unit && <span className="text-[10px] text-muted-foreground">{param.unit}</span>}
                              </div>
                            </TableCell>
                            {fields.map((field, index) => (
                              <TableCell key={`${field.id}-${param.key}`} className="w-[130px] min-w-[130px] p-2">
                                <FormField
                                  control={control}
                                  name={`bloodGases.${index}.${param.key}`}
                                  render={({ field: formField }) => {
                                    const val = formField.value;
                                    const isLow = param.min !== undefined && val !== null && val !== undefined && val < param.min;
                                    const isHigh = param.max !== undefined && val !== null && val !== undefined && val > param.max;
                                    const isOutOfRange = isLow || isHigh;

                                    return (
                                      <FormItem>
                                        <FormControl>
                                          <div className="relative group">
                                            <Input
                                              type="number"
                                              className={`w-full text-center font-medium transition-all ${isOutOfRange
                                                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400'
                                                : 'focus:bg-primary/5'
                                                }`}
                                              step={param.step || "any"}
                                              {...formField}
                                              value={formField.value ?? ""}
                                              onChange={e => formField.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                                            />
                                            {isOutOfRange && (
                                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow-lg z-50 whitespace-nowrap">
                                                Norm: {param.min ?? '∞'} - {param.max ?? '∞'}
                                              </div>
                                            )}
                                          </div>
                                        </FormControl>
                                      </FormItem>
                                    );
                                  }}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <div className="w-full h-full flex flex-col justify-center">
            <BloodGasChart />
          </div>
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
