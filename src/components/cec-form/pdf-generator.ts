
'use client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CecFormValues } from './schema';

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        const date = /^\d{4}-\d{2}-\d{2}/.test(dateString) ? parseISO(dateString) : new Date(dateString);
        return format(date, "dd/MM/yyyy", { locale: fr });
    } catch {
        return dateString;
    }
};

const formatTime = (timeString?: string) => {
    if (!timeString || !/^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) return timeString || 'N/A';
    return timeString.substring(0, 5);
};

const formatValue = (value: any, unit?: string) => {
    const isNully = value === null || value === undefined || value === '';
    return isNully ? 'N/A' : `${value}${unit ? ` ${unit}` : ''}`;
}


const FONT_SIZE_NORMAL = 10;
const FONT_SIZE_SMALL = 8;
const FONT_SIZE_TITLE = 16;
const MARGIN = 15;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

class DocBuilder {
    doc: jsPDF;
    cursor: number;

    constructor() {
        this.doc = new jsPDF('p', 'mm', 'a4');
        this.cursor = MARGIN;
    }

    checkNewPage(height: number) {
        if (this.cursor + height > PAGE_HEIGHT - MARGIN) {
            this.doc.addPage();
            this.cursor = MARGIN;
        }
    }

    addTitle(title: string) {
        this.checkNewPage(20);
        this.doc.setFontSize(FONT_SIZE_TITLE);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, PAGE_WIDTH / 2, this.cursor, { align: 'center' });
        this.cursor += 15;
    }
    
    addSectionTitle(title: string) {
        this.checkNewPage(12);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, MARGIN, this.cursor);
        this.cursor += 6;
        this.doc.setLineWidth(0.2);
        this.doc.line(MARGIN, this.cursor - 2, MARGIN + CONTENT_WIDTH, this.cursor - 2);
        this.cursor += 2;
    }
    
    addText(text: string, label?: string) {
        this.doc.setFontSize(FONT_SIZE_NORMAL);
        const textToRender = text || 'N/A';
        const labelWidth = label ? this.doc.getTextWidth(`${label}: `) + 2 : 0;
        const textLines = this.doc.splitTextToSize(textToRender, CONTENT_WIDTH - labelWidth);
        const textHeight = textLines.length * 5;

        this.checkNewPage(textHeight);

        if (label) {
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(`${label}:`, MARGIN, this.cursor);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(textLines, MARGIN + labelWidth, this.cursor);
        } else {
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(textLines, MARGIN, this.cursor);
        }
        this.cursor += textHeight + 2;
    }
    
    addTable(head: any[], body: any[], title?: string) {
        if (title) {
            this.checkNewPage(12);
            this.doc.setFontSize(FONT_SIZE_NORMAL);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(title, MARGIN, this.cursor);
            this.cursor += 6;
        }

        autoTable(this.doc, {
            head,
            body,
            startY: this.cursor,
            theme: 'grid',
            styles: { fontSize: FONT_SIZE_SMALL, cellPadding: 1.5 },
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
            didDrawPage: (data) => {
                this.cursor = data.cursor.y + 2;
            }
        });
        this.cursor = (this.doc as any).lastAutoTable.finalY + 10;
    }
    
    addKeyValueTable(items: { label: string, value: any }[][]) {
        const body = items.map(row => row.map(cell => cell.label.includes("Total") ? { content: cell.label, styles: { fontStyle: 'bold' } } : cell.label).concat(row.map(cell => cell.value)));

        const tableBody = items.flat().map(item => [item.label, item.value]);

        const tableOptions = {
            startY: this.cursor,
            body: tableBody,
            theme: 'plain' as const,
            styles: { fontSize: FONT_SIZE_NORMAL },
            columnStyles: {
                0: { fontStyle: 'bold' as const, cellWidth: 50 },
                1: { fontStyle: 'normal' as const },
            },
            didDrawPage: (data: any) => {
                this.cursor = data.cursor.y + 2;
            }
        };

        this.checkNewPage(tableBody.length * 8 + 10);
        autoTable(this.doc, tableOptions);

        this.cursor = (this.doc as any).lastAutoTable.finalY + 5;
    }


    open(filename: string) {
        this.doc.setProperties({ title: filename });
        this.doc.output('dataurlnewwindow');
    }

    asBlob(): Blob {
        return this.doc.output('blob');
    }
}

