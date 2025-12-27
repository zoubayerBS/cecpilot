'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HeartPulse, Loader2, User, Lock, Activity, Shield, Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function PasswordStrengthMeter({ password }: { password: string }) {
  const getStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getStrength();
  const percentage = (strength / 5) * 100;

  const getColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getLabel = () => {
    if (strength <= 2) return 'Faible';
    if (strength <= 3) return 'Moyen';
    return 'Fort';
  };

  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        Force du mot de passe: <span className="font-bold">{getLabel()}</span>
      </p>
    </div>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      router.replace('/');
    } catch (err: any) {
      setError(err.message);
      // Shake animation trigger
      const form = e.currentTarget as HTMLFormElement;
      form.classList.add('animate-shake');
      setTimeout(() => form.classList.remove('animate-shake'), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary animate-gradient-slow">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full animate-pulse" />
            <HeartPulse className="h-32 w-32 relative z-10 animate-heartbeat drop-shadow-2xl" />
          </div>

          <h1 className="text-5xl font-black mb-4 text-center tracking-tight">
            CEC Pilot
          </h1>
          <p className="text-xl text-white/90 mb-12 text-center max-w-md font-light">
            Votre Co-Pilote Clinique Intelligent
          </p>

          <div className="grid grid-cols-3 gap-8 w-full max-w-2xl">
            <div className="text-center space-y-2 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Activity className="h-8 w-8 mx-auto mb-2" />
              <p className="text-3xl font-black">2,847</p>
              <p className="text-sm text-white/80">Interventions</p>
            </div>
            <div className="text-center space-y-2 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Shield className="h-8 w-8 mx-auto mb-2" />
              <p className="text-3xl font-black">100%</p>
              <p className="text-sm text-white/80">Sécurisé</p>
            </div>
            <div className="text-center space-y-2 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Zap className="h-8 w-8 mx-auto mb-2" />
              <p className="text-3xl font-black">24/7</p>
              <p className="text-sm text-white/80">Disponible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <Card className="w-full max-w-md border-none shadow-2xl bg-card/80 backdrop-blur-2xl">
          <CardHeader className="space-y-1 pb-8">
            <div className="lg:hidden mb-4">
              <HeartPulse className="h-12 w-12 text-primary mx-auto animate-pulse" />
            </div>
            <CardTitle className="text-3xl font-black text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Accédez à votre espace clinique sécurisé
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nom d'utilisateur
                </Label>
                <div className="relative">
                  <User className={cn(
                    "absolute left-3 top-2.5 h-5 w-5 transition-colors",
                    focusedField === 'username' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="Entrez votre identifiant"
                    className={cn(
                      "pl-10 h-11 transition-all duration-200",
                      focusedField === 'username' && "ring-2 ring-primary/20 border-primary"
                    )}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className={cn(
                    "absolute left-3 top-2.5 h-5 w-5 transition-colors",
                    focusedField === 'password' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="••••••••"
                    className={cn(
                      "pl-10 h-11 transition-all duration-200",
                      focusedField === 'password' && "ring-2 ring-primary/20 border-primary"
                    )}
                  />
                </div>
                <PasswordStrengthMeter password={password} />
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>

              {/* Footer Links */}
              <div className="text-center pt-4">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
