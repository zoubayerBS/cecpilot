"use client";

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { PrimingCategory } from './schema';

interface PrimingAlertsProps {
    totalVolume: number;
    totalsByCategory: Record<PrimingCategory, number>;
    patientWeight?: number;
    patientBSA?: number;
    patientAge?: number; // Optional, to distinguish pediatric if needed
}

export function PrimingAlerts({
    totalVolume,
    totalsByCategory,
    patientWeight,
    patientBSA
}: PrimingAlertsProps) {
    const alerts: React.ReactNode[] = [];

    // Constants for thresholds (Adult default)
    // Could be refined based on patiend data (Pediatric vs Adult)
    const isPediatric = (patientWeight && patientWeight < 40) || (patientBSA && patientBSA < 1.2);

    // 1. Volume Alerts
    if (!isPediatric) {
        if (totalVolume > 2000) {
            alerts.push(
                <Alert key="vol-high" variant="destructive" className="bg-orange-50 text-orange-900 border-orange-200">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertTitle>Volume total élevé</AlertTitle>
                    <AlertDescription>
                        Le volume de priming ({totalVolume} ml) dépasse 2000 ml. Vérifiez s'il s'agit d'une erreur de saisie.
                    </AlertDescription>
                </Alert>
            );
        } else if (totalVolume > 0 && totalVolume < 800) {
            alerts.push(
                <Alert key="vol-low" variant="default" className="bg-yellow-50 text-yellow-900 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle>Volume faible</AlertTitle>
                    <AlertDescription>
                        Le volume ({totalVolume} ml) semble faible pour un circuit adulte standard. Risque d'embolie gazeuse ou hémodilution insuffisante.
                    </AlertDescription>
                </Alert>
            );
        }
    }

    // 2. Composition Alerts
    const bloodVolume = totalsByCategory['produit_sanguin'] || 0;
    const crystalVolume = totalsByCategory['cristalloide'] || 0;

    if (totalVolume > 0) {
        // High Blood Products Ratio
        if ((bloodVolume / totalVolume) > 0.3) {
            alerts.push(
                <Alert key="blood-high" variant="default" className="bg-blue-50 text-blue-900 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Proportion élevée de produits sanguins</AlertTitle>
                    <AlertDescription>
                        Les produits sanguins représentent {((bloodVolume / totalVolume) * 100).toFixed(0)}% du priming.
                    </AlertDescription>
                </Alert>
            );
        }

        // No Crystalloids
        if (crystalVolume === 0) {
            alerts.push(
                <Alert key="no-crystal" variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertTitle>Absence de cristalloïdes</AlertTitle>
                    <AlertDescription>
                        Aucun cristalloïde n'a été ajouté au priming.
                    </AlertDescription>
                </Alert>
            );
        }
    }

    if (alerts.length === 0) return null;

    return (
        <div className="space-y-3 mb-4">
            {alerts}
        </div>
    );
}
