import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
    trend,
    trendValue
}: {
    title: string,
    value: string | number,
    icon: React.ElementType,
    description?: string,
    trend?: 'up' | 'down',
    trendValue?: string
}) => (
    <Card className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-900/50 dark:to-slate-950 border-indigo-100/50 dark:border-indigo-900/50 shadow-sm transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg">
                <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
        </CardHeader>
        <CardContent >
            <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                    <div className={cn(
                        "flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
                        trend === 'up' ? "text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20" : "text-rose-600 bg-rose-50/50 dark:bg-rose-950/20"
                    )}>
                        {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {trendValue}
                    </div>
                )}
            </div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </CardContent>
    </Card>
);
