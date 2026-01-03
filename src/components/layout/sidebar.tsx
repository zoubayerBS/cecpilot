'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { HeartPulse, Gauge, List, BrainCircuit, LogOut, User, ChevronLeft, Settings, Activity, Shield } from "lucide-react"
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "../theme-toggle";
import { useState } from "react";
import { SidebarStatus } from "./sidebar-status";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    hasStatus?: boolean;
    shortcut?: string;
  }

  interface NavGroup {
    title: string;
    links: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      title: "Menu Principal",
      links: [
        { name: 'Tableau de bord', href: '/', icon: Gauge },
        { name: 'Nouveau C.R.', href: '/nouveau-compte-rendu', icon: HeartPulse },
      ]
    },
    {
      title: "Intelligence IA",
      links: [
        { name: 'Assistant IA', href: '/fonctionnalites-ia', icon: BrainCircuit, hasStatus: true, shortcut: "⌘+K" },
      ]
    },
    {
      title: "Configuration",
      links: [
        { name: 'Mon Profil', href: '/settings/profile', icon: User },
        { name: 'Utilitaires', href: '/utilitaires', icon: Settings, shortcut: "⌘+U" },
        { name: 'Sécurité', href: '/settings/security', icon: Shield, shortcut: "⌘+S" },
      ]
    }
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col z-40 transition-all duration-500 ease-in-out relative",
        // Floating Island Base Styles
        "m-4 h-[calc(100vh-32px)] rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-3xl bg-white/80 dark:bg-slate-950/80",
        isExpanded ? "w-64" : "w-20"
      )}
    >
      {/* Decorative Gradient Blob (Optional subtle glow behind) */}
      <div className="absolute -z-10 top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent rounded-t-3xl opacity-50 pointer-events-none" />

      {/* --- HEADER --- */}
      <div className="p-6 flex items-center justify-center relative">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Activity className="h-8 w-8 text-primary relative z-10 transition-transform duration-300 group-hover:scale-110" />
          </div>

          <span className={cn(
            "font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 whitespace-nowrap overflow-hidden transition-all duration-500",
            isExpanded ? "max-w-xs opacity-100 ml-1" : "max-w-0 opacity-0"
          )}>
            CECPilot
          </span>
        </Link>

        {/* Toggle Button - Floating on the border */}
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border-white/20 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-110 transition-all z-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", !isExpanded && "rotate-180")} />
        </Button>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            {isExpanded && (
              <h3 className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 animate-in fade-in slide-in-from-left-2 duration-500">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.links.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 ease-out",
                      isActive
                        ? 'bg-primary/10 text-primary shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200',
                      !isExpanded && "justify-center px-0 py-3"
                    )}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                    )}

                    {/* Icon */}
                    <div className={cn(
                      "relative z-10 p-1 rounded-lg transition-all duration-300",
                      isActive ? "bg-white/50 dark:bg-slate-900/50 shadow-sm" : "group-hover:scale-110"
                    )}>
                      <item.icon className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary fill-primary/20" : "text-slate-500 dark:text-slate-400"
                      )} />

                      {/* Status Dot */}
                      {item.hasStatus && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-slate-950"></span>
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    <span className={cn(
                      "text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300 origin-left",
                      isExpanded ? "max-w-xs opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-4"
                    )}>
                      {item.name}
                    </span>

                    {/* Shortcut Hint */}
                    {isExpanded && item.shortcut && (
                      <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-white/50 dark:bg-slate-900/50 px-1.5 font-mono text-[9px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-all lg:flex translate-x-2 group-hover:translate-x-0">
                        {item.shortcut}
                      </kbd>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <SidebarStatus isExpanded={isExpanded} />

      {/* --- FOOTER / PROFILE --- */}
      <div className="p-4 mt-auto">
        <div className={cn(
          "rounded-2xl transition-all duration-300 border border-white/40 dark:border-slate-800 shadow-lg backdrop-blur-md overflow-hidden",
          isExpanded ? "bg-gradient-to-br from-white/60 to-slate-50/60 dark:from-slate-900/60 dark:to-slate-950/60 p-3" : "bg-transparent border-0 shadow-none p-0"
        )}>
          <div className={cn("flex items-center gap-3", !isExpanded && "justify-center flex-col gap-4")}>
            {/* Avatar */}
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-indigo-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative h-10 w-10 rounded-xl bg-white dark:bg-slate-950 p-[2px] overflow-hidden">
                <div className="h-full w-full rounded-[10px] bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className={cn(
              "flex flex-col overflow-hidden transition-all duration-300",
              isExpanded ? "w-full opacity-100" : "w-0 opacity-0"
            )}>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{user?.username}</span>
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Perfusionniste</span>
            </div>

            {/* Actions (Horizontal in expanded, hidden or different in collapsed? Let's hide logout text when collapsed but keep buttons) */}
          </div>

          {/* Expanded Footer Actions */}
          {isExpanded && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
              <ThemeToggle />
              <Button onClick={logout} variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500 hover:text-red-500 transition-colors">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Collapsed Footer Actions (Show if collapsed) */}
        {!isExpanded && (
          <div className="flex flex-col gap-3 items-center mt-4">
            <ThemeToggle />
            <Button onClick={logout} variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Copyright Notice */}
        <div className={cn(
          "mt-4 text-center transition-all duration-300",
          isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
        )}>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-tight">
            © {new Date().getFullYear()} Zoubaier BEN SAID
          </p>
        </div>
      </div>
    </aside>
  );
}