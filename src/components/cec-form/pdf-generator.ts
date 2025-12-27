
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


const FONT_SIZE_NORMAL = 9;
const FONT_SIZE_SMALL = 8;
const FONT_SIZE_TITLE = 22;
const FONT_SIZE_SUBTITLE = 14;
const MARGIN = 15;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Design System Colors
const COLORS = {
    primary: [37, 99, 235], // #2563eb Royal Blue
    secondary: [100, 116, 139], // #64748b Slate
    accent: [241, 245, 249], // #f1f5f9 Slate 50
    text: [15, 23, 42], // #0f172a Slate 900
    white: [255, 255, 255],
    border: [226, 232, 240] // #e2e8f0
};

class DocBuilder {
    doc: jsPDF;
    cursor: number;

    constructor() {
        this.doc = new jsPDF('p', 'mm', 'a4');
        this.cursor = MARGIN;
    }

    private setPrimaryColor() {
        this.doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    }

    private setSecondaryColor() {
        this.doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    }

    private setTextColor() {
        this.doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    }

    checkNewPage(height: number) {
        if (this.cursor + height > PAGE_HEIGHT - MARGIN - 10) { // -10 for footer buffer
            this.doc.addPage();
            this.cursor = MARGIN;
        }
    }

    addHeader(data: CecFormValues) {
        // Top Accent Bar
        this.doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        this.doc.rect(0, 0, PAGE_WIDTH, 6, 'F');

        this.cursor = 25;

        // Title Section
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(FONT_SIZE_TITLE);
        this.setTextColor();
        this.doc.text('Rapport de Circulation', MARGIN, this.cursor);

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(FONT_SIZE_TITLE);
        this.setPrimaryColor();
        this.doc.text('Extra-Corporelle', MARGIN + 85, this.cursor);

        // Date & ID Badge right aligned
        const dateStr = formatDate(data.date_cec);
        this.doc.setFontSize(10);
        this.setSecondaryColor();
        this.doc.text(dateStr, PAGE_WIDTH - MARGIN, this.cursor, { align: 'right' });

        this.cursor += 8;
        this.doc.setFontSize(10);
        this.doc.text(`N° CEC: ${data.numero_cec || 'N/A'}`, PAGE_WIDTH - MARGIN, this.cursor, { align: 'right' });

        // Separator
        this.cursor += 5;
        this.doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
        this.doc.line(MARGIN, this.cursor, PAGE_WIDTH - MARGIN, this.cursor);
        this.cursor += 10;
    }

