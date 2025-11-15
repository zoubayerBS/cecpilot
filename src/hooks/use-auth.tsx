
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSession, validateSession, deleteSession, verifyUserPassword } from '@/services/cec';

const AUTH_KEY = 'cec-pilot-auth-token';
const AUTH_EVENT = 'cec-pilot-auth-change';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: string, pass: string, logCallback?: (message: string) => void) => Promise<void>;
  logout: () => void;
  user: { username: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const verifySession = useCallback(async () => {
    setIsLoading(true);
    try {
        const token = localStorage.getItem(AUTH_KEY);
        if (token) {
            const sessionUser = await validateSession(token);
            if (sessionUser) {
                setIsAuthenticated(true);
                setUser(sessionUser);
            } else {
                localStorage.removeItem(AUTH_KEY);
                setIsAuthenticated(false);
                setUser(null);
            }
        } else {
            setIsAuthenticated(false);
            setUser(null);
        }
    } catch (error) {
        console.error("Failed to verify session", error);
        localStorage.removeItem(AUTH_KEY);
        setIsAuthenticated(false);
        setUser(null);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_EVENT) {
        // A login or logout happened in another tab.
        // Re-verify the session to sync the state.
        verifySession();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [verifySession]);

  const login = useCallback(async (username, password, logCallback) => {
    const log = (message: string) => logCallback && logCallback(message);

    log(`▶️ Tentative de connexion pour '${username}'...`);

    try {
        log("🔍 Vérification des informations d'identification auprès du serveur...");
        const user = await verifyUserPassword(username, password);

        if (user) {
            log("✅ Informations d'identification valides.");
            log("🔐 Création d'un token de session sécurisé...");
            const token = await createSession(user.username);
            log("Token créé. Stockage local...");
            
            localStorage.setItem(AUTH_KEY, token);
            // This event will notify other tabs to update their auth state
            window.localStorage.setItem(AUTH_EVENT, Date.now().toString());

            setIsAuthenticated(true);
            setUser({ username: user.username });
            log("✅ Connexion réussie.");
        } else {
            log("❌ Nom d'utilisateur ou mot de passe incorrect.");
            throw new Error("Nom d'utilisateur ou mot de passe incorrect.");
        }
    } catch (error) {
        console.error("Authentication error:", error);
        if (error instanceof Error && error.message.includes('incorrect')) {
            throw error;
        }
        throw new Error("Une erreur réseau s'est produite lors de la connexion.");
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(AUTH_KEY);
    if (token) {
        try {
            await deleteSession(token);
        } catch (error) {
            console.error("Failed to delete session on server:", error);
        }
    }
    localStorage.removeItem(AUTH_KEY);
    // This event will notify other tabs to update their auth state
    window.localStorage.setItem(AUTH_EVENT, Date.now().toString());

    setIsAuthenticated(false);
    setUser(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
