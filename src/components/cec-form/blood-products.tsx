import { z } from 'zod';

const nullableNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
  z.number().optional().nullable()
);

export const primingSolutes = [
    'Plasma Frais Congelé',
    'Concentré Globulaire',
    'Ringer Lactate',
    'Sérum Physiologique',
    'Plasmagel',
    'Mannitol',
    'Bicarbonate de Sodium',
    'Autre'
];

export type UtilityCategory = 'interventions' | 'chirurgiens' | 'anesthesistes' | 'personnel' | 'techniciens-anesthesie' | 'drogues';


const primingRowSchema = z.object({
    id: z.string().optional(),
    solute: z.string().optional(),
    initial: nullableNumber,
    ajout: nullableNumber,
});

const bloodGasMeasureSchema = z.record(z.any());

const cardioplegiaDoseSchema = z.object({
    id: z.string().optional(),
    dose: nullableNumber,
    minCec: nullableNumber,
    temp: nullableNumber,
});

const autreDrogueSchema = z.object({
    id: z.string().optional(),
    nom: z.string().optional(),
    dose: z.string().optional(),
    unite: z.string().optional(),
    heure: z.string().optional(),
});

export const eventTypes = [
    'Départ CEC',
    'Clampage',
    'Déclampage',
    'Fin CEC',
    'Autre'
] as const;

export const timelineEventSchema = z.object({
    id: z.string().optional(), // Added for react-hook-form key
    type: z.enum(eventTypes),
    name: z.string(),
    time: z.string(),
});

export type TimelineEvent = z.infer<typeof timelineEventSchema>;

const hemodynamicMeasureSchema = z.object({
    id: z.string().optional(),
    time: z.string().optional(),
    pression_systolique: nullableNumber,
    pression_diastolique: nullableNumber,
    fc: nullableNumber,
    spo2: nullableNumber,
});

export type HemodynamicMeasure = z.infer<typeof hemodynamicMeasureSchema>;

export const cecFormSchema = z.object({
    id: z.string().optional(), // To track existing documents
    // Header
    numero_cec: z.string().optional(),
    date_cec: z.string({ required_error: "La date est requise." }),

    // Patient
    nom_prenom: z.string({ required_error: "Le nom du patient est requis." }).min(1, "Le nom du patient ne peut pas être vide."),
    matricule: z.string().optional(),
    ch: z.string().optional(),
    date_naissance: z.string().optional(),
    age: nullableNumber,
    sexe: z.enum(['homme', 'femme']).optional(),
    poids: z.coerce.number({invalid_type_error: "Le poids doit être un nombre."}).positive("Le poids doit être positif.").optional(),
    taille: z.coerce.number({invalid_type_error: "La taille doit être un nombre."}).positive("La taille doit être positive.").optional(),
    surface_corporelle: nullableNumber,
    debit_theorique: nullableNumber,
    origine: z.string().optional(),
    diagnostic: z.string().optional(),
    intervention: z.string().optional(),

    // Team
    operateur: z.string().optional(),
    aide_op: z.string().optional(),
    instrumentiste: z.string().optional(),
    perfusionniste: z.string().optional(),
    panseur: z.string().optional(),
    anesthesiste: z.string().optional(),
    technicien_anesthesie: z.string().optional(),

    // Pre-op
    gs: z.string().optional(),
    hte: z.string().optional(),
    hb: z.string().optional(),
    na: z.string().optional(),
    k: z.string().optional(),
    creat: z.string().optional(),
    protides: z.string().optional(),
    
    // Examens complémentaires
    echo_coeur: z.string().optional(),
    coro: z.string().optional(),

    // Equipment
    oxygenateur: z.string().optional(),
    circuit: z.string().optional(),
    canule_art: z.string().optional(),
    canule_vein: z.string().optional(),
    canule_cardio: z.string().optional(),
    canule_decharge: z.string().optional(),
    kit_hemo: z.string().optional(),

    // Anticoagulation
    heparine_circuit: nullableNumber,
    heparine_malade: nullableNumber,
    heparine_total: nullableNumber,
    autres_drogues: z.array(autreDrogueSchema).optional(),

    // Valve Replacement
    remplacement_valvulaire: z.enum(['oui', 'non']).optional(),
    valve_aortique: z.boolean().optional(),
    valve_mitrale: z.boolean().optional(),
    valve_tricuspide: z.boolean().optional(),

    // Priming
    priming: z.array(primingRowSchema).optional(),

    // Timeline
    timelineEvents: z.array(timelineEventSchema).optional().default([]),
    duree_assistance: z.string().optional(),
    duree_cec: z.string().optional(),
    duree_clampage: z.string().optional(),

    // Blood Gases
    bloodGases: z.array(bloodGasMeasureSchema).optional(),

    // Hemodynamic Monitoring
    hemodynamicMonitoring: z.array(hemodynamicMeasureSchema).optional(),

    // Cardioplegia
    type_cardioplegie: z.string().optional(),
    autre_cardioplegie: z.string().optional(),
    cardioplegiaDoses: z.array(cardioplegiaDoseSchema).optional(),

    // I/O Balance
    entrees_apports_anesthesiques: nullableNumber,
    entrees_priming: nullableNumber,
    entrees_cardioplegie: nullableNumber,
    sorties_diurese: nullableNumber,
    sorties_hemofiltration: nullableNumber,
    sorties_aspiration_perdue: nullableNumber,
    sorties_sang_pompe_residuel: nullableNumber,
    total_entrees: nullableNumber.optional(),
    total_sorties: nullableNumber.optional(),
    
    // Observations
    observations: z.string().optional(),

    // Metadata
    createdByUsername: z.string().optional(),
    lastModifiedByUsername: z.string().optional(),
});

export type CecFormValues = z.infer<typeof cecFormSchema>;