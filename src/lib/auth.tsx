import React, { createContext, useContext, useEffect, useState } from 'react';
import { unwrapApiResponse, API_URL } from './apiClient';
import { getTelegramUser } from './telegram';

interface UserProfile {
  id: string;
  role: string;
  full_name: string;
  phone_number: string | null;
  branch_id: string | null;
  is_verified: boolean;
  is_inspector_verified: boolean;
  gamification_points: number;
  avatar_url?: string;
  telegram_user_id?: string;
}

interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string; email?: string };
  profile: UserProfile;
}

interface AuthContextType {
  session: SessionData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  login: async () => ({}),
  register: async () => ({}),
  loginWithGoogle: async () => ({}),
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    localStorage.removeItem('client_session');
    setSession(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem('client_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const nowSec = Math.floor(Date.now() / 1000);
          const needsRefresh = !parsed.access_token || (parsed.expires_at && parsed.expires_at - nowSec < 900);
          
          if (!needsRefresh) {
            setSession(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('[TMA Auth] Failed to parse session', e);
          localStorage.removeItem('client_session');
        }
      }

      // If no valid session, try Telegram auto-auth
      const { initDataRaw } = getTelegramUser();
      
      if (initDataRaw) {
        try {
          console.log('[TMA Auth] Authenticating via Telegram initData...');
          const res = await fetch(`${API_URL}/miniapp/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initDataRaw }),
          });

          if (res.ok) {
            const data = unwrapApiResponse(await res.json());
            const sessionData: SessionData = {
              access_token: data.session?.access_token || '',
              refresh_token: data.session?.refresh_token || '',
              expires_at: data.session?.expires_at || Math.floor(Date.now() / 1000) + 3600,
              user: data.user,
              profile: data.profile,
            };
            localStorage.setItem('client_session', JSON.stringify(sessionData));
            setSession(sessionData);
          } else {
            console.error('[TMA Auth] Telegram auth failed:', await res.text());
          }
        } catch (e) {
          console.error('[TMA Auth] Telegram auth network error', e);
        }
      } else {
        console.warn('[TMA Auth] No initDataRaw found. Make sure app is running inside Telegram WebApp.');
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async () => ({ error: 'Use Telegram auto-login' });
  const register = async () => ({ error: 'Use Telegram auto-login' });
  const loginWithGoogle = async () => ({ error: 'Use Telegram auto-login' });

  return (
    <AuthContext.Provider value={{ session, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
