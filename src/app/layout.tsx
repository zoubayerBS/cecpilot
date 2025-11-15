import type {Metadata} from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { AuthProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: 'CEC Pilot',
  description: 'Feuille de surveillance clinique et biologique du patient sous CEC',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
      </head>
      <body className="h-full font-body antialiased bg-background">
          <Providers>
            <AuthProvider>
              {children}
            </AuthProvider>
          </Providers>
      </body>
    </html>
  );
}
