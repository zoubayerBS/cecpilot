"use client";

import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { type CecFormValues, type UtilityCategory } from "./schema";
import { Users } from "lucide-react";
import { Combobox } from "../ui/combobox";

export function TeamInfo() {
  const { control } = useFormContext<CecFormValues>();

  const teamMembers: { name: keyof CecFormValues, label: string, category: UtilityCategory }[] = [
    { name: "operateur", label: "Opérateur", category: "chirurgiens" },
    { name: "aide_op", label: "Aide Op.", category: "chirurgiens" },
    { name: "instrumentiste", label: "Instrumentiste", category: "personnel" },
    { name: "perfusionniste", label: "Perfusionniste", category: "personnel" },
    { name: "anesthesiste", label: "Anesthésiste", category: "anesthesistes" },
    { name: "technicien_anesthesie", label: "T.Anesthésiste", category: "techniciens-anesthesie" },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Users />
            Équipe Médicale
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <FormField
            key={member.name}
            control={control}
            name={member.name}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{member.label}</FormLabel>
                 <Combobox
                    category={member.category}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
}