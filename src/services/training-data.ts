'use server';

import { getCecForms } from '@/services/cec';

export interface TrainingDataPoint {
    features: {
        poids: number;
        taille: number;
        age: number;
        hematocrite: number;
        hemoglobine: number;
        dureeCec: number;
    };
    labels: {
        transfusion: number; // 0 or 1
        complications: number; // 0 or 1
    }
}

function parseDuration(durationStr: string | undefined): number {
    if (!durationStr) return 0;
    // Assuming format "HH:MM" or just minutes. Very basic parsing.
    // If it's pure minutes string:
    if (!isNaN(Number(durationStr))) return Number(durationStr);
    // If HH:MM
    if (durationStr.includes(':')) {
        const [h, m] = durationStr.split(':').map(Number);
        return (h * 60) + m;
    }
    return 0;
}

export async function getTrainingData(): Promise<TrainingDataPoint[]> {
    try {
        const reports = await getCecForms();
        const trainingData: TrainingDataPoint[] = [];

        for (const report of reports) {
            // Filter out incomplete data
            if (!report.poids || !report.taille || !report.age || !report.hb || !report.hte) {
                continue;
            }

            const features = {
                poids: Number(report.poids),
                taille: Number(report.taille),
                age: Number(report.age),
                hematocrite: Number(report.hte),
                hemoglobine: Number(report.hb),
                dureeCec: parseDuration(report.duree_cec),
            };

            // Determine labels based on report content

            // Label 1: Transfusion (Did they receive blood products?)
            // We check 'entrees_apports_anesthesiques' or 'autres_drogues' for blood products.
            // Since structure is loose, we look for key terms in 'autres_drogues'
            let transfusion = 0;
            if (report.autres_drogues && report.autres_drogues.length > 0) {
                const bloodTerms = ['culot', 'cgr', 'pfc', 'u.p', 'concentration'];
                const hasBlood = report.autres_drogues.some(d =>
                    bloodTerms.some(term => d.nom?.toLowerCase().includes(term))
                );
                if (hasBlood) transfusion = 1;
            }

            // Label 2: Complications (Placeholder logic: if note mentions "complication" or stay > X)
            // Ideally this comes from a structured field. For now using observations keywords.
            let complications = 0;
            if (report.observations && report.observations.toLowerCase().includes('complication')) {
                complications = 1;
            }

            trainingData.push({ features, labels: { transfusion, complications } });
        }

        return trainingData;
    } catch (error) {
        console.error("Failed to fetch training data:", error);
        return [];
    }
}
