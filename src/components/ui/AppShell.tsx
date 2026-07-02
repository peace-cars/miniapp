import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useWishlist } from '../../lib/WishlistContext';
import { useComparison } from '../../lib/ComparisonContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  BarChart3,
  Languages,
  Sun,
  Moon,
  Home,
  Car,
  MessageSquare,
  User,
  Bell,
  MoreHorizontal,
  X,
  ClipboardList,
  Users,
  Compass,
  Search,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFeatureFlags } from '../../lib/featureFlags';
import { closeTelegramApp } from '../../lib/telegram';

interface TmaShellProps {
  notifications?: any[];
  showNotifs?: boolean;
  onToggleNotifs?: () => void;
  onMarkAllRead?: () => void;
  children: React.ReactNode;
}

const getPrimaryTabs = (t: any) => [
  { id: 'home',     label: t('nav.home', 'Home'),           path: '/',          icon: Home },
  { id: 'browse',   label: t('nav.inventory', 'Browse'),    path: '/inventory', icon: Car },
  { id: 'messages', label: t('nav.messages', 'Messages'),   path: '/messages',  icon: MessageSquare },
  { id: 'profile',  label: t('nav.profile', 'Profile'),     path: '/profile',   icon: User },
];

const getMoreLinks = (t: any) => [
  { label: t('nav.track', 'Track Request'),       path: '/track',           icon: ClipboardList,  flag: null },
  { label: t('nav.sourcing', 'Custom Sourcing'),  path: '/custom-sourcing', icon: Search,         flag: 'source' },
  { label: t('nav.community', 'Community'),       path: '/community',       icon: Users,          flag: 'community' },
  { label: t('nav.compare', 'Compare Cars'),      path: '/compare',         icon: BarChart3,      flag: null },
  { label: t('nav.my_sourcing', 'My Sourcing'),   path: '/sourcing',        icon: Compass,       flag: 'source' },
];

const PAGE_TITLES: Record<string, string> = {
  '/inventory':       'Browse',
  '/sell':            'Sell',
  '/custom-sourcing': 'Source',
  '/track':           'Track',
  '/messages':        'Messages',
  '/community':       'Community',
  '/profile':         'Profile',
  '/compare':         'Compare',
  '/sourcing':        'Sourcing',
  '/custom-order':    'Custom Order',
};

export function AppShell({
  children,
  notifications = [],
  showNotifs,
  onToggleNotifs,
  onMarkAllRead,
}: TmaShellProps) {
  const { session, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || 'en';
  const { theme, toggleTheme } = useTheme();
  const featureFlags = useFeatureFlags();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    setShowMore(false);
    setShowNotifPanel(false);
    window.scrollTo({ top: 0 });
    
    // Manage Telegram BackButton
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      if (location.pathname === '/') {
        tg.BackButton.hide();
      } else {
        tg.BackButton.show();
      }
      
      const onBack = () => { navigate(-1); };
      tg.onEvent('backButtonClicked', onBack);
      return () => tg.offEvent('backButtonClicked', onBack);
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    document.body.style.overflow = showMore ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMore]);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const isMoreActive = getMoreLinks(t).some(l => isActive(l.path));

  // Note: Telegram WebApp manages its own header.
  // We just render the content and the bottom tab bar.
  return (
    <div className="flex flex-col min-h-screen font-sans antialiased"
      style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>

      <AnimatePresence>
        {showNotifPanel && (
          <div className="fixed inset-0 z-[300] flex items-start justify-end p-4 pt-16 bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setShowNotifPanel(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border z-10"
              style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between px-4 py-3.5 border-b"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
                <span className="text-[14px] font-black">Notifications</span>
                <button onClick={() => setShowNotifPanel(false)}><X size={18} /></button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center gap-3 text-text-secondary">
                    <p className="text-[12px] font-bold">All caught up</p>
                  </div>
                ) : notifications.map((n: any) => (
                  <div key={n.id} className="px-4 py-3.5 border-b"
                    style={{ background: n.isRead ? 'transparent' : 'var(--color-accent-light)' }}>
                    <p className="text-[13px] font-semibold">{n.title}</p>
                    <p className="text-[12px] mt-1 text-text-secondary">{n.body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[260] rounded-t-[28px] overflow-hidden pb-10"
              style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <p className="text-[16px] font-black">{t('nav.more', 'More')}</p>
                <button onClick={() => setShowMore(false)}><X size={16} /></button>
              </div>
              <div className="px-4 pb-2 grid grid-cols-3 gap-2">
                {getMoreLinks(t).filter(l => !l.flag || featureFlags[l.flag as keyof typeof featureFlags]).map(item => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setShowMore(false)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all"
                      style={{ background: active ? 'var(--color-accent-light)' : 'var(--color-bg-secondary)', color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                      <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                      <span className="text-[11px] font-bold">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="mx-4 my-3 border-t" style={{ borderColor: 'var(--color-border)' }} />
              <div className="px-4 space-y-1">
                <button onClick={toggleTheme} className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl bg-bg-secondary">
                  <span className="flex items-center gap-3 text-[14px] font-medium"><Moon size={18} /> {theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
                <button onClick={() => i18n.changeLanguage(currentLang === 'en' ? 'am' : 'en')} className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl bg-bg-secondary">
                  <span className="flex items-center gap-3 text-[14px] font-medium"><Languages size={18} /> {currentLang === 'en' ? 'አማርኛ' : 'English'}</span>
                </button>
                <button onClick={() => { logout(); closeTelegramApp(); }} className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl bg-bg-secondary text-red-500">
                  <LogOut size={18} /> <span className="text-[14px] font-medium">Close App</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main tabIndex={-1} className="flex-1 relative" style={{ paddingTop: 16, paddingBottom: 80 }}>
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-[200] px-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 8px)' }}>
        <div className="relative mx-auto flex w-full max-w-md items-center justify-around overflow-hidden rounded-[28px] border"
          style={{
            background: theme === 'dark' ? 'rgba(10,10,10,0.88)' : 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(24px)',
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
          }}>
          {getPrimaryTabs(t).map((tab) => {
            const active = isActive(tab.path);
            const Icon = tab.icon;
            const badgeCount = tab.id === 'messages' ? unreadCount : 0;
            return (
              <Link key={tab.id} to={tab.path}
                className={cn('relative flex flex-1 flex-col items-center justify-center py-2.5 min-h-[58px] rounded-[22px]', active ? 'mx-0.5 my-1' : '')}
                style={{
                  background: active ? (theme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)') : 'transparent',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}>
                <div className="relative">
                  <Icon size={21} strokeWidth={active ? 2.5 : 1.8} className={cn('mb-0.5', active ? 'scale-110' : 'scale-100')} />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-bg">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
                <span className={cn('text-[10px] leading-none tracking-wide', active ? 'font-bold' : 'font-medium')}>{tab.label}</span>
              </Link>
            );
          })}
          <button onClick={() => setShowMore(!showMore)}
            className={cn('relative flex flex-1 flex-col items-center justify-center py-2.5 min-h-[58px] rounded-[22px]', (showMore || isMoreActive) ? 'mx-0.5 my-1' : '')}
            style={{
              background: (showMore || isMoreActive) ? (theme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)') : 'transparent',
              color: (showMore || isMoreActive) ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            }}>
            <MoreHorizontal size={21} strokeWidth={(showMore || isMoreActive) ? 2.5 : 1.8} className="mb-0.5" />
            <span className={cn('text-[10px] leading-none tracking-wide', (showMore || isMoreActive) ? 'font-bold' : 'font-medium')}>{t('nav.more', 'More')}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
