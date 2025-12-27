"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type CecFormValues, type UtilityCategory } from "./schema";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon, User } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";


export function PatientInfo() {
  const { control, watch } = useFormContext<CecFormValues>();
  const surfaceCorporelle = watch("surface_corporelle");
  const debitTheorique = watch("debit_theorique");
  const age = watch("age");


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={control}
        name="date_cec"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Date CEC</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(new Date(field.value), "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  locale={fr}
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) =>
                    field.onChange(
                      date
                        ? new Date(
                          date.getTime() - date.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .split("T")[0]
                        : undefined
                    )
                  }
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="numero_cec"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Numéro CEC</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="nom_prenom"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom et Prénom</FormLabel>
            <FormControl>
              <Input
                placeholder="Nom du patient"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="matricule"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Matricule</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="date_naissance"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Date de Naissance</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(new Date(field.value), "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  locale={fr}
                  mode="single"
                  captionLayout="dropdown-buttons"
                  fromYear={1920}
                  toYear={new Date().getFullYear()}
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) =>
                    field.onChange(
                      date
                        ? new Date(
                          date.getTime() -
                          date.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .split("T")[0]
                        : undefined
                    )
                  }
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="age"
        render={() => (
          <FormItem className="flex flex-col">
            <FormLabel>Âge</FormLabel>
            <FormControl>
              <Input
                readOnly
                value={age === undefined ? "" : `${age} ans`}
                placeholder="Calculé"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="sexe"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Sexe</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex space-x-4 h-10 items-center border rounded-md px-3"
              >
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="homme" />
                  </FormControl>
                  <FormLabel className="font-normal">M</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="femme" />
                  </FormControl>
                  <FormLabel className="font-normal">F</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="poids"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Poids</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="70"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? undefined
                        : e.target.valueAsNumber
                    )
                  }
                  value={field.value ?? ""}
                  className="pr-12"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                  kg
                </span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="taille"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Taille</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="175"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? undefined
                        : e.target.valueAsNumber
                    )
                  }
                  value={field.value ?? ""}
                  className="pr-12"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                  cm
                </span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="surface_corporelle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>S.corporelle</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  readOnly
                  {...field}
                  value={field.value || ""}
                  placeholder="Calculée"
                  className="pr-12 bg-muted/50"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-muted-foreground">
                  m²
                </span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="debit_theorique"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Débit Théorique</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  readOnly
                  {...field}
                  value={field.value || ""}
                  placeholder="Calculé"
                  className="pr-16 bg-muted/50"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-muted-foreground">
                  L/min
                </span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="ch"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CH</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}