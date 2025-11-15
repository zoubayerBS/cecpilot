
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
import { Stethoscope } from "lucide-react";
import { type CecFormValues } from "./schema";
import { Textarea } from "../ui/textarea";

export function ExamensComplementaires() {
  const { control } = useFormContext<CecFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Stethoscope />
            Examens Complémentaires
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6">
        <FormField
            control={control}
            name="echo_coeur"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Echo Coeur</FormLabel>
                    <FormControl>
                        <Textarea rows={3} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={control}
            name="coro"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Coronographie</FormLabel>
                    <FormControl>
                        <Textarea rows={3} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
      </CardContent>
    </Card>
  );
}
