'use server';

/**
 * @fileOverview An AI agent for optimizing perfusion during cardiac surgery.
 * - optimizePerfusion: Analyzes patient data to calculate DO2 and assess perfusion adequacy.
 * - OptimizePerfusionInput: Input schema for the optimization.
 * - OptimizePerfusionOutput: Output schema for the optimization.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OptimizePerfusionInputSchema = z.object({
  poids: z.number().describe('Poids du patient en kilogrammes.'),
  debitCec: z.number().describe('Débit de la CEC en L/min.'),
  hb: z.number().describe('Niveau d\'hémoglobine actuel en g/dL.'),
  surfaceCorporelle: z.number().describe('Surface corporelle du patient en m².'),
});
type OptimizePerfusionInput = z.infer<typeof OptimizePerfusionInputSchema>;

const OptimizePerfusionOutputSchema = z.object({
  do2: z.number().describe('Délivrance en oxygène calculée en ml/min/m².'),
  isAdequate: z.boolean().describe('Indique si la DO2 est adéquate (généralement > 280 ml/min/m²).'),
  assessment: z.string().describe('Une brève évaluation de l\'état de la perfusion.'),
  recommendation: z.string().describe('Recommandation pour optimiser la perfusion si nécessaire.'),
});
type OptimizePerfusionOutput = z.infer<typeof OptimizePerfusionOutputSchema>;

export async function optimizePerfusion(input: OptimizePerfusionInput): Promise<OptimizePerfusionOutput> {
  return optimizePerfusionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizePerfusionPrompt',
  input: { schema: OptimizePerfusionInputSchema },
  output: { schema: OptimizePerfusionOutputSchema },
  prompt: `Vous êtes un expert perfusionniste. Votre rôle est d'analyser les données de perfusion pour optimiser la délivrance en oxygène (DO2) et prévenir l'hypoxie tissulaire.

  Données d'entrée:
  - Poids: {{{poids}}} kg
  - Surface Corporelle (BSA): {{{surfaceCorporelle}}} m²
  - Débit CEC: {{{debitCec}}} L/min
  - Hémoglobine (Hb): {{{hb}}} g/dL

  Tâches:
  1.  **Calculez la DO2 indexée (DO2i)** en ml/min/m².
      - Formule CaO2 = Hb * 1.34 * 0.99 (en supposant une saturation de 99%).
      - Formule DO2 = Débit CEC * CaO2 * 10.
      - Formule DO2i = DO2 / BSA.
      - Le seuil critique pour la DO2i est généralement considéré autour de 280 ml/min/m².

  2.  **Évaluez si la perfusion est adéquate**:
      - Comparez la DO2i calculée au seuil de 280 ml/min/m².
      - Définissez \`isAdequate\` à \`true\` si la DO2i est supérieure au seuil, sinon \`false\`.

  3.  **Fournissez une évaluation (assessment)**:
      - Si la perfusion est adéquate, confirmez-le.
      - Si elle est inadéquate, décrivez la situation comme "critique" ou "limite".

  4.  **Proposez une recommandation (recommendation)**:
      - Si la DO2i est faible, suggérez des actions concrètes pour l'améliorer, comme "Augmenter le débit de la CEC si la pression le permet" ou "Considérer une transfusion pour augmenter l'hémoglobine".
      - Si la DO2i est adéquate, indiquez "Maintenir les paramètres actuels et continuer la surveillance".

  Fournissez le résultat dans le format JSON spécifié.
  `,
});

const optimizePerfusionFlow = ai.defineFlow(
  {
    name: 'optimizePerfusionFlow',
    inputSchema: OptimizePerfusionInputSchema,
    outputSchema: OptimizePerfusionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
