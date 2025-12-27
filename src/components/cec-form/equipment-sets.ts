import { CecFormValues } from './schema';

export interface EquipmentSet {
    id: string;
    label: string;
    description: string;
    values: Partial<CecFormValues>;
}

export const EQUIPMENT_SETS: EquipmentSet[] = [
    {
        id: 'adulte_standard',
        label: 'Adulte Standard',
        description: 'Set complet pour adulte > 60kg',
        values: {
            oxygenateur: 'Inspire 8',
            circuit: 'Circuit Adulte Standard',
            kit_hemo: 'Hemofilter D150',
            canule_art: 'EOPA 22Fr',
            canule_vein: 'Double Etage 29/37',
            canule_cardio: 'Aiguille 14G',
            canule_decharge: 'Vente Aortique',
        }
    },
    {
        id: 'pediatrique',
        label: 'Pédiatrique',
        description: 'Set pour enfant 10-20kg',
        values: {
            oxygenateur: 'Fx05',
            circuit: 'Circuit Pédiatrique 1/4',
            kit_hemo: 'Hemoncfilter Min',
            canule_art: 'EOPA 12Fr',
            canule_vein: 'Bicavale 14/16',
            canule_cardio: 'Aiguille 16G',
            canule_decharge: 'Vente Aortique Ped',
        }
    },
    {
        id: 'mini_cec',
        label: 'Mini C.E.C',
        description: 'Configuration minimale',
        values: {
            oxygenateur: 'Inspire 6',
            circuit: 'Circuit Compact',
            canule_art: 'EOPA 20Fr',
            canule_vein: 'Double Etage 25/29',
        }
    }
];
