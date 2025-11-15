'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { HeartPulse, List, BrainCircuit, LogOut, User, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "../theme-toggle";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  const navLinks = [
      { name: 'Tableau de bord', href: '/', icon: List },
      { name: 'Nouveau C.R.', href: '/nouveau-compte-rendu', icon: HeartPulse },
      { name: 'Fonctionnalités IA', href: '/fonctionnalites-ia', icon: BrainCircuit },
      { name: 'Utilitaires', href: '/utilitaires', icon: List },
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out relative",
        isExpanded ? "w-64" : "w-20"
      )}
    >
        <div className="p-6 flex items-center justify-center text-lg font-semibold relative">
            <Link href="/" className="flex items-center gap-2">
                <HeartPulse className="h-8 w-8 text-primary animate-heartbeat flex-shrink-0" />
                <span className={cn("font-bold whitespace-nowrap overflow-hidden transition-all duration-300", isExpanded ? "max-w-xs opacity-100" : "max-w-0 opacity-0")}>
                    CEC Pilot
                </span>
            </Link>
            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-5 top-8 bg-sidebar border border-sidebar-border hover:bg-sidebar-accent rounded-full"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <ChevronLeft className={cn("h-5 w-5 transition-transform", !isExpanded && "rotate-180")} />
            </Button>
        </div>
      <nav className="flex-1 px-2 py-2 space-y-2">
        {navLinks.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "rounded-md p-3 text-sm font-medium flex items-center gap-3 transition-colors",
              pathname === item.href
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground',
              !isExpanded && "justify-center"
            )}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className={cn("whitespace-nowrap overflow-hidden transition-all duration-300", isExpanded ? "max-w-xs opacity-100" : "max-w-0 opacity-0")}>
              {item.name}
            </span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border/50 space-y-2">
        <div className={cn("flex items-center gap-3 text-sm text-sidebar-foreground/80 p-2", !isExpanded && "justify-center")}>
            <User className="h-6 w-6 rounded-full bg-sidebar-accent p-1 flex-shrink-0" />
            <div className={cn("flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300", isExpanded ? "max-w-xs opacity-100" : "max-w-0 opacity-0")}>
                <span className="font-semibold">{user?.username}</span>
            </div>
        </div>
        <div className={cn("flex items-center", isExpanded ? "justify-between" : "flex-col gap-2")}>
            <Button onClick={logout} variant="ghost" size="sm" className={cn("flex items-center gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white", isExpanded ? "w-full justify-start" : "w-auto justify-center")}>
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span className={cn("whitespace-nowrap overflow-hidden transition-all duration-300", isExpanded ? "max-w-xs opacity-100" : "max-w-0 opacity-0")}>
                  Déconnexion
                </span>
            </Button>
            <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}