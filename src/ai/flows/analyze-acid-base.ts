'use server';

/**
 * @fileOverview An AI agent for analyzing acid-base and electrolyte status.
 * - analyzeAcidBase: Analyzes blood gas values to identify disorders and recommend corrections.
 * - AcidBaseAnalysisInput: Input schema for the analysis.
 * - AcidBaseAnalysisOutput: Output schema for the analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AcidBaseAnalysisInputSchema = z.object({
    poids: z.number().describe('Poids du patient en kilogrammes.'),
    ph: z.number().describe('La valeur du pH sanguin.'),
    paco2: z.number().describe('La pression partielle de dioxyde de carbone (PaCO2) en mmHg.'),
    hco3: z.number().describe('La concentration en bicarbonate (HCO3-) en mmol/L.'),
    k: z.number().describe('La concentration en potassium (K+) en mEq/L.'),
    hematocrite: z.number().describe('Le niveau d\'hématocrite en %.'),
});
export type AcidBaseAnalysisInput = z.infer<typeof AcidBaseAnalysisInputSchema>;

const AcidBaseAnalysisOutputSchema = z.object({
    acidBaseStatus: z.object({
        status: z.string().describe("Le trouble acido-basique principal identifié (ex: 'Acidose métabolique compensée', 'Équilibre normal')."),
        assessment: z.string().describe("Une évaluation détaillée du trouble, expliquant les valeurs clés."),
    }),
    electrolyteStatus: z.object({
        status: z.string().describe("Le statut électrolytique principal identifié (ex: 'Hyperkaliémie modérée', 'Kaliémie normale')."),
        assessment: z.string().describe("Une évaluation du statut du potassium et d'autres électrolytes pertinents."),
    }),
    recommendations: z.array(z.string()).describe("Une liste de recommandations concrètes pour corriger les troubles identifiés."),
});
export type AcidBaseAnalysisOutput = z.infer<typeof AcidBaseAnalysisOutputSchema>;


export async function analyzeAcidBase(input: AcidBaseAnalysisInput): Promise<AcidBaseAnalysisOutput> {
  return analyzeAcidBaseFlow(input);
}


const prompt = ai.definePrompt({
  name: 'analyzeAcidBasePrompt',
  input: { schema: AcidBaseAnalysisInputSchema },
  output: { schema: AcidBaseAnalysisOutputSchema },
  prompt: `Vous êtes un expert en physiologie de la CEC et en réanimation. Votre rôle est d'analyser les gaz du sang d'un patient pour identifier les troubles acido-basiques et électrolytiques et de proposer des corrections.

  Données d'entrée:
  - Poids: {{{poids}}} kg
  - pH: {{{ph}}}
  - PaCO2: {{{paco2}}} mmHg
  - HCO3-: {{{hco3}}} mmol/L
  - Potassium (K+): {{{k}}} mEq/L
  - Hématocrite: {{{hematocrite}}}%

  Tâches:
  1.  **Analyser l'état Acido-Basique**:
      - Identifiez le trouble primaire (métabolique ou respiratoire, acidose ou alcalose) en vous basant sur le pH et la PaCO2/HCO3-.
      - Évaluez la compensation.
      - Fournissez un statut clair (ex: "Acidose métabolique décompensée") et une évaluation concise.

  2.  **Analyser l'état Électrolytique**:
      - Évaluez la kaliémie. Classifiez-la (hypo/hyper/normo-kaliémie).
      - Évaluez l'impact de l'hématocrite (hémodilution) sur les électrolytes.
      - Fournissez un statut clair (ex: "Hyperkaliémie sévère") et une évaluation.

  3.  **Fournir des Recommandations**:
      - Si acidose métabolique, proposez une correction au bicarbonate de sodium.
      - Si trouble respiratoire, suggérez un ajustement de la ventilation (sweep gas).
      - Si hyperkaliémie, recommandez une hémofiltration ou d'autres mesures correctives.
      - Si hypokaliémie, suggérez une administration de KCl.
      - Si tout est normal, indiquez "Maintenir la surveillance".

  Soyez précis et direct dans vos recommandations.
  `,
});

const analyzeAcidBaseFlow = ai.defineFlow(
  {
    name: 'analyzeAcidBaseFlow',
    inputSchema: AcidBaseAnalysisInputSchema,
    outputSchema: AcidBaseAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
