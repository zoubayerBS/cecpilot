
'use client';

import { useEffect, useState, useMemo } from 'react';
import { PlusCircle, FileText, Eye, Pencil, Stethoscope, Search, Calendar as CalendarIcon, X, Trash2, Activity, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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


export default function Home() {
  const [reports, setReports] = useState<CecReport[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reportToDelete, setReportToDelete] = useState<CecReport | null>(null);
  const router = useRouter();
  const { toast } = useToast();

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
          } catch(e) {
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

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Tableau de bord (PostgreSQL)</h1>
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
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total des Interventions" value={stats.totalReports} icon={FileText} description="Nombre total de comptes rendus enregistrés." />
            <StatCard title="Interventions ce Mois-ci" value={stats.reportsThisMonth} icon={CalendarIcon} description={`Pour ${format(new Date(), 'MMMM yyyy', {locale: fr})}`} />
            <StatCard title="Durée Moyenne de CEC" value={`${stats.averageDuration} min`} icon={Clock} description="Basée sur les événements 'Départ' et 'Fin'." />
        </div>

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
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={{ before: startDate }} initialFocus />
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
          <CardHeader>
            <CardTitle>Comptes Rendus Récents</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Patient</TableHead>
                    <TableHead>Date de la CEC</TableHead>
                    <TableHead>Intervention</TableHead>
                    <TableHead>Opérateur</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/50" onClick={() => router.push(`/compte-rendu/${report.id}`)} style={{cursor: 'pointer'}}>
                      <TableCell className="font-medium">{report.nom_prenom}</TableCell>
                      <TableCell>
                        {report.date_cec ? format(new Date(report.date_cec), "PPP", { locale: fr }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{report.intervention || 'Non spécifiée'}</TableCell>
                      <TableCell>{report.operateur || 'Non spécifié'}</TableCell>
                      <TableCell className="text-right">
                         <Button asChild variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); router.push(`/compte-rendu/${report.id}`)}}>
                            <Link href={`/compte-rendu/${report.id}`} title="Voir">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Voir</span>
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); router.push(`/compte-rendu/${report.id}?mode=edit`)}}>
                            <Link href={`/compte-rendu/${report.id}?mode=edit`} title="Modifier">
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Modifier</span>
                            </Link>
                        </Button>
                         <Button variant="ghost" size="icon" title="Supprimer" onClick={(e) => {e.stopPropagation(); setReportToDelete(report)}}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Supprimer</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                <Stethoscope className="mx-auto h-12 w-12 text-gray-400" />
                 <p className="mt-4 text-lg font-medium">
                  {searchTerm || startDate || endDate ? "Aucun compte rendu ne correspond à vos filtres" : "Aucun compte rendu trouvé."}
                </p>
                <p className="text-sm mt-2">
                   {searchTerm || startDate || endDate ? "Essayez de modifier ou d'effacer vos filtres." : 'Cliquez sur "Nouveau Compte Rendu" pour commencer.'}
                </p>
              </div>
            )}
          </CardContent>
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
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: 'destructive'})}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Fab href="/nouveau-compte-rendu">
        <PlusCircle className="h-8 w-8" />
      </Fab>
    </>
  );
}
