'use server';

/**
 * @fileOverview An AI agent for hematology prediction in cardiac surgery.
 * - predictHematology: Analyzes patient data to predict transfusion risk and anemia.
 * - HematologyPredictionInput: Input schema for the prediction.
 * - HematologyPredictionOutput: Output schema for the prediction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HematologyPredictionInputSchema = z.object({
  weightKg: z.number().describe('Poids du patient en kilogrammes.'),
  heightCm: z.number().describe('Taille du patient en centimètres.'),
  sex: z.enum(['homme', 'femme']).describe('Sexe du patient.'),
  initialHematocrit: z.number().describe('Niveau d\'hématocrite initial en %.'),
  initialHemoglobin: z.number().describe('Niveau d\'hémoglobine initial en g/dL.'),
  primingVolumeMl: z.number().describe('Volume du liquide d\'amorçage en millilitres.'),
});
export type HematologyPredictionInput = z.infer<typeof HematologyPredictionInputSchema>;

const HematologyPredictionOutputSchema = z.object({
  transfusionRisk: z.object({
    isRisk: z.boolean().describe('Indique s\'il existe un risque significatif de nécessiter une transfusion sanguine.'),
    assessment: z.string().describe('Une brève évaluation du risque transfusionnel, expliquant le raisonnement.'),
  }),
  transfusionRecommendation: z.object({
    recommendation: z.string().describe('Recommandation de transfusion, par exemple, "Aucune transfusion requise", "Préparer 1 culot globulaire", etc.'),
    justification: z.string().describe('Justification de la recommandation de transfusion basée sur les niveaux prédits d\'hématocrite/hémoglobine.'),
  }),
  anemiaDetection: z.object({
    isAnemia: z.boolean().describe('Indique si le patient est susceptible d\'avoir ou de développer une anémie sévère pendant la procédure.'),
    assessment: z.string().describe('Évaluation du statut de l\'anémie et de son impact potentiel sur la procédure.'),
  }),
});
export type HematologyPredictionOutput = z.infer<typeof HematologyPredictionOutputSchema>;


export async function predictHematology(input: HematologyPredictionInput): Promise<HematologyPredictionOutput> {
  return predictHematologyFlow(input);
}


const prompt = ai.definePrompt({
  name: 'predictHematologyPrompt',
  input: { schema: HematologyPredictionInputSchema },
  output: { schema: HematologyPredictionOutputSchema },
  prompt: `Vous êtes un perfusionniste et anesthésiste expert spécialisé en chirurgie cardiaque. Votre tâche est d'analyser les données des patients pour prédire les résultats hématologiques pendant la circulation extracorporelle (CEC).

Données du patient :
- Poids : {{{weightKg}}} kg
- Taille : {{{heightCm}}} cm
- Sexe : {{{sex}}}
- Hématocrite initial : {{{initialHematocrit}}}%
- Hémoglobine initiale : {{{initialHemoglobin}}} g/dL
- Volume d'amorçage de la CEC : {{{primingVolumeMl}}} ml

Sur la base de ces données, effectuez l'analyse suivante :

1. **Évaluation du risque de transfusion** : Évaluez la probabilité que le patient nécessite une transfusion sanguine. Tenez compte de l'hématocrite post-hémodilution. Un déclencheur de transfusion courant est un hématocrite inférieur à 21-25% ou une hémoglobine inférieure à 7-8 g/dL. Indiquez s'il existe un risque et expliquez brièvement pourquoi.

2. **Recommandation de transfusion** : En fonction du risque, recommandez une ligne de conduite. Cela peut aller de "aucune action nécessaire" à "préparer X unités de concentrés de globules rouges". Justifiez votre recommandation.

3. **Détection de l'anémie** : Déterminez si les valeurs initiales ou les valeurs prédites post-dilution indiquent une anémie sévère qui pourrait compliquer la procédure. Expliquez les implications.

Fournissez une analyse concise et claire dans le format de sortie spécifié.
`,
});

const predictHematologyFlow = ai.defineFlow(
  {
    name: 'predictHematologyFlow',
    inputSchema: HematologyPredictionInputSchema,
    outputSchema: HematologyPredictionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
