
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HeartPulse, Loader2, Info, KeyRound, Database, ShieldCheck, Terminal } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { login } = useAuth();
  const router = useRouter();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLogs([]); // Reset logs on new attempt

    try {
      await login(username, password, addLog);
      addLog('✅ Connexion réussie. Redirection...');
      router.replace('/');
    } catch (err: any) {
      addLog(`❌ Erreur: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
       <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
            <CardHeader className="text-center">
                <HeartPulse className="mx-auto h-12 w-12 text-primary animate-pulse" />
            <CardTitle className="text-2xl mt-4">CEC Pilot</CardTitle>
            <CardDescription>Veuillez vous connecter pour continuer</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Utilisateur de la base de données"
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                />
                </div>
                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Erreur de connexion</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connexion
                </Button>
            </form>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Terminal />
                    Console de Connexion
                </CardTitle>
                 <CardDescription>Suivez les étapes de la connexion en temps réel.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="bg-muted h-64 max-h-64 overflow-y-auto rounded-md p-3 font-mono text-xs text-muted-foreground space-y-2">
                    {logs.length === 0 && <p>En attente de la tentative de connexion...</p>}
                    {logs.map((log, index) => (
                        <p key={index} className="whitespace-pre-wrap break-words">{log}</p>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
