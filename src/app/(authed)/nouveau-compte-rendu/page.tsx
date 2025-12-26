'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CECForm } from '@/components/cec-form';
import { Brain } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

import { ClinicalAssistantFloating } from '@/components/tools/clinical-assistant-floating';

export default function NewReportPage() {
  const router = useRouter();
  const [aiRisk, setAiRisk] = useState<number | null>(null);

  return (
    <main className="relative min-h-screen">
      <header className="bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Nouveau Compte Rendu</h1>
            {aiRisk !== null && (
              <Badge variant={aiRisk > 0.5 ? "destructive" : "secondary"} className="gap-1 animate-in fade-in zoom-in">
                <Brain className="h-3 w-3" />
                IA: {(aiRisk * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-24">
        <CECForm onFormSave={(id) => router.push(`/`)} onRiskUpdate={setAiRisk} />
      </div>

      {/* Floating Messenger-style AI Assistant */}
      <ClinicalAssistantFloating />
    </main>
  );
}