    addFooter() {
        const pageCount = this.doc.getNumberOfPages();
        this.doc.setFont('helvetica', 'italic');
        this.doc.setFontSize(8);
        this.setSecondaryColor();

        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            const footerText = `Généré par CECPilot - Page ${i} / ${pageCount}`;
            this.doc.text(footerText, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: 'center' });
        }
    }

    addSectionTitle(title: string) {
        this.checkNewPage(15);
        this.cursor += 5;

        // Icon/Box accent
        this.doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        this.doc.rect(MARGIN, this.cursor - 4, 3, 14, 'F'); // Vertical accent bar

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(12);
        this.setPrimaryColor();
        this.doc.text(title.toUpperCase(), MARGIN + 6, this.cursor + 5);

        this.cursor += 12;
    }

    addGrid(items: { label: string, value: string }[], columns: number = 2) {
        if (items.length === 0) return;

        // Transform flat list of items into rows for the table
        const body: any[] = [];
        let currentRow: any[] = [];

        items.forEach((item, index) => {
            // Label cell
            currentRow.push({
                content: item.label,
                styles: { fontStyle: 'bold', textColor: COLORS.secondary, halign: 'left', cellWidth: 40 }
            });
            // Value cell
            currentRow.push({
                content: item.value,
                styles: { fontStyle: 'normal', textColor: COLORS.text, halign: 'left' }
            });

            // If row is full or last item
            if ((index + 1) % columns === 0 || index === items.length - 1) {
                // Determine if we need to pad the last row if it's incomplete (optional but looks better)
                if (currentRow.length < columns * 2) {
                    // Pad with empty cells
                    const missingCells = (columns * 2) - currentRow.length;
                    for (let i = 0; i < missingCells; i++) {
                        currentRow.push("");
                    }
                }
                body.push(currentRow);
                currentRow = [];
            }
        });

        // Use autoTable for the layout
        autoTable(this.doc, {
            body: body,
            startY: this.cursor,
            theme: 'plain', // No borders
            styles: {
                fontSize: FONT_SIZE_NORMAL,
                cellPadding: 1.5,
                overflow: 'linebreak', // Wrap text
                font: 'helvetica'
            },
            columnStyles: {
                // granular column control if needed, but cell styles handle it mostly
            },
            margin: { left: MARGIN, right: MARGIN },
            didDrawPage: (data) => {
                // Update cursor
                this.cursor = data.cursor.y + 5;
            },
        });

        // Update cursor after table
        this.cursor = (this.doc as any).lastAutoTable.finalY + 5;
    }

    addText(text: string, label?: string) {
        if (label) {
            // Use grid for labeled single text to keep alignment consistent
            this.addGrid([{ label, value: text }], 1);
        } else {
            this.doc.setFontSize(FONT_SIZE_NORMAL);
            const textToRender = text || 'N/A';

            const lines = this.doc.splitTextToSize(textToRender, CONTENT_WIDTH);
            const height = lines.length * 5;
            this.checkNewPage(height);

            this.setTextColor();
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(lines, MARGIN, this.cursor);
            this.cursor += height + 5;
        }
    }

    addTable(head: any[], body: any[], title?: string) {
        if (title) {
            this.addSectionTitle(title);
            this.cursor -= 2; // Closer section title
        }

        autoTable(this.doc, {
            head,
            body,
            startY: this.cursor,
            theme: 'grid',
            styles: {
                fontSize: FONT_SIZE_SMALL,
                cellPadding: 3,
                lineColor: COLORS.border as any,
                lineWidth: 0.1,
                font: 'helvetica'
            },
            headStyles: {
                fillColor: COLORS.primary as any,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'left'
            },
            columnStyles: {
                0: { fontStyle: 'bold', textColor: COLORS.primary as any }
            },
            alternateRowStyles: {
                fillColor: COLORS.accent as any
            },
            margin: { left: MARGIN, right: MARGIN },
            didDrawPage: (data) => {
                this.cursor = data.cursor.y + 10;
            }
        });
        this.cursor = (this.doc as any).lastAutoTable.finalY + 10;
    }

    open(filename: string) {
        this.addFooter();
        // User requested to open directly in browser
        // building a blob url is often cleaner than dataurlnewwindow
        const blob = this.doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');

        // Clean up url after a delay to allow load? 
        // Actually for blob urls usually we keep them or revoke later. 
        // letting it stay is fine for this session.
    }

    asBlob(): Blob {
        this.addFooter();
        return this.doc.output('blob');
    }
}

export async function generatePdf(data: CecFormValues) {
    const builder = new DocBuilder();
    builder.addHeader(data);

    renderDocumentContent(builder, data);

    const filename = `${data.nom_prenom?.replace(/ /g, '_') || 'Patient'}_${formatDate(data.date_cec).replace(/\//g, '-')}.pdf`;
    builder.open(filename);
}

export async function generatePdfBlob(data: CecFormValues): Promise<Blob> {
    const builder = new DocBuilder();
    builder.addHeader(data);

    // Simply duplicate logic? Refactor clearly needed but sticking to the plan pattern
    // Ideally extract a render method, but for now I'll call a private internal renderer if I could, 
    // but the previous code duplicated it. 
    // Let's create a shared render function to avoid duplication.

    // We can't easily change the architecture of imports now, so I will copy the logic in a smart way.
    // Actually, I can make generatePdf call an internal render(builder, data).

    renderDocumentContent(builder, data);

    return builder.asBlob();
}

