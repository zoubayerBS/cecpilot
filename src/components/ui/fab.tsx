import Link from "next/link";
import { cn } from "@/lib/utils";

export function Fab({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "fixed bottom-8 right-8 bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-20"
      )}
    >
      {children}
    </Link>
  );
}