export async function generatePdf(data: CecFormValues) {
    const builder = new DocBuilder();
    
    builder.addTitle('Compte Rendu de Circulation Extra-Corporelle');

    // Header
    builder.doc.setFontSize(FONT_SIZE_NORMAL);
    builder.doc.setLineWidth(0.5);
    builder.doc.rect(MARGIN, builder.cursor, CONTENT_WIDTH, 10);
    builder.doc.text(`Patient: ${data.nom_prenom || 'N/A'}`, MARGIN + 2, builder.cursor + 6);
    builder.doc.text(`Date CEC: ${formatDate(data.date_cec)}`, MARGIN + 80, builder.cursor + 6);
    builder.doc.text(`N° CEC: ${data.numero_cec || 'N/A'}`, MARGIN + 140, builder.cursor + 6);
    builder.cursor += 15;

    builder.addSectionTitle('Informations Patient');
    builder.addKeyValueTable([
        [{ label: 'Matricule', value: formatValue(data.matricule) }],
        [{ label: 'CH', value: formatValue(data.ch) }],
        [{ label: 'Date de Naissance', value: formatDate(data.date_naissance) }],
        [{ label: 'Âge', value: formatValue(data.age, 'ans') }],
        [{ label: 'Sexe', value: formatValue(data.sexe) }],
        [{ label: 'Poids', value: formatValue(data.poids, 'kg') }],
        [{ label: 'Taille', value: formatValue(data.taille, 'cm') }],
        [{ label: 'S. Corporelle', value: formatValue(data.surface_corporelle, 'm²') }],
        [{ label: 'Débit Théorique', value: formatValue(data.debit_theorique, 'L/min') }],
    ]);
    builder.addText(data.diagnostic || '', 'Diagnostic');
    builder.addText(data.intervention || '', 'Intervention');
    
    builder.addSectionTitle('Équipe Médicale');
    builder.addKeyValueTable([
        [{ label: 'Opérateur', value: formatValue(data.operateur) }],
        [{ label: 'Aide Op.', value: formatValue(data.aide_op) }],
        [{ label: 'Instrumentiste', value: formatValue(data.instrumentiste) }],
        [{ label: 'Perfusionniste', value: formatValue(data.perfusionniste) }],
        [{ label: 'Anesthésiste', value: formatValue(data.anesthesiste) }],
        [{ label: 'Technicien Anesthésie', value: formatValue(data.technicien_anesthesie) }],
    ]);

    builder.addSectionTitle('Données Préopératoires');
    builder.addKeyValueTable([
        [{ label: 'GS', value: formatValue(data.gs) }],
        [{ label: 'Hte', value: formatValue(data.hte, '%') }],
        [{ label: 'Hb', value: formatValue(data.hb, 'g/dL') }],
        [{ label: 'Na+', value: formatValue(data.na, 'mEq/L') }],
        [{ label: 'K+', value: formatValue(data.k, 'mEq/L') }],
        [{ label: 'Créat', value: formatValue(data.creat, 'mg/dL') }],
        [{ label: 'Protides', value: formatValue(data.protides, 'g/L') }],
    ]);
    
    builder.addSectionTitle('Examens Complémentaires');
    builder.addText(data.echo_coeur || '', 'Echo Coeur');
    builder.addText(data.coro || '', 'Coronographie');

    builder.addSectionTitle('Matériel CEC');
    builder.addKeyValueTable([
        [{ label: 'Oxygénateur', value: formatValue(data.oxygenateur) }],
        [{ label: 'Circuit', value: formatValue(data.circuit) }],
        [{ label: 'Canule Artérielle', value: formatValue(data.canule_art) }],
        [{ label: 'Canule Veineuse', value: formatValue(data.canule_vein) }],
        [{ label: 'Canule Cardioplégie', value: formatValue(data.canule_cardio) }],
        [{ label: 'Canule Décharge', value: formatValue(data.canule_decharge) }],
        [{ label: 'Kit Hémofiltration', value: formatValue(data.kit_hemo) }],
    ]);
    
    builder.addSectionTitle('Anticoagulation et Drogues');
     builder.addKeyValueTable([
        [{ label: 'Héparine Circuit', value: formatValue(data.heparine_circuit, 'UI') }],
        [{ label: 'Héparine Malade', value: formatValue(data.heparine_malade, 'UI') }],
        [{ label: 'Héparine Total', value: formatValue(data.heparine_total, 'UI') }],
    ]);
    
    if (data.autres_drogues && data.autres_drogues.length > 0) {
        builder.addTable(
            [["Nom", "Dose", "Unité", "Heure"]],
            data.autres_drogues.map(d => [d.nom, d.dose, d.unite, formatTime(d.heure)])
        );
    }

    builder.addSectionTitle('Priming et Remplissage');
    const primingBody = data.priming?.filter(p => p.initial || p.ajout).map(p => [p.solute, p.initial || '0', p.ajout || '0', (p.initial || 0) + (p.ajout || 0)]) || [];
    if (primingBody.length > 0) {
        builder.addTable(
            [["Soluté", "Initial (ml)", "Ajout (ml)", "Total (ml)"]],
            primingBody
        );
    } else {
        builder.addText("Aucune donnée de priming.");
    }

    builder.addSectionTitle('Déroulement de la CEC');
    const timelineBody = data.timelineEvents?.sort((a,b) => (a.time || "").localeCompare(b.time || "")).map(e => [formatTime(e.time), e.name, e.type]) || [];
    if(timelineBody.length > 0) {
       builder.addTable(
            [["Heure", "Événement", "Type"]],
            timelineBody,
            "Journal des Événements"
        );
    }

    const cardioBody = data.cardioplegiaDoses?.map(d => [formatTime(d.heure), d.dose, d.minCec, d.temp]) || [];
     if(cardioBody.length > 0) {
        builder.addTable(
            [["Heure", "Dose (ml)", "Min CEC", "T°C"]],
            cardioBody,
            `Cardioplégie (${data.type_cardioplegie} ${data.type_cardioplegie === 'autre' ? data.autre_cardioplegie || '' : ''})`
        );
    }
    
    builder.addSectionTitle('Gaz du Sang');
    if (data.bloodGases && data.bloodGases.length > 0 && Object.keys(data.bloodGases[0]).length > 1) {
        const bgHeaders = ['Paramètre', ...(data.bloodGases?.map(bg => bg.time || '') || [])];
        const bgParams = [
            { key: 'act', label: 'ACT (sec)' }, { key: 'temperature', label: 'T° (°C)' },
            { key: 'ht', label: 'Ht (%)' }, { key: 'hb', label: 'Hb (g/dL)' },
            { key: 'pao2', label: 'Pao2 (mmHg)' }, { key: 'paco2', label: 'Paco2 (mmHg)' },
            { key: 'ph', label: 'pH' }, { key: 'sat', label: 'Sat (%)' },
            { key: 'hco3', label: 'HCO3- (mmol/L)' }, { key: 'be', label: 'BE (mmol/L)' },
            { key: 'k', label: 'K+ (mEq/L)' }, { key: 'na', label: 'Na+ (mEq/L)' },
            { key: 'ca', label: 'Ca++ (mEq/L)' }, { key: 'lactate', label: 'Lactate (mmol/L)' },
            { key: 'diurese', label: 'Diurèse (ml)' },
        ];
        const bgBody = bgParams.map(param => {
            const rowData = data.bloodGases?.map(col => formatValue((col as any)[param.key])) || [];
            return [param.label, ...rowData];
        });
        builder.addTable([bgHeaders], bgBody);
    } else {
        builder.addText("Aucune donnée de gaz du sang.");
    }
    
    builder.addSectionTitle('Bilan Entrées/Sorties');
    const entreesData = [
        { label: 'Apports Anesthésiques', value: formatValue(data.entrees_apports_anesthesiques, 'ml')},
        { label: 'Priming', value: formatValue(data.entrees_priming, 'ml')},
        { label: 'Cardioplégie', value: formatValue(data.entrees_cardioplegie, 'ml')},
        { label: 'Total Entrées', value: formatValue(data.total_entrees, 'ml')},
    ];
    const sortiesData = [
        { label: 'Diurèse', value: formatValue(data.sorties_diurese, 'ml') },
        { label: 'Hémofiltration', value: formatValue(data.sorties_hemofiltration, 'ml') },
        { label: 'Aspiration Perdue', value: formatValue(data.sorties_aspiration_perdue, 'ml') },
        { label: 'Sang Pompe Résiduel', value: formatValue(data.sorties_sang_pompe_residuel, 'ml') },
        { label: 'Total Sorties', value: formatValue(data.total_sorties, 'ml') },
    ];

    const balanceBody = [];
    const maxRows = Math.max(entreesData.length, sortiesData.length);
    for (let i = 0; i < maxRows; i++) {
        const entree = entreesData[i];
        const sortie = sortiesData[i];
        balanceBody.push([
            entree ? { content: entree.label, styles: { fontStyle: 'bold' } } : '',
            entree ? entree.value : '',
            sortie ? { content: sortie.label, styles: { fontStyle: 'bold' } } : '',
            sortie ? sortie.value : '',
        ]);
    }
    
    autoTable(builder.doc, {
        startY: builder.cursor,
        head: [['Entrées', '', 'Sorties', '']],
        body: balanceBody,
        theme: 'plain',
        tableWidth: CONTENT_WIDTH,
        headStyles: { fontStyle: 'bold', halign: 'center', fontSize: 11, fillColor: [240, 240, 240] },
        columnStyles: {
            0: { cellWidth: 45 },
            1: { cellWidth: 45, halign: 'right' },
            2: { cellWidth: 45 },
            3: { cellWidth: 45, halign: 'right' },
        },
        didDrawPage: (data: any) => {
            builder.cursor = data.cursor.y + 2;
        }
    });
    builder.cursor = (builder.doc as any).lastAutoTable.finalY + 10;
    
    builder.addSectionTitle('Observations');
    builder.addText(data.observations || 'N/A');

    const filename = `${data.nom_prenom?.replace(/ /g, '_')}_${data.matricule}.pdf`;
    builder.open(filename);
}

