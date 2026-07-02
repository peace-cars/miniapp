import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ClientCache } from './lib/cache';
import { API_URL, apiFetch } from './lib/apiClient';
import { ThemeProvider } from './lib/ThemeContext';
import { LanguageProvider } from './lib/LanguageContext';
import { WishlistProvider } from './lib/WishlistContext';
import { ComparisonProvider } from './lib/ComparisonContext';
import { SocketProvider } from './lib/SocketContext';
import { FeatureFlagsProvider, useFeatureFlags } from './lib/featureFlags';
import { AppShell } from './components/ui/AppShell';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { PwaInstallPrompt } from './components/ui/PwaInstallPrompt';
import { ComingSoonOverlay } from './components/ui/ComingSoonOverlay';
import ComparisonTray from './components/ComparisonTray';
import { ErrorBoundary } from './components/ErrorBoundary';
const Home = lazy(() => import('./pages/Home'));
const Inventory = lazy(() => import('./pages/Inventory'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const Sell = lazy(() => import('./pages/Sell'));
const TrackRequest = lazy(() => import('./pages/TrackRequest'));
const Login = lazy(() => import('./pages/Login'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Compare = lazy(() => import('./pages/Compare'));
const Messages = lazy(() => import('./pages/Messages'));
const CustomOrder = lazy(() => import('./pages/CustomOrder'));
const CustomSourcing = lazy(() => import('./pages/CustomSourcing'));
const SourcingDashboard = lazy(() => import('./pages/SourcingDashboard'));
const MatchReveal = lazy(() => import('./pages/MatchReveal'));
const Community = lazy(() => import('./pages/Community').then(module => ({ default: module.Community })));
const CommunityCreate = lazy(() => import('./pages/CommunityCreate').then(module => ({ default: module.CommunityCreate })));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const PublicProfile = lazy(() => import('./pages/PublicProfile').then(module => ({ default: module.PublicProfile })));
import Splash from './components/ui/Splash';

function AppContent() {
  const { session } = useAuth();
  const flags = useFeatureFlags();
  const [showSplash, setShowSplash] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // ── Global data prefetcher: warms all critical page caches immediately on login
  useEffect(() => {
    if (!session?.user?.id) return;
    const uid = session.user.id;

    // Fire all prefetches in parallel, silently — no UI blocking
    const prefetch = (url: string) =>
      ClientCache.swr(url, () => {}, () => {}).catch(() => {});

    Promise.allSettled([
      prefetch(`${API_URL}/vehicles/showroom`),
      prefetch(`${API_URL}/community/posts`),
      prefetch(`${API_URL}/community/events`),
      prefetch(`${API_URL}/profiles/me`),
      prefetch(`${API_URL}/sourcing-requests/me`),
      prefetch(`${API_URL}/trade-in-requests/customer/${uid}`),
    ]);
  }, [session?.user?.id]);

  useEffect(() => {
    const fetchNotifications = async () => {
      // Skip if no session or no token — avoids "Missing Authorization Token" 401 spam
      if (!session?.user?.id || !session?.access_token) return;
      try {
        const result = await apiFetch<any[]>('/notifications');
        const arr = (result as any)?.data ?? result;
        if (Array.isArray(arr)) setNotifications(arr);
      } catch (e) {
        console.error('[Client] Notifications sync failed', e);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [session?.user?.id, session?.access_token]);

  const handleMarkAllRead = async () => {
    if (!session?.access_token) return;
    try {
      await apiFetch('/notifications/mark-all-read', {
        method: 'POST',
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  return (
    <Router>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg-secondary text-text-muted">Loading page…</div>}>
          <AppShell 
            notifications={notifications} 
            showNotifs={showNotifs}
            onToggleNotifs={() => setShowNotifs(!showNotifs)}
            onMarkAllRead={handleMarkAllRead}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/inventory/:id" element={<VehicleDetail />} />
              <Route path="/sell" element={
                <><Sell />{!flags.sell && <ComingSoonOverlay featureName="Sell Your Car" />}</>
              } />
              <Route path="/track" element={<TrackRequest />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/custom-order" element={<CustomOrder />} />
              <Route path="/custom-sourcing" element={
                <><CustomSourcing />{!flags.source && <ComingSoonOverlay featureName="Custom Sourcing" />}</>
              } />
              <Route path="/sourcing" element={
                <><SourcingDashboard />{!flags.source && <ComingSoonOverlay featureName="Custom Sourcing" />}</>
              } />
              <Route path="/sourcing/match/:matchId" element={<MatchReveal />} />
              <Route path="/community" element={
                <><Community />{!flags.community && <ComingSoonOverlay featureName="Community Hub" />}</>
              } />
              <Route path="/community/create" element={
                <><CommunityCreate />{!flags.community && <ComingSoonOverlay featureName="Community Hub" />}</>
              } />
              <Route path="/community/post/:id" element={
                <><PostDetail />{!flags.community && <ComingSoonOverlay featureName="Community Hub" />}</>
              } />
              <Route path="/profile" element={<Profile />} />
              <Route path="/u/:id" element={<PublicProfile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </Suspense>
      </ErrorBoundary>
      <ComparisonTray />
      <PwaInstallPrompt />
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <WishlistProvider>
            <ComparisonProvider>
              <SocketProvider>
                <FeatureFlagsProvider>
                  <AppContent />
                </FeatureFlagsProvider>
              </SocketProvider>
            </ComparisonProvider>
          </WishlistProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
