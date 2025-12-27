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
import { type CecFormValues } from "./schema";
import { Textarea } from "../ui/textarea";
import { Combobox } from "../ui/combobox";
import { useQuery } from "@tanstack/react-query";
import { getUtilities } from "@/services/utilities";
import { Skeleton } from "../ui/skeleton";
import { ClipboardList } from "lucide-react";

export function ClinicalDetails() {
    const { control } = useFormContext<CecFormValues>();

    const { data: interventionOptions, isLoading: isLoadingInterventions } = useQuery({
        queryKey: ['utilities', ['interventions']],
        queryFn: () => getUtilities(['interventions']),
        staleTime: 5 * 60 * 1000,
    });

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="diagnostic"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Diagnostic</FormLabel>
                        <FormControl>
                            <Textarea rows={3} {...field} value={field.value ?? ""} placeholder="Indications opératoires..." />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="intervention"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Intervention</FormLabel>
                        {isLoadingInterventions ? (
                            <Skeleton className="h-10 w-full" />
                        ) : (
                            <Combobox
                                category={"interventions"}
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                options={interventionOptions?.['interventions'] ?? []}
                                disabled={isLoadingInterventions}
                            />
                        )}
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
