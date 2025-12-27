"use client";

import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from 'lucide-react';
import { PrimingCategory } from './schema';

interface PrimingChartProps {
    data: {
        category: PrimingCategory;
        value: number;
        label: string;
        color: string;
    }[];
    totalVolume: number;
}

const CATEGORY_LABELS: Record<PrimingCategory, string> = {
    'cristalloide': 'Cristalloïdes',
    'colloide': 'Colloïdes',
    'produit_sanguin': 'Produits Sanguins',
    'autre': 'Autres'
};

export function PrimingChart({ data, totalVolume }: PrimingChartProps) {
    // Transform data for stacked bar chart (single bar)
    const chartData = React.useMemo(() => {
        const entry: any = { name: 'Priming' };
        data.forEach(item => {
            entry[item.category] = item.value;
        });
        return [entry];
    }, [data]);

    if (totalVolume === 0) return null;

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Composition du Priming
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[60px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={chartData} stackOffset="expand">
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" hide />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-popover border rounded-md p-2 text-xs shadow-md">
                                                {payload.map((entry: any) => {
                                                    const category = entry.name as PrimingCategory;
                                                    const value = entry.value;
                                                    // Calculate percentage based on totalVolume passed via props, 
                                                    // or re-calculate here if needed. 
                                                    // Note: stackOffset="expand" makes values 0-1 range for the chart, 
                                                    // but the tooltip payload usually contains the raw value if we construct it right.
                                                    // However, with stackOffset="expand", recharts might normalize the values.
                                                    // Let's check: actually for custom tooltip with stacked bars, it receives the raw values.

                                                    // Wait, stackOffset="expand" changes how bars are rendered but payload usually has raw data?
                                                    // Actually, simplified approach: Don't use "expand", just calculate percentages manually in tooltip.
                                                    // Removing stackOffset="expand" and calculating width manually might be safer but "expand" is good for visual proportion.

                                                    if (value === 0) return null;

                                                    const originalItem = data.find(d => d.category === category);
                                                    if (!originalItem) return null;

                                                    const percentage = ((originalItem.value / totalVolume) * 100).toFixed(0);

                                                    return (
                                                        <div key={category} className="flex items-center gap-2 mb-1 last:mb-0">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: originalItem.color }} />
                                                            <span className="font-semibold">{CATEGORY_LABELS[category]}:</span>
                                                            <span>{percentage}% ({originalItem.value} ml)</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            {data.map((item) => (
                                <Bar
                                    key={item.category}
                                    dataKey={item.category}
                                    stackId="a"
                                    fill={item.color}
                                    radius={[0, 0, 0, 0]}
                                    isAnimationActive={true}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend / Stats */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-muted-foreground">
                    {data.map(item => {
                        if (item.value === 0) return null;
                        const percentage = ((item.value / totalVolume) * 100).toFixed(0);
                        return (
                            <div key={item.category} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span>{CATEGORY_LABELS[item.category]}</span>
                                <span className="font-medium text-foreground">{percentage}%</span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
