import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Heart, BarChart3, Flame, Package, X, SlidersHorizontal, ChevronDown
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '../lib/WishlistContext';
import { useComparison } from '../lib/ComparisonContext';
import { ClientCache } from '../lib/cache';
import { API_URL } from '../lib/apiClient';
import { useTranslation } from 'react-i18next';

import type { Vehicle } from '../shared/types';

// ─── Filter state ──────────────────────────────────────────────────────────────
interface Filters {
  priceMin: number;
  priceMax: number;
  yearMin: number;
  yearMax: number;
  fuelTypes: string[];
  dutyStatuses: string[];
  makes: string[];
}

const DEFAULT_FILTERS: Filters = {
  priceMin: 0,
  priceMax: 99999,
  yearMin: 1900,
  yearMax: new Date().getFullYear() + 1,
  fuelTypes: [],
  dutyStatuses: [],
  makes: [],
};

const getSortOptions = (t: any) => [
  { value: 'default',    label: t('inventory.sort.featured', 'Featured') },
  { value: 'price_low',  label: t('inventory.sort.price_low', 'Price: Low to High') },
  { value: 'price_high', label: t('inventory.sort.price_high', 'Price: High to Low') },
  { value: 'year_new',   label: t('inventory.sort.year_new', 'Year: Newest First') },
  { value: 'km_low',     label: t('inventory.sort.km_low', 'Mileage: Lowest First') },
];

const FUEL_TYPES    = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'];
const PAYMENT_STATUSES = ['DUTY_FREE', 'DUTY_PAID', 'DUTY_PENDING'];
const getPaymentStatusLabels = (t: any): Record<string, string> => ({
  'DUTY_FREE': t('inventory.payment.duty_free', 'Bank-Financed'),
  'DUTY_PAID': t('inventory.payment.duty_paid', 'Fully Paid'),
  'DUTY_PENDING': t('inventory.payment.duty_pending', 'Payment Pending'),
});
const MAKES         = ['Toyota', 'BMW', 'Mercedes', 'BYD', 'Hyundai', 'Suzuki', 'Chery', 'Volkswagen'];

import { ProgressiveImage } from '../components/ui/ProgressiveImage';

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="market-card animate-pulse">
      <div className="market-card-img aspect-[4/3] rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }} />
      <div className="market-card-body space-y-2">
        <div className="h-4 rounded-md w-2/3" style={{ background: 'var(--color-bg-tertiary)' }} />
        <div className="h-3 rounded-md w-3/4" style={{ background: 'var(--color-bg-tertiary)' }} />
        <div className="h-3 rounded-md w-1/2" style={{ background: 'var(--color-bg-tertiary)' }} />
      </div>
    </div>
  );
}

// ─── Vehicle card ──────────────────────────────────────────────────────────────
function VehicleCard({ car, idx }: { car: Vehicle; idx: number }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toggleCompare, isInCompare } = useComparison();
  const { t } = useTranslation();
  const wishlisted = isInWishlist(car.id);
  const comparing  = isInCompare(car.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.25) }}
      className="market-card group relative"
    >
      {/* Image */}
      <div className="market-card-img aspect-[4/3] relative">
        <Link to={`/inventory/${car.id}`} className="block w-full h-full">
          <ProgressiveImage
            src={car.images[0]}
            alt={`${car.year} ${car.make} ${car.model}`.replace(/\s+/g, ' ')}
            className="w-full h-full"
          />
        </Link>

        {/* Badges */}
        {car.fuel === 'ELECTRIC' && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: '#16a34a' }}>
            ⚡ {t('inventory.badges.electric', 'Electric')}
          </span>
        )}
        {(car.inquiryCount || 0) > 1 && (
          <span
            className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
            style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', backdropFilter: 'blur(4px)' }}
          >
            <Flame size={9} color="#fbbf24" /> {car.inquiryCount} {t('inventory.badges.interested', 'interested')}
          </span>
        )}

        {/* Action overlay — visible on hover (desktop) or always (mobile) */}
        <div className="absolute top-2 right-2 flex gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleWishlist(car.id); }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm"
            style={{ background: wishlisted ? '#ef4444' : 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.08)' }}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Save'}
          >
            <Heart size={13} color={wishlisted ? '#fff' : '#333'} fill={wishlisted ? '#fff' : 'none'} />
          </button>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleCompare(car); }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm"
            style={{ background: comparing ? 'var(--color-accent)' : 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.08)' }}
            aria-label={comparing ? 'Remove from compare' : 'Compare'}
          >
            <BarChart3 size={13} color={comparing ? '#fff' : '#333'} />
          </button>
        </div>
      </div>

      {/* Text */}
      <Link to={`/inventory/${car.id}`} className="market-card-body block">
        <p className="market-card-price">ETB {((car.retail_price_etb || 0) / 1_000_000).toFixed(2)}M</p>
        <p className="market-card-title">{`${car.year} ${car.make} ${car.model}`.replace(/\s+/g, ' ')}</p>
        <p className="market-card-meta">
          {car.branchName || 'Addis Ababa'}
          {` · ${(car as any).condition ? (car as any).condition : (car.certified_km ? `${Math.round(car.certified_km / 1000)}k km` : (car.year < new Date().getFullYear() ? t('inventory.status.used', 'Used') : t('inventory.status.new', 'New')))}`}
        </p>
      </Link>
    </motion.div>
  );
}

