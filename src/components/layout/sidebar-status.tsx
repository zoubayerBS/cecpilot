"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { FileEdit, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function SidebarStatus({ isExpanded }: { isExpanded: boolean }) {
    const { user } = useAuth();
    const [draft, setDraft] = useState<any>(null);

    useEffect(() => {
        const draftKey = `cec_draft_${user?.username || 'guest'}`;
        const saved = localStorage.getItem(draftKey);
        if (saved) {
            try {
                setDraft(JSON.parse(saved));
            } catch (e) {
                setDraft(null);
            }
        }

        // Optional: listen for storage changes to update live (cross-tab)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === draftKey && e.newValue) {
                setDraft(JSON.parse(e.newValue));
            }
        };

        // Listen for same-tab updates
        const handleCustomUpdate = (e: any) => {
            if (e.detail === null) {
                setDraft(null);
            } else {
                setDraft(e.detail);
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('cec-draft-updated', handleCustomUpdate);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('cec-draft-updated', handleCustomUpdate);
        };
    }, [user?.username]);

    if (!draft || !draft.nom_prenom) return null;

    return (
        <div className={cn("px-4 py-2 transition-all duration-500", !isExpanded && "opacity-0 h-0 overflow-hidden")}>
            <Link href="/nouveau-compte-rendu">
                <Card className="bg-primary/5 border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer group">
                    <CardContent className="p-3 flex items-center gap-3">
                        <div className="relative">
                            <FileEdit className="h-4 w-4 text-primary" />
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">En cours</span>
                            <span className="text-xs font-semibold truncate text-foreground/80">{draft.nom_prenom}</span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
    );
}
