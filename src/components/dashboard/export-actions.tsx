"use client";

import { Button } from "@/components/ui/button";
import { Download, FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { CecReport } from "@/services/cec";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function DashboardExport({ reports, stats }: { reports: CecReport[], stats: any }) {
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    const exportToCSV = () => {
        try {
            if (reports.length === 0) return;

            const headers = ["Date", "Patient", "Matricule", "Intervention", "Operateur", "Duree CEC", "Duree Clampage"];
            const rows = reports.map(r => [
                r.date_cec || "",
                r.nom_prenom || "",
                r.matricule || "",
                r.intervention || "",
                r.operateur || "",
                r.duree_cec || "",
                r.duree_clampage || ""
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `export-cec-${format(new Date(), 'yyyy-MM-dd')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Export CSV réussi",
                description: `${reports.length} rapports exportés.`,
            });
        } catch (error) {
            toast({
                title: "Erreur d'export",
                description: "Une erreur est survenue lors de l'export CSV.",
                variant: "destructive"
            });
        }
    };

    const generatePDF = async () => {
        setIsExporting(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(79, 70, 229); // Indigo-600
            doc.text("Rapport d'Activité CEC", pageWidth / 2, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Généré le ${format(new Date(), 'PPP', { locale: fr })}`, pageWidth / 2, 28, { align: 'center' });

            // Stats Section
            doc.setDrawColor(230);
            doc.line(20, 35, pageWidth - 20, 35);

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Résumé des Statistiques", 20, 45);

            autoTable(doc, {
                startY: 50,
                head: [['Indicateur', 'Valeur']],
                body: [
                    ['Total des Interventions', stats.totalReports.toString()],
                    ['Interventions ce Mois-ci', stats.reportsThisMonth.toString()],
                    ['Durée Moyenne de CEC', `${stats.averageDuration} min`],
                ],
                theme: 'striped',
                headStyles: { fillStyle: 'fill', fillColor: [79, 70, 229] }
            });

            // Table of Interventions
            doc.text("Liste des Interventions", 20, (doc as any).lastAutoTable.finalY + 15);

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 20,
                head: [['Date', 'Patient', 'Intervention', 'Chirurgien', 'Durée']],
                body: reports.map(r => [
                    r.date_cec || "",
                    r.nom_prenom || "",
                    r.intervention || "",
                    r.operateur || "",
                    `${r.duree_cec || 0} min`
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [51, 65, 85] } // Slate-700
            });

            doc.save(`rapport-activite-cec-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

            toast({
                title: "Rapport PDF prêt",
                description: "Le téléchargement a commencé.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Erreur PDF",
                description: "Impossible de générer le rapport PDF.",
                variant: "destructive"
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="text-xs h-8 flex items-center gap-2 border-dashed"
            >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                Export CSV
            </Button>
            <Button
                variant="default"
                size="sm"
                onClick={generatePDF}
                disabled={isExporting}
                className="text-xs h-8 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
                {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <FileDown className="h-3.5 w-3.5" />
                )}
                Générer Rapport PDF
            </Button>
        </div>
    );
}
