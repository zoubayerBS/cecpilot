
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
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, HeartPulse } from "lucide-react";
import { type CecFormValues } from "./schema";
import * as React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function Cardioplegia() {
  const { control, watch } = useFormContext<CecFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "cardioplegiaDoses",
  });
    
  const cardioplegiaDoses = watch("cardioplegiaDoses");
  const typeCardioplegie = watch('type_cardioplegie');

  const totalCardioplegia = React.useMemo(() => {
    const dosesArray = Array.isArray(cardioplegiaDoses) ? cardioplegiaDoses : [];
    return dosesArray.reduce((acc, dose) => acc + (Number(dose?.dose) || 0), 0);
  }, [cardioplegiaDoses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <HeartPulse />
            Cardioplégie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="type_cardioplegie"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Type de cardioplégie</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="delnido" />
                            </FormControl>
                            <FormLabel className="font-normal">
                            Delnido
                            </FormLabel>
                        </FormItem>
                         <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="custodiol" />
                            </FormControl>
                            <FormLabel className="font-normal">
                            Custodiol
                            </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="autre" />
                            </FormControl>
                            <FormLabel className="font-normal">
                            Autre
                            </FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
              )}
            />
            {typeCardioplegie === 'autre' && (
                <FormField
                control={control}
                name="autre_cardioplegie"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Autre cardioplégie / Protection myocardique</FormLabel>
                    <FormControl>
                        <Input {...field} value={field.value ?? ''} placeholder="Précisez le type" />
                    </FormControl>
                    </FormItem>
                )}
                />
            )}
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Heure</TableHead>
                <TableHead>Dose (ml)</TableHead>
                <TableHead>Min CEC</TableHead>
                <TableHead>T°C</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <FormField
                      control={control}
                      name={`cardioplegiaDoses.${index}.heure`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="time" {...formField} value={formField.value ?? ''} className="min-w-[100px]" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={control}
                      name={`cardioplegiaDoses.${index}.dose`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" {...formField} value={formField.value ?? ''} onChange={e => formField.onChange(e.target.value === '' ? undefined : +e.target.value)} className="min-w-[100px]" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={control}
                      name={`cardioplegiaDoses.${index}.minCec`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" {...formField} value={formField.value ?? ''} onChange={e => formField.onChange(e.target.value === '' ? undefined : +e.target.value)} className="min-w-[100px]" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={control}
                      name={`cardioplegiaDoses.${index}.temp`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" {...formField} value={formField.value ?? ''} onChange={e => formField.onChange(e.target.value === '' ? undefined : +e.target.value)} className="min-w-[100px]" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ dose: undefined, minCec: undefined, temp: undefined, heure: '' })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une dose
        </Button>
         <div className="font-bold text-lg bg-muted p-2 rounded-md">
            Total Cardioplégie: {totalCardioplegia} ml
        </div>
      </CardFooter>
    </Card>
  );
}
