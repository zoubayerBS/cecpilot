
'use client';

import { useRouter } from 'next/navigation';
import { CECForm } from '@/components/cec-form';

export default function NewReportPage() {
  const router = useRouter();

  return (
      <main>
        <header className="bg-card shadow-sm">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                 <h1 className="text-2xl font-bold tracking-tight text-foreground">Nouveau Compte Rendu</h1>
            </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <CECForm onFormSave={(id) => router.push(`/`)} />
        </div>
      </main>
  );
}
