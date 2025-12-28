'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CECForm } from '@/components/cec-form';
import { Brain, FileEdit } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { PageHeader } from '@/components/ui/page-header';

import { ClinicalAssistantFloating } from '@/components/tools/clinical-assistant-floating';

export default function NewReportPage() {
  const router = useRouter();
  const [aiRisk, setAiRisk] = useState<number | null>(null);

  return (
    <main className="relative min-h-screen">
      <PageHeader
        title="Nouveau Compte Rendu"
        description="Créez un nouveau compte rendu de circulation extracorporelle"
        icon={FileEdit}
        gradient="from-emerald-50 via-teal-50/50 to-background dark:from-slate-900 dark:via-slate-900/50 dark:to-background"
      >
        {aiRisk !== null && (
          <Badge variant={aiRisk > 0.5 ? "destructive" : "secondary"} className="gap-1 animate-in fade-in zoom-in">
            <Brain className="h-3 w-3" />
            IA: {(aiRisk * 100).toFixed(0)}%
          </Badge>
        )}
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-24">
        <CECForm onFormSave={(id) => router.push(`/`)} onRiskUpdate={setAiRisk} />
      </div>

      {/* Floating Messenger-style AI Assistant */}
      <ClinicalAssistantFloating />
    </main>
  );
}
