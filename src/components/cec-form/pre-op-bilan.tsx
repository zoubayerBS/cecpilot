
"use client";

import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type CecFormValues } from "./schema";
import { Beaker } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export function PreOpBilan() {
  const { control } = useFormContext<CecFormValues>();

  const preOpFields = [
    { name: "gs", label: "GS", type: "select", options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { name: "hte", label: "Hte", unit: "%", type: "input" },
    { name: "hb", label: "Hb", unit: "g/dL", type: "input" },
    { name: "na", label: "Na+", unit: "mEq/L", type: "input" },
    { name: "k", label: "K+", unit: "mEq/L", type: "input" },
    { name: "creat", label: "Créat", unit: "mg/dL", type: "input" },
    { name: "protides", label: "Protides", unit: "g/L", type: "input" },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Beaker />
            Bilan préopératoire
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {preOpFields.map((item) => (
          <FormField
            key={item.name}
            control={control}
            name={item.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{item.label}</FormLabel>
                 <FormControl>
                  {item.type === 'select' ? (
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                            {item.options?.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  ) : item.unit ? (
                     <div className="relative">
                        <Input {...field} value={field.value ?? ""} className="pr-16" />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">{item.unit}</span>
                    </div>
                  ) : (
                    <Input {...field} value={field.value ?? ""} />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
}