function renderDocumentContent(builder: DocBuilder, data: CecFormValues) {
    // --- Colonne 1 : Patient ---
    builder.addSectionTitle('Informations Patient');
    builder.addGrid([
        { label: 'Patient', value: data.nom_prenom || 'N/A' },
        { label: 'Date Nais.', value: formatDate(data.date_naissance) },
        { label: 'Matricule', value: formatValue(data.matricule) },
        { label: 'Âge', value: formatValue(data.age, 'ans') },
        { label: 'Sexe', value: formatValue(data.sexe) },
        { label: 'Poids', value: formatValue(data.poids, 'kg') },
        { label: 'Taille', value: formatValue(data.taille, 'cm') },
        { label: 'Surface', value: formatValue(data.surface_corporelle, 'm²') },
        { label: 'Débit', value: formatValue(data.debit_theorique, 'L/min') },
        { label: 'Groupe', value: formatValue(data.gs) }
    ], 2);

    // --- Diagnostics ---
    builder.cursor += 5;
    builder.addGrid([
        { label: 'Diagnostic', value: data.diagnostic || 'N/A' }
    ], 1);
    builder.addGrid([
        { label: 'Intervention', value: data.intervention || 'N/A' }
    ], 1);


    // --- Equipe ---
    builder.addSectionTitle('Équipe Activité');
    builder.addGrid([
        { label: 'Opérateur', value: formatValue(data.operateur) },
        { label: 'Perfusionniste', value: formatValue(data.perfusionniste) },
        { label: 'Aide Op.', value: formatValue(data.aide_op) },
        { label: 'Anesthésiste', value: formatValue(data.anesthesiste) },
        { label: 'Instrumentiste', value: formatValue(data.instrumentiste) },
        { label: 'Tech. Anesth.', value: formatValue(data.technicien_anesthesie) },
    ], 2);

    // --- Biologie ---
    builder.addSectionTitle('Biologie Pré-op');
    builder.addGrid([
        { label: 'Hte', value: formatValue(data.hte, '%') },
        { label: 'Hb', value: formatValue(data.hb, 'g/dL') },
        { label: 'Na+', value: formatValue(data.na, 'mEq/L') },
        { label: 'K+', value: formatValue(data.k, 'mEq/L') },
        { label: 'Créat', value: formatValue(data.creat, 'mg/dL') },
        { label: 'Protides', value: formatValue(data.protides, 'g/L') }
    ], 3);

    // --- Materiel & Anticoag ---
    builder.addSectionTitle('Configuration CEC');
    builder.addGrid([
        { label: 'Oxygénateur', value: formatValue(data.oxygenateur) },
        { label: 'Hép. Circuit', value: formatValue(data.heparine_circuit, 'UI') },
        { label: 'Circuit', value: formatValue(data.circuit) },
        { label: 'Hép. Malade', value: formatValue(data.heparine_malade, 'UI') },
        { label: 'Kit Hémo.', value: formatValue(data.kit_hemo) },
        { label: 'Hép. Total', value: formatValue(data.heparine_total, 'UI') },
    ], 2);

    // Cannulation sub-section? Just add to grid
    builder.cursor += 5;
    builder.addGrid([
        { label: 'Canule Art.', value: formatValue(data.canule_art) },
        { label: 'Canule V. 1', value: formatValue(data.canule_vein) },
        { label: 'Cardioplégie', value: formatValue(data.canule_cardio) },
        { label: 'Canule V. 2', value: formatValue(data.canule_vein_2) },
        { label: 'Décharge', value: formatValue(data.canule_decharge) },
    ], 2);


    // --- Priming Table ---
    // If we have priming data
    const primingBody = data.priming?.filter(p => p.initial || p.ajout).map(p => [p.solute, p.initial || '0', p.ajout || '0', formatValue((p.initial || 0) + (p.ajout || 0))]) || [];
    if (primingBody.length > 0) {
        builder.addTable(
            [["Soluté", "Initial (ml)", "Ajout (ml)", "Total (ml)"]],
            primingBody,
            "Priming & Remplissage"
        );
    }

    // --- Timeline ---
    const timelineBody = data.timelineEvents?.sort((a, b) => (a.time || "").localeCompare(b.time || "")).map(e => [formatTime(e.time), e.name, e.type]) || [];
    if (timelineBody.length > 0) {
        builder.addTable(
            [["Heure", "Événement", "Type"]],
            timelineBody,
            "Chronologie"
        );
    }

    // --- Cardioplegia ---
    const cardioBody = data.cardioplegiaDoses?.map(d => [formatTime(d.heure), d.dose, d.minCec, d.temp]) || [];
    if (cardioBody.length > 0) {
        builder.addTable(
            [["Heure", "Dose (ml)", "Min CEC", "T°C"]],
            cardioBody,
            `Cardioplégie (${data.type_cardioplegie === 'autre' ? data.autre_cardioplegie || 'Autre' : data.type_cardioplegie})`
        );
    }

    // --- Gaz du Sang ---
    if (data.bloodGases && data.bloodGases.length > 0 && Object.keys(data.bloodGases[0]).length > 1) {
        // Transpose data for table
        const bgHeaders = ['Paramètre', ...(data.bloodGases?.map(bg => bg.time || '') || [])];
        const bgParams = [
            { key: 'ph', label: 'pH' }, { key: 'pao2', label: 'PaO2' }, { key: 'paco2', label: 'PaCO2' }, { key: 'sat', label: 'Sat%' },
            { key: 'hb', label: 'Hb' }, { key: 'ht', label: 'Ht' }, { key: 'act', label: 'ACT' },
            { key: 'k', label: 'K+' }, { key: 'na', label: 'Na+' }, { key: 'ca', label: 'Ca++' }, { key: 'lactate', label: 'Lac' },
            { key: 'temperature', label: 'T°C' }
        ];

        const bgBody = bgParams.map(param => {
            const rowData = data.bloodGases?.map(col => formatValue((col as any)[param.key])) || [];
            return [param.label, ...rowData];
        });

        builder.addTable([bgHeaders], bgBody, 'Gaz du Sang');
    }

    // --- Bilan ---
    // Custom formatted table for Bilan
    const totalEntrees = data.total_entrees || 0;
    const totalSorties = data.total_sorties || 0;
    const balance = totalEntrees - totalSorties;

    const bilans = [
        ['Apports Anesth.', formatValue(data.entrees_apports_anesthesiques, 'ml'), { content: 'Diurèse', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, formatValue(data.sorties_diurese, 'ml')],
        ['Priming', formatValue(data.entrees_priming, 'ml'), { content: 'Hémofiltration', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, formatValue(data.sorties_hemofiltration, 'ml')],
        ['Cardioplégie', formatValue(data.entrees_cardioplegie, 'ml'), { content: 'Aspiration', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, formatValue(data.sorties_aspiration_perdue, 'ml')],
        ['', '', { content: 'Sang Pompe', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, formatValue(data.sorties_sang_pompe_residuel, 'ml')],
        [{ content: 'Total Entrées', styles: { fontStyle: 'bold', textColor: COLORS.primary } },
        { content: formatValue(totalEntrees, 'ml'), styles: { fontStyle: 'bold' } },
        { content: 'Total Sorties', styles: { fontStyle: 'bold', textColor: COLORS.primary } },
        { content: formatValue(totalSorties, 'ml'), styles: { fontStyle: 'bold' } }]
    ];

    builder.addTable(
        [['Entrées', '', 'Sorties', '']],
        bilans,
        `Bilan (Balance: ${balance > 0 ? '+' : ''}${balance} ml)`
    );

    // --- Observations ---
    builder.addSectionTitle('Observations');
    builder.addGrid(
        [
            { label: 'Observations: ', value: formatValue(data.observations || 'Aucune observation particulière.') },
        ]
    );
}

