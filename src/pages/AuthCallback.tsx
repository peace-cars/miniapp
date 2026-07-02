import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../lib/apiClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Supabase OAuth redirects back with #access_token=...&refresh_token=...
      const hash = location.hash;
      if (!hash) {
        navigate('/login', { replace: true });
        return;
      }

      // Parse hash fragments
      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        // Send tokens to our backend to sync the profile and set HTTP cookies
        const res = await fetch(`${API_URL}/auth/oauth-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            default_role: 'USER', // Ensure standard users get USER role
          }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'OAuth sync failed');
        }

        // Backend wraps successful response in an envelope usually, or raw. Let's unwrap if needed
        const payload = data.success && data.data ? data.data : data;

        const sessionData = {
          access_token: payload.session?.access_token || accessToken,
          refresh_token: payload.session?.refresh_token || refreshToken,
          expires_at: payload.session?.expires_at || Math.floor(Date.now() / 1000) + 3600,
          user: payload.user,
          profile: payload.profile,
        };

        localStorage.setItem('client_session', JSON.stringify(sessionData));
        
        // Reload to trigger auth context initialization
        window.location.href = '/';
      } catch (err) {
        console.error('OAuth Callback Error:', err);
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [location.hash, navigate]);

  return null;
}
