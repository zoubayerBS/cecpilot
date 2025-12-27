
'use client';

import { useEffect, useState, useMemo } from 'react';
import { PlusCircle, FileText, Eye, Pencil, Stethoscope, Search, Calendar as CalendarIcon, X, Trash2, Activity, Clock, Users, BrainCircuit, Droplets, ShieldAlert, Bot } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCecForms, deleteCecForm, type CecReport } from '@/services/cec';
import { format, parseISO, startOfDay, endOfDay, isThisMonth, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { StatCard } from '@/components/ui/stat-card';
import { Fab } from '@/components/ui/fab';
import { DashboardAnalytics } from '@/components/dashboard/analytics';
import { DashboardAiInsights } from '@/components/dashboard/ai-insights';
import { PriorityFiles } from '@/components/dashboard/priority-files';
import { Badge } from '@/components/ui/badge';
import { DashboardExport } from '@/components/dashboard/export-actions';


export default function Home() {
  const [reports, setReports] = useState<CecReport[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reportToDelete, setReportToDelete] = useState<CecReport | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    async function fetchReports() {
      setLoadingData(true);
      try {
        const fetchedReports = await getCecForms();
        setReports(fetchedReports);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données.",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    }
    fetchReports();
  }, [toast]);

  const stats = useMemo(() => {
    const totalReports = reports.length;
    const reportsThisMonth = reports.filter(r => r.date_cec && isThisMonth(parseISO(r.date_cec))).length;

    const validDurations = reports
      .map(r => {
        const startEvent = r.timelineEvents?.find(e => e.type === 'Départ CEC');
        const endEvent = r.timelineEvents?.find(e => e.type === 'Fin CEC');
        if (startEvent?.time && endEvent?.time && r.date_cec) {
          const startTime = parseISO(`${r.date_cec}T${startEvent.time}`);
          const endTime = parseISO(`${r.date_cec}T${endEvent.time}`);
          return differenceInMinutes(endTime, startTime);
        }
        return null;
      })
      .filter((d): d is number => d !== null && d > 0);

    const averageDuration = validDurations.length > 0
      ? Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length)
      : 0;

    return {
      totalReports,
      reportsThisMonth,
      averageDuration,
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const lowercasedTerm = searchTerm.toLowerCase();
      const searchMatch =
        (report.nom_prenom?.toLowerCase().includes(lowercasedTerm)) ||
        (report.matricule?.toLowerCase().includes(lowercasedTerm)) ||
        (report.intervention?.toLowerCase().includes(lowercasedTerm)) ||
        (report.operateur?.toLowerCase().includes(lowercasedTerm));

      let dateMatch = true;
      if (report.date_cec) {
        try {
          const reportDate = parseISO(report.date_cec);
          if (startDate && reportDate < startOfDay(startDate)) {
            dateMatch = false;
          }
          if (endDate && reportDate > endOfDay(endDate)) {
            dateMatch = false;
          }
        } catch (e) {
          // Invalid date in DB, treat as no match
          dateMatch = false;
        }
      } else if (startDate || endDate) {
        // If there's a date filter, but the report has no date, it shouldn't match
        dateMatch = false;
      }

      return searchMatch && dateMatch;
    });
  }, [reports, searchTerm, startDate, endDate]);

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReports.slice(startIndex, endIndex);
  }, [filteredReports, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const getInterventionBadge = (intervention: string | undefined) => {
    if (!intervention) return <Badge variant="outline" className="text-slate-400">Non spécifié</Badge>;

    const text = intervention.toLowerCase();
    if (text.includes('pontage') || text.includes('cabg'))
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none dark:bg-blue-900/40 dark:text-blue-300">Pontage</Badge>;
    if (text.includes('valve') || text.includes('plastie') || text.includes('remplacement'))
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none dark:bg-emerald-900/40 dark:text-emerald-300">Valvulaire</Badge>;
    if (text.includes('bentall') || text.includes('aorte'))
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none dark:bg-amber-900/40 dark:text-amber-300">Aortique</Badge>;
    if (text.includes('cia') || text.includes('civ') || text.includes('fallot'))
      return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-200 border-none dark:bg-violet-900/40 dark:text-violet-300">Congénital</Badge>;
    if (text.includes('ecmo') || text.includes('changement'))
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none dark:bg-rose-900/40 dark:text-rose-300">Technique</Badge>;

    return <Badge variant="secondary" className="border-none">Autre</Badge>;
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;
    try {
      await deleteCecForm(reportToDelete.id);
      // No need to manually update state, onSnapshot will do it.
      toast({
        title: "Suppression réussie",
        description: `Le compte rendu pour ${reportToDelete.nom_prenom} a été supprimé.`,
      });
    } catch (error) {
      toast({
        title: "Erreur de suppression",
        description: "Une erreur est survenue.",
        variant: 'destructive',
      });
    } finally {
      setReportToDelete(null);
    }
  };

  const pageHeader = (
    <div className="bg-card shadow-sm -mt-4">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tableau de bord </h1>
        </div>
      </div>
    </div>
  );


  if (loadingData) {
    return (
      <>
        {pageHeader}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <span className="ml-4 text-lg">Chargement des données...</span>
          </div>
        </main>
      </>
    );
  }


  return (
    <>
      {pageHeader}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ">
          <StatCard
            title="Total des Interventions"
            value={stats.totalReports}
            icon={FileText}
            description="Nombre total de comptes rendus."
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Interventions ce Mois-ci"
            value={stats.reportsThisMonth}
            icon={CalendarIcon}
            description={`Pour ${format(new Date(), 'MMMM yyyy', { locale: fr })}`}
            trend="up"
            trendValue="+3"
          />
          <StatCard
            title="Durée Moyenne de CEC"
            value={`${stats.averageDuration} min`}
            icon={Clock}
            description="Basée sur les événements récents."
            trend="down"
            trendValue="-5min"
          />
        </div>

        <div className="grid gap-6">
          {reports.length > 0 && <PriorityFiles reports={reports} />}
          {reports.length > 0 && <DashboardAiInsights reports={reports} />}
          {reports.length > 0 && <DashboardAnalytics reports={reports} />}
        </div>

        {/* AI Features Highlight */}
        <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 border-indigo-100 dark:border-indigo-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="text-xl">Assistant CEC Intelligent</CardTitle>
            </div>
            <CardDescription className="text-base">
              Utilisez notre IA pour prédire les risques, optimiser la perfusion et générer des plans de CEC personnalisés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mt-1"><Droplets className="h-4 w-4 text-blue-600 dark:text-blue-300" /></div>
                <div>
                  <p className="font-semibold text-sm">Hématologie</p>
                  <p className="text-xs text-muted-foreground mt-1">Risque transfusionnel & détection anémie</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mt-1"><Activity className="h-4 w-4 text-green-600 dark:text-green-300" /></div>
                <div>
                  <p className="font-semibold text-sm">Perfusion</p>
                  <p className="text-xs text-muted-foreground mt-1">Calcul DO₂ & optimisation débit</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full mt-1"><ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-300" /></div>
                <div>
                  <p className="font-semibold text-sm">Complications</p>
                  <p className="text-xs text-muted-foreground mt-1">Prédiction hypotension & SIRS</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
              <Link href="/fonctionnalites-ia">
                <Bot className="mr-2 h-4 w-4" />
                Accéder à l'Assistant IA
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filtres de recherche</CardTitle>
            <CardDescription>Recherchez par nom, matricule, intervention ou chirurgien, et filtrez par date.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:w-auto md:flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full md:w-auto justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP', { locale: fr }) : <span>Date de début</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full md:w-auto justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP', { locale: fr }) : <span>Date de fin</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={startDate ? { before: startDate } : undefined} initialFocus />
                </PopoverContent>
              </Popover>
              <Button onClick={clearFilters} variant="ghost">
                <X className="mr-2 h-4 w-4" />
                Effacer les filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Comptes Rendus Récents</CardTitle>
              <CardDescription>Consultez et gérez vos derniers rapports opératoires.</CardDescription>
            </div>
            <DashboardExport reports={filteredReports} stats={stats} />
          </CardHeader>
          <CardContent>
            {paginatedReports.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[200px]">Patient</TableHead>
                      {/* <TableHead>Numéro CEC</TableHead> */}
                      <TableHead>Date de la CEC</TableHead>
                      <TableHead>Intervention</TableHead>
                      <TableHead>Opérateur</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReports.map((report) => (
                      <TableRow key={report.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => router.push(`/compte-rendu/${report.id}`)}>
                        <TableCell className="font-medium">{report.nom_prenom}</TableCell>
                        {/* <TableCell>{report.numero_cec || 'N/A'}</TableCell> */}
                        <TableCell>
                          {report.date_cec ? format(new Date(report.date_cec), "PP", { locale: fr }) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getInterventionBadge(report.intervention)}
                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{report.intervention || 'Non spécifiée'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{report.operateur || 'Non spécifié'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); router.push(`/compte-rendu/${report.id}`) }}>
                              <Link href={`/compte-rendu/${report.id}`} title="Voir">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Voir</span>
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); router.push(`/compte-rendu/${report.id}?mode=edit`) }}>
                              <Link href={`/compte-rendu/${report.id}?mode=edit`} title="Modifier">
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Modifier</span>
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" title="Supprimer" onClick={(e) => { e.stopPropagation(); setReportToDelete(report) }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-lg font-medium">
                  {searchTerm || startDate || endDate ? "Aucun compte rendu ne correspond à vos filtres" : "Aucun compte rendu trouvé."}
                </p>
                <p className="text-sm mt-2 mb-6">
                  {searchTerm || startDate || endDate ? "Essayez de modifier ou d'effacer vos filtres." : 'Cliquez sur le bouton ci-dessous pour commencer.'}
                </p>
                {!(searchTerm || startDate || endDate) && (
                  <Button asChild>
                    <Link href="/nouveau-compte-rendu">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Nouveau Compte Rendu
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
          {filteredReports.length > 0 && (
            <CardFooter>
              <div className="flex justify-between items-center w-full">
                <div className="text-xs text-muted-foreground">
                  <strong>{filteredReports.length}</strong> {filteredReports.length > 1 ? "résultats trouvés." : "résultat trouvé."}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {currentPage} sur {Math.ceil(filteredReports.length / itemsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage * itemsPerPage >= filteredReports.length}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      <AlertDialog open={!!reportToDelete} onOpenChange={() => setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le compte rendu pour <strong>{reportToDelete?.nom_prenom}</strong> sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: 'destructive' })}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Fab href="/nouveau-compte-rendu">
        <PlusCircle className="h-8 w-8" />
      </Fab>
    </>
  );
}
