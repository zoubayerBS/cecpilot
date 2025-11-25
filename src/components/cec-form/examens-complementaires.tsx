
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
import { DictationTextarea } from "../ui/dictation-textarea";
import { SimpleWave } from "../ui/simple-wave";
import { useDictation } from "@/hooks/use-dictation";

function DictationField({ name, label }: { name: "echo_coeur" | "coro", label: string }) {
  const { control } = useFormContext<CecFormValues>();
  
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const { isRecording, toggleRecording, isSupported } = useDictation({
          onChange: field.onChange,
          value: field.value ?? '',
        });

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <DictationTextarea
                rows={3}
                {...field}
                value={field.value ?? ''}
                isRecording={isRecording}
                onToggleRecording={toggleRecording}
                isSupported={isSupported}
              />
            </FormControl>
            {isRecording && <SimpleWave className="text-primary" />}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}


export function ExamensComplementaires() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Stethoscope />
            Examens Complémentaires
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6">
        <DictationField name="echo_coeur" label="Echo Coeur" />
        <DictationField name="coro" label="Coronographie" />
      </CardContent>
    </Card>
  );
}
