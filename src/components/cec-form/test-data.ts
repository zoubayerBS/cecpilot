
import type { CecFormValues } from './schema';

export const testData: CecFormValues = {
  // Patient Info
  numero_cec: '2024-123',
  date_cec: new Date().toISOString().split('T')[0],
  nom_prenom: 'Alain Dupont',
  date_naissance: '1964-05-20',
  sexe: 'homme',
  poids: 75,
  taille: 180,
  diagnostic: 'Rétrécissement aortique sévère. FEVG 55%.',
  intervention: 'Remplacement valvulaire aortique par prothèse mécanique St. Jude #23',

  // Team
  operateur: 'Dr. Dubois',
  aide_op: 'Dr. Petit',
  instrumentiste: 'Mme. Martin',
  perfusionniste: 'M. Bernard',
  anesthesiste: 'Dr. Leroy',
  technicien_anesthesie: 'Mme. Garcia',

  // Pre-op
  gs: 'O+',
  hte: '42',
  hb: '14.1',
  na: '140',
  k: '4.2',
  creat: '0.9',
  protides: '68',

  // Examens
  echo_coeur: 'FEVG conservée à 55%. Hypertrophie ventriculaire gauche concentrique. Valve aortique tricuspide, calcifiée, sténosante.',
  coro: 'Absence de lésion coronaire significative.',

  // Equipment
  oxygenateur: 'Affinity Fusion',
  circuit: 'Medtronic Cortiva',
  canule_art: 'EOPA 22Fr',
  canule_vein: 'Medtronic 29/34Fr',
  canule_cardio: 'Medtronic DLP 9Fr',
  canule_decharge: 'Ventriculaire gauche via OVD',
  kit_hemo: 'Prismaflex M100',

  // Anticoagulation & Drogues
  heparine_circuit: 30000,
  heparine_malade: 25000,
  autres_drogues: [
    { nom: 'Acide Tranexamique (Exacyl)', dose: '1', unite: 'g', heure: '08:15' },
    { nom: 'Mannitol 20%', dose: '100', unite: 'ml', heure: '08:30' },
    { nom: 'Sufentanil', dose: '50', unite: 'mcg', heure: '08:40' },
    { nom: 'Noradrénaline', dose: '0.05', unite: 'mcg/kg/min', heure: '10:30' },
  ],
  
  // Priming
  priming: [
      { id: 'Plasma Frais Congelé', solute: 'Plasma Frais Congelé', initial: 500 },
      { id: 'Concentré Globulaire', solute: 'Concentré Globulaire', initial: 250 },
      { id: 'Ringer Lactate', solute: 'Ringer Lactate', initial: 1000 },
      { id: 'Sérum Physiologique', solute: 'Sérum Physiologique' },
      { id: 'Plasmagel', solute: 'Plasmagel' },
      { id: 'Mannitol', solute: 'Mannitol', initial: 100 },
      { id: 'Bicarbonate de Sodium', solute: 'Bicarbonate de Sodium', initial: 100 },
      { id: 'Autre', solute: 'Autre' },
  ],

  // Timeline
  timelineEvents: [
    { type: 'Départ CEC', name: 'Départ CEC', time: '09:05' },
    { type: 'Clampage', name: 'Clampage', time: '09:20' },
    { type: 'Autre', name: 'Début Cardioplégie', time: '09:21' },
    { type: 'Déclampage', name: 'Déclampage', time: '10:15' },
    { type: 'Autre', name: 'Choc électrique externe 20J', time: '10:18' },
    { type: 'Fin CEC', name: 'Fin CEC', time: '10:45' },
  ],

  // Hemodynamic Monitoring
  hemodynamicMonitoring: [
    { time: '09:00', pression_systolique: 120, pression_diastolique: 80, fc: 75, spo2: 99 },
    { time: '09:15', pression_systolique: 95, pression_diastolique: 60, fc: 80, spo2: 100 },
    { time: '09:30', pression_systolique: 90, pression_diastolique: 55, fc: 70, spo2: 100 },
    { time: '09:45', pression_systolique: 88, pression_diastolique: 52, fc: 68, spo2: 100 },
    { time: '10:00', pression_systolique: 92, pression_diastolique: 58, fc: 65, spo2: 100 },
    { time: '10:15', pression_systolique: 95, pression_diastolique: 60, fc: 72, spo2: 100 },
    { time: '10:30', pression_systolique: 110, pression_diastolique: 70, fc: 85, spo2: 98 },
    { time: '10:45', pression_systolique: 115, pression_diastolique: 75, fc: 82, spo2: 99 },
  ],

  // Cardioplegia
  type_cardioplegie: 'delnido',
  cardioplegiaDoses: [
    { heure: '09:21', dose: 1000, minCec: 1, temp: 8 },
    { heure: '10:05', dose: 500, minCec: 45, temp: 10 },
  ],

  // Blood Gases
  bloodGases: [
    { time: 'Avant CEC', act: 120, temperature: 36.5, ht: 41, hb: 13.8, pao2: 150, paco2: 40, ph: 7.40, sat: 99, hco3: 24, be: 0, k: 4.1, na: 140, ca: 1.2, lactate: 1.1, diurese: 50 },
    { time: '15 min CEC', act: 510, temperature: 32.0, ht: 28, hb: 9.2, pao2: 250, paco2: 42, ph: 7.38, sat: 100, hco3: 23, be: -1.5, k: 3.8, na: 138, ca: 1.15, lactate: 1.8, diurese: 150 },
    { time: '30 min CEC', act: 550, temperature: 30.0, ht: 27, hb: 9.0, pao2: 280, paco2: 41, ph: 7.37, sat: 100, hco3: 22.5, be: -2.0, k: 4.0, na: 139, ca: 1.18, lactate: 2.2, diurese: 100 },
    { time: '60 min CEC', act: 520, temperature: 34.0, ht: 29, hb: 9.5, pao2: 230, paco2: 38, ph: 7.41, sat: 100, hco3: 25, be: 0.5, k: 4.3, na: 141, ca: 1.22, lactate: 1.5, diurese: 200 },
    { time: 'Post CEC', act: 145, temperature: 36.8, ht: 30, hb: 10.1, pao2: 130, paco2: 39, ph: 7.42, sat: 99, hco3: 25, be: 1.0, k: 4.2, na: 140, ca: 1.21, lactate: 1.2, diurese: 100 },
  ],
  
  // I/O Balance
  entrees_apports_anesthesiques: 500,
  sorties_hemofiltration: 800,
  sorties_aspiration_perdue: 150,
  sorties_sang_pompe_residuel: 200,

  // Observations
  observations: "Sortie de CEC sans difficulté après un choc électrique externe. Noradrénaline débutée à faible dose pour maintien de la pression artérielle moyenne. Bon plan de diurèse per-opératoire. Pas de saignement anormale constaté en fin d'intervention.",
};