// ─── Sidebar filter section ────────────────────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b py-4" style={{ borderColor: 'var(--color-border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <span className="text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</span>
        <ChevronDown
          size={14}
          style={{ color: 'var(--color-text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── Checkbox row ──────────────────────────────────────────────────────────────
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer py-1 group">
      <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
      <div
        className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
        style={{
          background: checked ? 'var(--color-accent)' : 'var(--color-bg)',
          border: checked ? 'none' : '1.5px solid var(--color-border)',
        }}
      >
        {checked && <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </div>
      <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
    </label>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
const Inventory = () => {
  const { t } = useTranslation();
  // Pre-read cache synchronously — eliminates skeleton flash on back-navigation
  const _cached = ClientCache.get<Vehicle[]>(`${API_URL}/vehicles/showroom`);
  const [inventory, setInventory] = useState<Vehicle[]>(_cached || []);
  const [loading, setLoading] = useState(!_cached);
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial params from Match Finder or URL
  const initialMinPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : DEFAULT_FILTERS.priceMin;
  const initialMaxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : DEFAULT_FILTERS.priceMax;
  const initialFuel = searchParams.get('fuel') ? [searchParams.get('fuel')!] : DEFAULT_FILTERS.fuelTypes;
  const initialSearch = searchParams.get('bodyType') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    priceMin: initialMinPrice,
    priceMax: initialMaxPrice,
    fuelTypes: initialFuel,
  });
  const [sortBy, setSortBy] = useState('default');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(12);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('searchHistory') || '[]'); } catch { return []; }
  });

  const saveSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const next = [trimmed, ...searchHistory.filter(x => x !== trimmed)].slice(0, 10);
    setSearchHistory(next);
    localStorage.setItem('searchHistory', JSON.stringify(next));
  };

  // Re-sync if URL changes (e.g., navigating from Home again)
  useEffect(() => {
    const minP = searchParams.get('minPrice');
    const maxP = searchParams.get('maxPrice');
    const f = searchParams.get('fuel');
    const body = searchParams.get('bodyType');
    
    if (minP || maxP || f || body) {
      setFilters(prev => ({
        ...prev,
        priceMin: minP ? parseFloat(minP) : prev.priceMin,
        priceMax: maxP ? parseFloat(maxP) : prev.priceMax,
        fuelTypes: f ? [f] : prev.fuelTypes,
      }));
      if (body) setSearchQuery(body);
    }
  }, [searchParams]);

  useEffect(() => {
    ClientCache.swr<Vehicle[]>(
      `${API_URL}/vehicles/showroom`,
      (data) => { setInventory(Array.isArray(data) ? data : []); setLoading(false); },
      () => setLoading(false)
    );

    const unsub = ClientCache.subscribe<Vehicle[]>(`${API_URL}/vehicles/showroom`, (data) => {
      setInventory(Array.isArray(data) ? data : []);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    // Reset infinite scroll when filters change
    setDisplayCount(12);
  }, [filters, searchQuery, sortBy]);

  const toggleArrayFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS) || searchQuery !== '';

  const filteredInventory = inventory
    .filter(car => {
      const priceM = (car.retail_price_etb || 0) / 1_000_000;
      const q = searchQuery.toLowerCase();
      return (
        (`${car.make} ${car.model}`.toLowerCase().includes(q) || (car.features && car.features.some(f => f.toLowerCase().includes(q)))) &&
        priceM >= filters.priceMin && priceM <= filters.priceMax &&
        car.year >= filters.yearMin && car.year <= filters.yearMax &&
        (filters.fuelTypes.length === 0 || filters.fuelTypes.some(f => f.toUpperCase() === car.fuel?.toUpperCase())) &&
        (filters.dutyStatuses.length === 0 || filters.dutyStatuses.some(d => d.toUpperCase() === car.duty?.toUpperCase())) &&
        (filters.makes.length === 0 || filters.makes.some(m => car.make?.toLowerCase().includes(m.toLowerCase())))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':  return (a.retail_price_etb || 0) - (b.retail_price_etb || 0);
        case 'price_high': return (b.retail_price_etb || 0) - (a.retail_price_etb || 0);
        case 'year_new':   return b.year - a.year;
        case 'km_low':     return (a.certified_km || 999999) - (b.certified_km || 999999);
        default: return 0;
      }
    });

  const resetFilters = () => { setFilters(DEFAULT_FILTERS); setSearchQuery(''); };

  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const bottomRef = React.useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setDisplayCount(prev => prev + 12);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading]);

  // ─── Sidebar (plain JSX, NOT a component — avoids remount on filter change) ─
  const sidebarContent = (
    <aside className="space-y-0">
      <FilterSection title={t('inventory.filters.make', 'Make')}>
        {MAKES.map(make => (
          <CheckRow
            key={make}
            label={make}
            checked={filters.makes.includes(make)}
            onChange={() => toggleArrayFilter('makes', make)}
          />
        ))}
      </FilterSection>

      <FilterSection title={t('inventory.filters.fuel_type', 'Fuel Type')}>
        {FUEL_TYPES.map(fuel => (
          <CheckRow
            key={fuel}
            label={fuel.charAt(0) + fuel.slice(1).toLowerCase()}
            checked={filters.fuelTypes.includes(fuel)}
            onChange={() => toggleArrayFilter('fuelTypes', fuel)}
          />
        ))}
      </FilterSection>

      <FilterSection title={t('inventory.filters.payment_status', 'Payment Status')}>
        {PAYMENT_STATUSES.map(d => (
          <CheckRow
            key={d}
            label={getPaymentStatusLabels(t)[d] || d}
            checked={filters.dutyStatuses.includes(d)}
            onChange={() => toggleArrayFilter('dutyStatuses', d)}
          />
        ))}
      </FilterSection>

      <FilterSection title={t('inventory.filters.price', 'Price (M ETB)')}>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin || ''}
            onChange={e => setFilters(f => ({ ...f, priceMin: e.target.value ? Number(e.target.value) : 0 }))}
            className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax === 99999 ? '' : filters.priceMax}
            onChange={e => setFilters(f => ({ ...f, priceMax: e.target.value ? Number(e.target.value) : 99999 }))}
            className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>
      </FilterSection>

      <FilterSection title={t('inventory.filters.year', 'Year')}>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="number"
            placeholder="From"
            value={filters.yearMin === 1900 ? '' : filters.yearMin}
            onChange={e => setFilters(f => ({ ...f, yearMin: e.target.value ? Number(e.target.value) : 1900 }))}
            className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>–</span>
          <input
            type="number"
            placeholder="To"
            value={filters.yearMax === new Date().getFullYear() + 1 ? '' : filters.yearMax}
            onChange={e => setFilters(f => ({ ...f, yearMax: e.target.value ? Number(e.target.value) : new Date().getFullYear() + 1 }))}
            className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>
      </FilterSection>

      {isFiltered && (
        <div className="pt-4">
          <button
            onClick={resetFilters}
            className="w-full py-2 rounded-lg text-[13px] font-semibold transition-colors"
            style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            {t('inventory.filters.clear_all', 'Clear All Filters')}
          </button>
        </div>
      )}
    </aside>
  );

  return (
    <div 
      className="min-h-screen max-md:min-h-0 max-md:h-[calc(100dvh-152px-env(safe-area-inset-bottom,0px))] max-md:flex max-md:flex-col" 
      style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-md:flex-1 max-md:overflow-y-auto w-full relative" id="inventory-scroll-container">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-5 md:py-6">
          <h1 className="text-[28px] md:text-3xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            {t('inventory.header.title', 'Browse Listings')}
          </h1>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {t('inventory.header.subtitle', '{{count}} inspected, certified vehicles in Addis Ababa', { count: inventory.length })}
          </p>
        </div>
      </div>

      {/* ── Sticky Mobile Toolbar ───────────────────────── */}
      <div className="md:hidden sticky z-[100] px-3 mt-2 mb-4 pointer-events-none" style={{ top: 12 }}>
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          <button 
            onClick={() => setMobileSearchOpen(true)}
            className="flex-1 flex items-center gap-2 px-4 h-11 rounded-full border shadow-lg transition-active"
            style={{ 
              background: 'rgba(var(--color-bg-rgb, 255, 255, 255), 0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card-raised)' 
            }}
          >
            <Search size={15} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-[13px] font-medium text-left truncate flex-1" style={{ color: searchQuery ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
              {searchQuery || t('inventory.search.placeholder', 'Search...')}
            </span>
          </button>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setMobileFiltersOpen(o => !o)}
              className="flex items-center justify-center h-11 px-3.5 rounded-full border shadow-lg"
              style={{ 
                background: 'rgba(var(--color-bg-rgb, 255, 255, 255), 0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', boxShadow: 'var(--shadow-card-raised)' 
              }}
            >
              <SlidersHorizontal size={14} className="mr-1.5" />
              <span className="text-[13px] font-bold">{t('inventory.search.filters', 'Filters')}</span>
              {isFiltered && <span className="ml-1.5 w-2 h-2 rounded-full bg-blue-500" />}
            </button>
            <div className="relative flex items-center h-11 w-[92px] rounded-full border shadow-lg" style={{ background: 'rgba(var(--color-bg-rgb, 255, 255, 255), 0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card-raised)' }}>
               <select
                 value={sortBy}
                 onChange={e => setSortBy(e.target.value)}
                 className="w-full pl-3 pr-6 h-full rounded-full text-[13px] font-bold appearance-none outline-none cursor-pointer bg-transparent truncate"
                 style={{ color: 'var(--color-text-primary)' }}
               >
                 {getSortOptions(t).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
               </select>
               <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop Search + Sort bar ───────────────────────── */}
      <div className="hidden md:block sticky z-[100] px-8 max-w-[1400px] mx-auto pointer-events-none mt-4 mb-4" style={{ top: 84 }}>
        <div className="h-14 flex items-center gap-3 px-4 rounded-full border shadow-lg pointer-events-auto" style={{ background: 'rgba(var(--color-bg-rgb, 255, 255, 255), 0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card-raised)' }}>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder={t('inventory.search.placeholder', 'Search make or model...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-[13px] font-medium outline-none bg-transparent"
              style={{ color: 'var(--color-text-primary)' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={13} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            )}
          </div>
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-lg text-[13px] font-semibold appearance-none outline-none cursor-pointer bg-transparent"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {getSortOptions(t).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">
        <div className="flex gap-8">

          {/* ── Desktop sidebar ────────────────────────────────────────────── */}
          <div className="hidden md:block w-56 lg:w-64 shrink-0">
            <div className="sticky top-[112px]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('inventory.search.filters', 'Filters')}</p>
                {isFiltered && (
                  <button onClick={resetFilters} className="text-[12px] font-semibold" style={{ color: 'var(--color-accent)' }}>
                    {t('inventory.filters.clear', 'Clear all')}
                  </button>
                )}
              </div>
              {sidebarContent}
            </div>
          </div>

          {/* ── Listing grid ───────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Result count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                {t('inventory.results.count', '<0>{{filtered}}</0> of {{total}} vehicles', {
                  filtered: filteredInventory.length,
                  total: inventory.length
                }).split('<0>').map((part, i) => {
                  if (part.includes('</0>')) {
                    const [inside, outside] = part.split('</0>');
                    return <span key={i}><span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{inside}</span>{outside}</span>;
                  }
                  return part;
                })}
              </p>
            </div>

            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : filteredInventory.length > 0 ? (
                <div className="space-y-8">
                  <motion.div layout className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                    {filteredInventory.slice(0, displayCount).map((car, idx) => (
                      <VehicleCard key={car.id} car={car} idx={idx} />
                    ))}
                  </motion.div>
                  {displayCount < filteredInventory.length && (
                    <div ref={bottomRef} className="h-20 w-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="py-24 flex flex-col items-center justify-center text-center gap-4 rounded-xl"
                  style={{ background: 'var(--color-bg)', border: '1px dashed var(--color-border)' }}
                >
                  <Package size={40} strokeWidth={1} style={{ color: 'var(--color-border)' }} />
                  <div className="space-y-1">
                    <h3 className="text-[17px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('inventory.empty.title', 'No matches found')}</h3>
                    <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>{t('inventory.empty.subtitle', 'Try adjusting your filters or search term.')}</p>
                  </div>
                  <button
                    onClick={resetFilters}
                    className="px-6 py-2.5 rounded-lg text-[13px] font-semibold transition-opacity active:opacity-70"
                    style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg)' }}
                  >
                    {t('inventory.filters.clear_all', 'Clear Filters')}
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] bg-black/50"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 z-[310] w-80 overflow-y-auto p-6"
              style={{ background: 'var(--color-bg)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[17px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('inventory.search.filters', 'Filters')}</h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: 'var(--color-bg-secondary)' }}>
                  <X size={16} style={{ color: 'var(--color-text-primary)' }} />
                </button>
              </div>
              {sidebarContent}
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-6 w-full py-3 rounded-lg font-semibold text-[14px] text-white"
                style={{ background: 'var(--color-accent)' }}
              >
                {t('inventory.filters.show_results', 'Show {{count}} results', { count: filteredInventory.length })}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>

      {/* ── Search Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed inset-0 z-[400] flex flex-col"
            style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
          >
            <form 
              onSubmit={e => { e.preventDefault(); saveSearch(searchQuery); setMobileSearchOpen(false); }}
              className="h-14 flex items-center gap-3 px-4 border-b shrink-0 pt-[calc(env(safe-area-inset-top,0px)+8px)] w-full" 
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
            >
              <button type="button" onClick={() => setMobileSearchOpen(false)} className="active:scale-90 transition-transform">
                <X size={20} />
              </button>
              <input
                type="search"
                autoFocus
                placeholder={t('inventory.search.placeholder', 'Search make or model...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="active:scale-90 transition-transform">
                  <X size={15} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              )}
            </form>
            <div className="flex-1 p-4 overflow-y-auto">
              <h4 className="text-[12px] font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                {searchQuery ? `Search Results (${filteredInventory.length})` : searchHistory.length > 0 ? 'Recent Searches' : 'Explore'}
              </h4>
              <div className="space-y-4 mt-4">
                {searchQuery || searchHistory.length === 0 ? (
                  filteredInventory.slice(0, 15).map(car => (
                    <button 
                      key={car.id} 
                      onClick={() => { saveSearch(searchQuery); setMobileSearchOpen(false); }} 
                      className="flex items-center gap-3 text-left w-full active:opacity-50 transition-opacity"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-bg)' }}>
                        <Search size={14} style={{ color: 'var(--color-text-secondary)' }} />
                      </div>
                      <span className="text-[14px] font-semibold">{`${car.year} ${car.make} ${car.model}`}</span>
                    </button>
                  ))
                ) : (
                  searchHistory.map((hist, i) => (
                    <button 
                      key={i} 
                      onClick={() => { setSearchQuery(hist); saveSearch(hist); setMobileSearchOpen(false); }} 
                      className="flex items-center gap-3 text-left w-full active:opacity-50 transition-opacity"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-bg)' }}>
                        <Search size={14} style={{ color: 'var(--color-text-secondary)' }} />
                      </div>
                      <span className="text-[14px] font-semibold">{hist}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
