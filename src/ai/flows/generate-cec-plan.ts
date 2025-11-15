'use server';

/**
 * @fileOverview An AI agent for generating a comprehensive CPB plan.
 * - generateCecPlan: Analyzes all patient data to create a personalized CPB plan and predictive alerts.
 * - CecPlanInput: Input schema for the plan generation.
 * - CecPlanOutput: Output schema for the plan generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CecPlanInputSchema = z.object({
    poids: z.number().optional().describe('Poids du patient en kg.'),
    taille: z.number().optional().describe('Taille du patient en cm.'),
    sexe: z.enum(['homme', 'femme']).describe('Sexe du patient.'),
    age: z.number().optional().describe('Âge du patient en années.'),
    hematocriteInitial: z.number().optional().describe('Hématocrite initial en %.'),
    hbInitial: z.number().optional().describe('Hémoglobine initiale en g/dL.'),
    volumePriming: z.number().optional().describe('Volume du priming en ml.'),
    dureeCec: z.number().optional().describe('Durée prévue de la CEC en minutes.'),
    ph: z.number().optional().describe('pH sanguin.'),
    paco2: z.number().optional().describe('PaCO2 en mmHg.'),
    hco3: z.number().optional().describe('HCO3- en mmol/L.'),
    k: z.number().optional().describe('Potassium en mEq/L.'),
    bsa: z.number().optional().describe('Surface corporelle calculée en m².'),
    debitTheorique: z.number().optional().describe('Débit de CEC théorique calculé en L/min.'),
    hematocritePostPriming: z.number().optional().describe('Hématocrite post-priming calculé en %.'),
});
export type CecPlanInput = z.infer<typeof CecPlanInputSchema>;

const CecPlanOutputSchema = z.object({
  plan: z.array(
    z.object({
      title: z.string().describe('Titre de la section du plan (ex: "Plan de Perfusion", "Gestion des Risques").'),
      content: z.array(z.string()).describe('Liste des points ou recommandations pour cette section.'),
    })
  ).describe('Un plan de CEC personnalisé et détaillé.'),
  alerts: z.array(
      z.object({
          riskLevel: z.enum(['Élevé', 'Modéré', 'Faible']).describe("Niveau de risque de l'alerte."),
          description: z.string().describe("Description de l'alerte prédictive."),
      })
  ).describe('Liste des alertes prédictives les plus importantes.'),
});
export type CecPlanOutput = z.infer<typeof CecPlanOutputSchema>;


export async function generateCecPlan(input: CecPlanInput): Promise<CecPlanOutput> {
  return generateCecPlanFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateCecPlanPrompt',
  input: { schema: CecPlanInputSchema },
  output: { schema: CecPlanOutputSchema },
  prompt: `Vous êtes un expert perfusionniste et anesthésiste de renommée mondiale. Votre rôle est de créer un plan de circulation extra-corporelle (CEC) complet et personnalisé à partir des données fournies, en mettant en évidence les risques et les stratégies d'optimisation.

  Données d'entrée:
  {{{json input}}}

  Tâches:
  1.  **Générer les Alertes Principales**:
      - Identifiez les 2 ou 3 risques les plus significatifs pour ce patient.
      - Pour chaque risque (ex: anémie sévère post-hémodilution, faible DO2, risque de SIRS élevé), assignez un niveau de risque (Élevé, Modéré, Faible) et décrivez-le clairement.

  2.  **Générer le Plan de CEC**:
      - Créez plusieurs sections claires pour le plan.
      - **Plan de Perfusion**: Recommandez un débit de pompe initial basé sur le débit théorique. Spécifiez un objectif de Pression Artérielle Moyenne (PAM). Commentez la DO2 attendue et la stratégie pour la maintenir au-dessus du seuil critique (280 ml/min/m²).
      - **Gestion Hématologique**: Commentez l'hématocrite post-hémodilution. Recommandez une stratégie de transfusion (ex: "Préparer 2 culots globulaires", "Transfusion si Ht < 24%"). Mentionnez l'objectif d'hémoglobine.
      - **Gestion de l'Anticoagulation**: Proposez une dose initiale d'héparine (classiquement 300-400 UI/kg). Recommandez une cible d'ACT (ex: > 480 secondes).
      - **Gestion Acido-Basique**: Si des données de gaz du sang sont fournies, commentez l'état initial et proposez une stratégie de correction si nécessaire (ex: "Surveiller l'acidose métabolique", "Avoir du bicarbonate à portée de main").
      - **Stratégie de Protection Myocardique**: Recommandez un type et un volume de cardioplégie si cela semble pertinent (ex: "Cardioplégie Delnido 1L initialement").

  Soyez concis, précis et orienté vers l'action. Le plan doit être directement utilisable par une équipe médicale.
  `,
});

const generateCecPlanFlow = ai.defineFlow(
  {
    name: 'generateCecPlanFlow',
    inputSchema: CecPlanInputSchema,
    outputSchema: CecPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
