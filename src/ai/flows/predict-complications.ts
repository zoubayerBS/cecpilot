'use server';

/**
 * @fileOverview An AI agent for predicting complications during cardiac surgery.
 * - predictComplications: Analyzes patient data to predict risks of hypotension, SIRS, and coagulopathy.
 * - ComplicationsPredictionInput: Input schema for the prediction.
 * - ComplicationsPredictionOutput: Output schema for the prediction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ComplicationsPredictionInputSchema = z.object({
    age: z.number().describe('Âge du patient en années.'),
    poids: z.number().describe('Poids du patient en kilogrammes.'),
    hb: z.number().describe('Niveau d\'hémoglobine en g/dL.'),
    dureeCecMinutes: z.number().describe('Durée anticipée de la CEC en minutes.'),
    hemodilution: z.number().describe('Hématocrite estimé après priming en %.'),
});
export type ComplicationsPredictionInput = z.infer<typeof ComplicationsPredictionInputSchema>;

const ComplicationsPredictionOutputSchema = z.object({
    hypotension: z.object({
        risk: z.enum(['Faible', 'Modéré', 'Élevé']).describe("Niveau de risque d'hypotension."),
        assessment: z.string().describe("Évaluation et justification du risque d'hypotension."),
    }),
    sirs: z.object({
        risk: z.enum(['Faible', 'Modéré', 'Élevé']).describe('Niveau de risque de Syndrome de Réponse Inflammatoire Systémique (SIRS).'),
        assessment: z.string().describe('Évaluation et justification du risque de SIRS.'),
    }),
    coagulopathie: z.object({
        risk: z.enum(['Faible', 'Modéré', 'Élevé']).describe('Niveau de risque de coagulopathie.'),
        assessment: z.string().describe('Évaluation et justification du risque de coagulopathie.'),
    }),
});
export type ComplicationsPredictionOutput = z.infer<typeof ComplicationsPredictionOutputSchema>;


export async function predictComplications(input: ComplicationsPredictionInput): Promise<ComplicationsPredictionOutput> {
  return predictComplicationsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'predictComplicationsPrompt',
  input: { schema: ComplicationsPredictionInputSchema },
  output: { schema: ComplicationsPredictionOutputSchema },
  prompt: `Vous êtes un anesthésiste et perfusionniste expert en chirurgie cardiaque. Votre rôle est de prédire les risques de complications post-opératoires basées sur les données pré- et per-opératoires.

  Données du patient:
  - Âge: {{{age}}} ans
  - Poids: {{{poids}}} kg
  - Hémoglobine pré-op: {{{hb}}} g/dL
  - Hématocrite post-hémodilution: {{{hemodilution}}}%
  - Durée de CEC estimée: {{{dureeCecMinutes}}} minutes

  Tâches:
  1.  **Risque d'Hypotension à la sortie de CEC**: Évaluez le risque (Faible, Modéré, Élevé). Tenez compte de l'âge, de l'hémoglobine (un patient anémique est plus à risque), et de la durée de la CEC (une durée longue augmente le risque vasoplégique). Fournissez une brève évaluation.
  
  2.  **Risque de Syndrome de Réponse Inflammatoire Systémique (SIRS)**: Évaluez le risque. Une hémodilution importante (Ht bas) et une longue durée de CEC sont des facteurs de risque majeurs. L'âge avancé est également un facteur. Fournissez une brève évaluation.

  3.  **Risque de Coagulopathie**: Évaluez le risque. Ce risque est augmenté par une hémodilution sévère (dilution des facteurs de coagulation) et une durée de CEC prolongée (activation plaquettaire et consommation des facteurs). Fournissez une brève évaluation.

  Pour chaque risque, définissez le champ 'risk' et fournissez une évaluation concise dans 'assessment'.
  `,
});

const predictComplicationsFlow = ai.defineFlow(
  {
    name: 'predictComplicationsFlow',
    inputSchema: ComplicationsPredictionInputSchema,
    outputSchema: ComplicationsPredictionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
