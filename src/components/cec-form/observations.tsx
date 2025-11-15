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
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { type CecFormValues } from "./schema";

export function Observations() {
  const { control } = useFormContext<CecFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Observations</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Observations</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Inscrire ici les événements marquants ou observations pertinentes..."
                  rows={4}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
