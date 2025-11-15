
"use client";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster />
      </ThemeProvider>
  );
}
