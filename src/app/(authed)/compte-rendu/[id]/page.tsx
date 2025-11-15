
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { CECForm } from '@/components/cec-form';
import { getCecFormById, type CecReport } from '@/services/cec';

export default function ReportPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { id } = params;

  const [report, setReport] = useState<CecReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = searchParams.get('mode') === 'edit';

  useEffect(() => {
    if (typeof id !== 'string') {
        setError("L'identifiant du compte rendu est invalide.");
        setLoading(false);
        return;
    }

    async function fetchReport() {
      try {
        const fetchedReport = await getCecFormById(id);
        if (fetchedReport) {
          setReport(fetchedReport);
        } else {
          setError("Compte rendu non trouvé.");
        }
      } catch (err) {
        console.error("Failed to fetch report:", err);
        setError("Erreur lors du chargement du compte rendu.");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [id]);

  const pageHeader = (
     <header className="bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {isEditMode ? 'Modifier le Compte Rendu' : 'Détails du Compte Rendu'}
            </h1>
        </div>
    </header>
  )

  if (loading) {
    return (
      <>
        {pageHeader}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-4">Chargement du compte rendu...</span>
            </div>
        </main>
      </>
    );
  }

  if (error) {
     return (
       <>
        {pageHeader}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="text-center text-destructive">
                <h2 className="text-xl font-bold">Erreur</h2>
                <p>{error}</p>
                 <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">
                    Retour à l'accueil
                </button>
            </div>
        </main>
      </>
    );
  }

  return (
    <>
      {pageHeader}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <CECForm 
          initialData={report as any} 
          isReadOnly={!isEditMode}
          onFormSave={(savedId) => router.push(`/`)} 
        />
      </main>
    </>
  );
}
