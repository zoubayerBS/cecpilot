"use client";

import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { CecFormValues, HemodynamicMeasure } from "./schema";
import { cn } from "@/lib/utils";

type AlertSeverity = 'critical' | 'warning' | 'info';

interface HemodynamicAlert {
    time: string;
    type: string;
    value: number;
    normalRange: string;
    severity: AlertSeverity;
}

const detectAnomalies = (measure: HemodynamicMeasure, isClampingPeriod: boolean = false): HemodynamicAlert[] => {
    const alerts: HemodynamicAlert[] = [];

    if (!measure.time) return alerts;

    // PAM checks - Adjusted for CEC context (lower values are acceptable)
    if (measure.pam !== undefined && measure.pam !== null) {
        if (measure.pam < 40) {
            alerts.push({
                time: measure.time,
                type: 'PAM Très Basse (CEC)',
                value: measure.pam,
                normalRange: '> 40 mmHg (CEC)',
                severity: 'critical'
            });
        } else if (measure.pam < 50) {
            alerts.push({
                time: measure.time,
                type: 'PAM Basse (CEC)',
                value: measure.pam,
                normalRange: '50-90 mmHg (CEC)',
                severity: 'warning'
            });
        } else if (measure.pam > 110) {
            alerts.push({
                time: measure.time,
                type: 'Hypertension Sévère',
                value: measure.pam,
                normalRange: '50-90 mmHg (CEC)',
                severity: 'critical'
            });
        } else if (measure.pam > 90) {
            alerts.push({
                time: measure.time,
                type: 'PAM Élevée',
                value: measure.pam,
                normalRange: '50-90 mmHg (CEC)',
                severity: 'warning'
            });
        }
    }

    // PAS checks
    if (measure.pression_systolique !== undefined && measure.pression_systolique !== null) {
        if (measure.pression_systolique > 180) {
            alerts.push({
                time: measure.time,
                type: 'PAS Très Élevée',
                value: measure.pression_systolique,
                normalRange: '< 180 mmHg',
                severity: 'critical'
            });
        } else if (measure.pression_systolique > 160) {
            alerts.push({
                time: measure.time,
                type: 'PAS Élevée',
                value: measure.pression_systolique,
                normalRange: '< 160 mmHg',
                severity: 'warning'
            });
        }
    }

    // FC checks - More permissive for CEC, skip during clamping (heart stopped)
    if (!isClampingPeriod && measure.fc !== undefined && measure.fc !== null) {
        if (measure.fc < 40) {
            alerts.push({
                time: measure.time,
                type: 'Bradycardie Sévère',
                value: measure.fc,
                normalRange: '> 40 bpm',
                severity: 'critical'
            });
        } else if (measure.fc > 120) {
            alerts.push({
                time: measure.time,
                type: 'Tachycardie',
                value: measure.fc,
                normalRange: '< 120 bpm',
                severity: 'warning'
            });
        }
    }

    // SpO2 checks - Skip during clamping (heart stopped, no circulation)
    if (!isClampingPeriod && measure.spo2 !== undefined && measure.spo2 !== null) {
        if (measure.spo2 < 85) {
            alerts.push({
                time: measure.time,
                type: 'Hypoxie Sévère',
                value: measure.spo2,
                normalRange: '> 90%',
                severity: 'critical'
            });
        } else if (measure.spo2 < 92) {
            alerts.push({
                time: measure.time,
                type: 'SpO2 Basse',
                value: measure.spo2,
                normalRange: '> 92%',
                severity: 'warning'
            });
        }
    }

    return alerts;
};

export function MonitoringAlerts() {
    const { control } = useFormContext<CecFormValues>();
    const data = useWatch({
        control,
        name: "hemodynamicMonitoring",
    });

    const timelineEvents = useWatch({
        control,
        name: "timelineEvents",
    });

    const isInClampingPeriod = (measureTime: string): boolean => {
        if (!Array.isArray(timelineEvents)) return false;

        const clampageEvent = timelineEvents.find((e: any) => e.type === 'Clampage');
        const declampageEvent = timelineEvents.find((e: any) => e.type === 'Déclampage');

        if (!clampageEvent?.time || !declampageEvent?.time) return false;

        return measureTime >= clampageEvent.time && measureTime <= declampageEvent.time;
    };

    const allAlerts = React.useMemo(() => {
        const monitoringData = Array.isArray(data) ? data : [];
        const alerts: HemodynamicAlert[] = [];

        monitoringData.forEach(measure => {
            if (measure) {
                const isClampingPeriod = isInClampingPeriod(measure.time || '');
                alerts.push(...detectAnomalies(measure, isClampingPeriod));
            }
        });

        return alerts.sort((a, b) => {
            if (a.severity === 'critical' && b.severity !== 'critical') return -1;
            if (a.severity !== 'critical' && b.severity === 'critical') return 1;
            return b.time.localeCompare(a.time);
        });
    }, [data, timelineEvents]);

    if (allAlerts.length === 0) {
        return null;
    }

    const criticalCount = allAlerts.filter(a => a.severity === 'critical').length;
    const warningCount = allAlerts.filter(a => a.severity === 'warning').length;

    return (
        <Alert variant={criticalCount > 0 ? "destructive" : "default"} className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
                🚨 Alertes Hémodynamiques
                <div className="flex gap-2 ml-auto">
                    {criticalCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                            {criticalCount} Critique{criticalCount > 1 ? 's' : ''}
                        </Badge>
                    )}
                    {warningCount > 0 && (
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            {warningCount} Attention
                        </Badge>
                    )}
                </div>
            </AlertTitle>
            <AlertDescription>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {allAlerts.map((alert, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex items-start gap-3 p-2 rounded-md border",
                                alert.severity === 'critical' && "bg-red-50 border-red-200",
                                alert.severity === 'warning' && "bg-orange-50 border-orange-200",
                                alert.severity === 'info' && "bg-blue-50 border-blue-200"
                            )}
                        >
                            {alert.severity === 'critical' && <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                            {alert.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />}
                            {alert.severity === 'info' && <Info className="h-4 w-4 text-blue-600 mt-0.5" />}

                            <div className="flex-1 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold">{alert.time}</span>
                                    <Badge variant="outline" className="text-[10px]">{alert.type}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Valeur: <span className="font-bold">{alert.value}</span> • Normal: {alert.normalRange}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </AlertDescription>
        </Alert>
    );
}
