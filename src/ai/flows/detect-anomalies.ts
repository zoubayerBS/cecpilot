'use server';

/**
 * @fileOverview A data anomaly detection AI agent.
 *
 * - detectAnomalies - A function that handles the anomaly detection process.
 * - DetectAnomaliesInput - The input type for the detectAnomalies function.
 * - DetectAnomaliesOutput - The return type for the detectAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAnomaliesInputSchema = z.record(z.string(), z.any()).describe('A record of data entries where keys are field names and values are the data entered.');
export type DetectAnomaliesInput = z.infer<typeof DetectAnomaliesInputSchema>;

const DetectAnomaliesOutputSchema = z.object({
  anomalies: z
    .array(z.string())
    .describe(
      'Une liste de descriptions des anomalies détectées dans les données d\'entrée, expliquant pourquoi elles sont considérées comme anormales ou potentiellement dangereuses.'
    ),
});
export type DetectAnomaliesOutput = z.infer<typeof DetectAnomaliesOutputSchema>;

export async function detectAnomalies(
  input: DetectAnomaliesInput
): Promise<DetectAnomaliesOutput> {
  return detectAnomaliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectAnomaliesPrompt',
  input: {schema: DetectAnomaliesInputSchema},
  output: {schema: DetectAnomaliesOutputSchema},
  prompt: `Vous êtes un expert dans la détection d'anomalies et de combinaisons de valeurs potentiellement dangereuses dans les saisies de données.

  Analysez les données suivantes et identifiez toute anomalie ou combinaison de valeurs potentiellement dangereuse. Expliquez pourquoi chaque élément identifié est considéré comme une anomalie ou dangereux.

  Données : {{{json input}}}

  Tenez compte des modèles de données typiques, des plages attendues et de toute relation connue entre les champs de données lors de l'identification des anomalies.

  Formatez votre réponse comme une liste de descriptions des anomalies détectées.
  `,
});

const detectAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectAnomaliesFlow',
    inputSchema: DetectAnomaliesInputSchema,
    outputSchema: DetectAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