export async function generatePdfBlob(data: CecFormValues): Promise<Blob> {
    const builder = new DocBuilder();
    
    builder.addTitle('Compte Rendu de Circulation Extra-Corporelle');

    // Header
    builder.doc.setFontSize(FONT_SIZE_NORMAL);
    builder.doc.setLineWidth(0.5);
    builder.doc.rect(MARGIN, builder.cursor, CONTENT_WIDTH, 10);
    builder.doc.text(`Patient: ${data.nom_prenom || 'N/A'}`, MARGIN + 2, builder.cursor + 6);
    builder.doc.text(`Date CEC: ${formatDate(data.date_cec)}`, MARGIN + 80, builder.cursor + 6);
    builder.doc.text(`N° CEC: ${data.numero_cec || 'N/A'}`, MARGIN + 140, builder.cursor + 6);
    builder.cursor += 15;

    builder.addSectionTitle('Informations Patient');
    builder.addKeyValueTable([
        [{ label: 'Matricule', value: formatValue(data.matricule) }],
        [{ label: 'CH', value: formatValue(data.ch) }],
        [{ label: 'Date de Naissance', value: formatDate(data.date_naissance) }],
        [{ label: 'Âge', value: formatValue(data.age, 'ans') }],
        [{ label: 'Sexe', value: formatValue(data.sexe) }],
        [{ label: 'Poids', value: formatValue(data.poids, 'kg') }],
        [{ label: 'Taille', value: formatValue(data.taille, 'cm') }],
        [{ label: 'S. Corporelle', value: formatValue(data.surface_corporelle, 'm²') }],
        [{ label: 'Débit Théorique', value: formatValue(data.debit_theorique, 'L/min') }],
    ]);
    builder.addText(data.diagnostic || '', 'Diagnostic');
    builder.addText(data.intervention || '', 'Intervention');
    
    builder.addSectionTitle('Équipe Médicale');
    builder.addKeyValueTable([
        [{ label: 'Opérateur', value: formatValue(data.operateur) }],
        [{ label: 'Aide Op.', value: formatValue(data.aide_op) }],
        [{ label: 'Instrumentiste', value: formatValue(data.instrumentiste) }],
        [{ label: 'Perfusionniste', value: formatValue(data.perfusionniste) }],
        [{ label: 'Anesthésiste', value: formatValue(data.anesthesiste) }],
        [{ label: 'Technicien Anesthésie', value: formatValue(data.technicien_anesthesie) }],
    ]);

    builder.addSectionTitle('Données Préopératoires');
    builder.addKeyValueTable([
        [{ label: 'GS', value: formatValue(data.gs) }],
        [{ label: 'Hte', value: formatValue(data.hte, '%') }],
        [{ label: 'Hb', value: formatValue(data.hb, 'g/dL') }],
        [{ label: 'Na+', value: formatValue(data.na, 'mEq/L') }],
        [{ label: 'K+', value: formatValue(data.k, 'mEq/L') }],
        [{ label: 'Créat', value: formatValue(data.creat, 'mg/dL') }],
        [{ label: 'Protides', value: formatValue(data.protides, 'g/L') }],
    ]);
    
    builder.addSectionTitle('Examens Complémentaires');
    builder.addText(data.echo_coeur || '', 'Echo Coeur');
    builder.addText(data.coro || '', 'Coronographie');

    builder.addSectionTitle('Matériel CEC');
    builder.addKeyValueTable([
        [{ label: 'Oxygénateur', value: formatValue(data.oxygenateur) }],
        [{ label: 'Circuit', value: formatValue(data.circuit) }],
        [{ label: 'Canule Artérielle', value: formatValue(data.canule_art) }],
        [{ label: 'Canule Veineuse', value: formatValue(data.canule_vein) }],
        [{ label: 'Canule Cardioplégie', value: formatValue(data.canule_cardio) }],
        [{ label: 'Canule Décharge', value: formatValue(data.canule_decharge) }],
        [{ label: 'Kit Hémofiltration', value: formatValue(data.kit_hemo) }],
    ]);
    
    builder.addSectionTitle('Anticoagulation et Drogues');
     builder.addKeyValueTable([
        [{ label: 'Héparine Circuit', value: formatValue(data.heparine_circuit, 'UI') }],
        [{ label: 'Héparine Malade', value: formatValue(data.heparine_malade, 'UI') }],
        [{ label: 'Héparine Total', value: formatValue(data.heparine_total, 'UI') }],
    ]);
    
    if (data.autres_drogues && data.autres_drogues.length > 0) {
        builder.addTable(
            [["Nom", "Dose", "Unité", "Heure"]],
            data.autres_drogues.map(d => [d.nom, d.dose, d.unite, formatTime(d.heure)])
        );
    }

    builder.addSectionTitle('Priming et Remplissage');
    const primingBody = data.priming?.filter(p => p.initial || p.ajout).map(p => [p.solute, p.initial || '0', p.ajout || '0', (p.initial || 0) + (p.ajout || 0)]) || [];
    if (primingBody.length > 0) {
        builder.addTable(
            [["Soluté", "Initial (ml)", "Ajout (ml)", "Total (ml)"]],
            primingBody
        );
    } else {
        builder.addText("Aucune donnée de priming.");
    }

    builder.addSectionTitle('Déroulement de la CEC');
    const timelineBody = data.timelineEvents?.sort((a,b) => (a.time || "").localeCompare(b.time || "")).map(e => [formatTime(e.time), e.name, e.type]) || [];
    if(timelineBody.length > 0) {
       builder.addTable(
            [["Heure", "Événement", "Type"]],
            timelineBody,
            "Journal des Événements"
        );
    }

    const cardioBody = data.cardioplegiaDoses?.map(d => [formatTime(d.heure), d.dose, d.minCec, d.temp]) || [];
     if(cardioBody.length > 0) {
        builder.addTable(
            [["Heure", "Dose (ml)", "Min CEC", "T°C"]],
            cardioBody,
            `Cardioplégie (${data.type_cardioplegie} ${data.type_cardioplegie === 'autre' ? data.autre_cardioplegie || '' : ''})`
        );
    }
    
    builder.addSectionTitle('Gaz du Sang');
    if (data.bloodGases && data.bloodGases.length > 0 && Object.keys(data.bloodGases[0]).length > 1) {
        const bgHeaders = ['Paramètre', ...(data.bloodGases?.map(bg => bg.time || '') || [])];
        const bgParams = [
            { key: 'act', label: 'ACT (sec)' }, { key: 'temperature', label: 'T° (°C)' },
            { key: 'ht', label: 'Ht (%)' }, { key: 'hb', label: 'Hb (g/dL)' },
            { key: 'pao2', label: 'Pao2 (mmHg)' }, { key: 'paco2', label: 'Paco2 (mmHg)' },
            { key: 'ph', label: 'pH' }, { key: 'sat', label: 'Sat (%)' },
            { key: 'hco3', label: 'HCO3- (mmol/L)' }, { key: 'be', label: 'BE (mmol/L)' },
            { key: 'k', label: 'K+ (mEq/L)' }, { key: 'na', label: 'Na+ (mEq/L)' },
            { key: 'ca', label: 'Ca++ (mEq/L)' }, { key: 'lactate', label: 'Lactate (mmol/L)' },
            { key: 'diurese', label: 'Diurèse (ml)' },
        ];
        const bgBody = bgParams.map(param => {
            const rowData = data.bloodGases?.map(col => formatValue((col as any)[param.key])) || [];
            return [param.label, ...rowData];
        });
        builder.addTable([bgHeaders], bgBody);
    } else {
        builder.addText("Aucune donnée de gaz du sang.");
    }
    
    builder.addSectionTitle('Bilan Entrées/Sorties');
    const entreesData = [
        { label: 'Apports Anesthésiques', value: formatValue(data.entrees_apports_anesthesiques, 'ml')},
        { label: 'Priming', value: formatValue(data.entrees_priming, 'ml')},
        { label: 'Cardioplégie', value: formatValue(data.entrees_cardioplegie, 'ml')},
        { label: 'Total Entrées', value: formatValue(data.total_entrees, 'ml')},
    ];
    const sortiesData = [
        { label: 'Diurèse', value: formatValue(data.sorties_diurese, 'ml') },
        { label: 'Hémofiltration', value: formatValue(data.sorties_hemofiltration, 'ml') },
        { label: 'Aspiration Perdue', value: formatValue(data.sorties_aspiration_perdue, 'ml') },
        { label: 'Sang Pompe Résiduel', value: formatValue(data.sorties_sang_pompe_residuel, 'ml') },
        { label: 'Total Sorties', value: formatValue(data.total_sorties, 'ml') },
    ];

    const balanceBody = [];
    const maxRows = Math.max(entreesData.length, sortiesData.length);
    for (let i = 0; i < maxRows; i++) {
        const entree = entreesData[i];
        const sortie = sortiesData[i];
        balanceBody.push([
            entree ? { content: entree.label, styles: { fontStyle: 'bold' } } : '',
            entree ? entree.value : '',
            sortie ? { content: sortie.label, styles: { fontStyle: 'bold' } } : '',
            sortie ? sortie.value : '',
        ]);
    }
    
    autoTable(builder.doc, {
        startY: builder.cursor,
        head: [['Entrées', '', 'Sorties', '']],
        body: balanceBody,
        theme: 'plain',
        tableWidth: CONTENT_WIDTH,
        headStyles: { fontStyle: 'bold', halign: 'center', fontSize: 11, fillColor: [240, 240, 240] },
        columnStyles: {
            0: { cellWidth: 45 },
            1: { cellWidth: 45, halign: 'right' },
            2: { cellWidth: 45 },
            3: { cellWidth: 45, halign: 'right' },
        },
        didDrawPage: (data: any) => {
            builder.cursor = data.cursor.y + 2;
        }
    });
    builder.cursor = (builder.doc as any).lastAutoTable.finalY + 10;
    
    builder.addSectionTitle('Observations');
    builder.addText(data.observations || 'N/A');
    
    return builder.asBlob();
}

