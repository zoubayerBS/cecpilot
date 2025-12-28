import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    gradient?: string;
    children?: React.ReactNode;
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    gradient = "from-primary/10 via-primary/5 to-background",
    children,
}: PageHeaderProps) {
    return (
        <div className={cn(
            "bg-gradient-to-r border-b shadow-sm -mt-4",
            gradient
        )}>
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {Icon && (
                            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                                <Icon className="h-6 w-6 text-primary" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                {title}
                            </h1>
                            {description && (
                                <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
