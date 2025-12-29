"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Loader2, Printer, Share2, Save, RotateCcw, TestTube } from "lucide-react";

interface CecFormFooterProps {
    activeStep: number;
    totalSteps: number;
    isReadOnly: boolean;
    isSubmitting: boolean;
    isPrinting: boolean;
    isSharing: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onGeneratePdf: () => void;
    onShare: () => void;
    onFillTestData: () => void;
    onClear: () => void;
}

export function CecFormFooter({
    activeStep,
    totalSteps,
    isReadOnly,
    isSubmitting,
    isPrinting,
    isSharing,
    onPrevious,
    onNext,
    onGeneratePdf,
    onShare,
    onFillTestData,
    onClear
}: CecFormFooterProps) {
    return (
        <footer className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <Button
                    type="button"
                    variant="outline"
                    disabled={activeStep === 0}
                    onClick={onPrevious}
                    className="rounded-xl"
                >
                    Précédent
                </Button>
                {!isReadOnly && (
                    <>
                        <Button type="button" variant="ghost" onClick={onFillTestData} className="hidden xl:flex">
                            <TestTube className="mr-2 h-4 w-4" /> Test
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors hidden sm:flex"
                            onClick={onClear}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Vider
                        </Button>
                    </>
                )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
                <div className="flex items-center gap-1 sm:gap-2 mr-2">
                    <Button type="button" variant="secondary" size="icon" onClick={onGeneratePdf} disabled={isPrinting} className="rounded-xl sm:w-auto sm:px-4">
                        {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 sm:mr-2" />}
                        <span className="hidden sm:inline">PDF</span>
                    </Button>
                    <Button type="button" variant="secondary" size="icon" onClick={onShare} disabled={isSharing} className="rounded-xl sm:w-auto sm:px-4">
                        {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4 sm:mr-2" />}
                        <span className="hidden sm:inline">Partager</span>
                    </Button>
                </div>

                {activeStep < totalSteps - 1 ? (
                    <Button
                        type="button"
                        onClick={onNext}
                        className="rounded-xl px-8 shadow-lg shadow-primary/20"
                    >
                        Suivant
                    </Button>
                ) : (
                    !isReadOnly && (
                        <Button type="submit" disabled={isSubmitting} className="rounded-xl px-8 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Finaliser
                        </Button>
                    )
                )}
            </div>
        </footer>
    );
}
