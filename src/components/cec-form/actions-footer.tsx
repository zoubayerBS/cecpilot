"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader, BrainCircuit, AlertTriangle } from "lucide-react";
import { detectAnomalies } from "@/ai/flows/detect-anomalies";
import { type CecFormValues } from "./schema";

export function ActionsFooter() {
  const { getValues } = useFormContext<CecFormValues>();
  const [anomalies, setAnomalies] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDetectAnomalies = async () => {
    setIsLoading(true);
    setAnomalies(null);
    try {
      const monitoringData = getValues("hemodynamicMonitoring");
      const bloodGases = getValues("bloodGases");

      const latestMonitoring = monitoringData && [...monitoringData].reverse().find(e => 
        Object.values(e).some(v => v !== undefined && v !== null && v !== "")
      );
      
      const latestBloodGas = bloodGases && [...bloodGases].reverse().find(e => 
        Object.values(e).some(v => v !== undefined && v !== null && v !== "")
      );

      const dataToAnalyze = { ...latestMonitoring, ...latestBloodGas };
      
      // Filter out empty properties before sending to AI
      const cleanEntry: Record<string, any> = {};
      for (const key in dataToAnalyze) {
          if (Object.prototype.hasOwnProperty.call(dataToAnalyze, key)) {
              const value = dataToAnalyze[key as keyof typeof dataToAnalyze];
              if (value !== undefined && value !== null && value !== "" && key !== 'id' && key !== 'time') {
                  cleanEntry[key] = value;
              }
          }
      }
        
      if (Object.keys(cleanEntry).length > 0) { 
            const result = await detectAnomalies(cleanEntry);
            setAnomalies(result.anomalies);
      } else {
        setAnomalies(["Veuillez saisir des données de surveillance ou de gaz du sang avant de lancer la détection."]);
      }
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      setAnomalies(["Une erreur est survenue lors de la détection des anomalies."]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
        <Button
          type="button"
          onClick={handleDetectAnomalies}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BrainCircuit className="mr-2 h-4 w-4" />
          )}
          Résumé IA
        </Button>

      <AlertDialog open={anomalies !== null} onOpenChange={() => setAnomalies(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rapport d'Anomalies</AlertDialogTitle>
            <AlertDialogDescription>
              L'IA a analysé la dernière entrée de données et a trouvé les points suivants à considérer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-60 overflow-y-auto pr-4">
             {anomalies && anomalies.length > 0 ? (
                anomalies.map((anomaly, index) => (
                    <Alert key={index} className="mb-2 bg-secondary">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Anomalie Potentielle</AlertTitle>
                        <AlertDescription>{anomaly}</AlertDescription>
                    </Alert>
                ))
            ) : (
                <Alert variant="default">
                    <AlertTitle>Aucune Anomalie Détectée</AlertTitle>
                    <AlertDescription>L'analyse n'a révélé aucune anomalie significative dans les données fournies.</AlertDescription>
                </Alert>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Fermer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
