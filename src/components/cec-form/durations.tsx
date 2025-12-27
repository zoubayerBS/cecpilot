"use client";

import { useFormContext } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Timer } from "lucide-react";
import { CecFormValues } from "./schema";

export function Durations() {
    const { control } = useFormContext<CecFormValues>();

    return (
        <Card className="border-none shadow-sm bg-muted/30">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Timer className="h-4 w-4 text-primary" />
                    Récapitulatif des Durées (minutes)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                        control={control}
                        name="duree_cec"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Durée CEC</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input {...field} value={field.value || ''} placeholder="Ex: 95" className="pl-9 bg-background" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="duree_clampage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Durée Clampage</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input {...field} value={field.value || ''} placeholder="Ex: 60" className="pl-9 bg-background" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="duree_assistance"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Durée Assistance</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input {...field} value={field.value || ''} placeholder="Ex: 10" className="pl-9 bg-background" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 italic">
                    Note: Ces valeurs peuvent être saisies manuellement ou calculées automatiquement à partir du journal des événements.
                </p>
            </CardContent>
        </Card>
    );
}
