import { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Wand2,
  Phone,
  Car,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MatchFinder from '../components/MatchFinder';
import { useTranslation } from 'react-i18next';
import { ClientCache } from '../lib/cache';
import { API_URL } from '../lib/apiClient';
import { ProgressiveImage } from '../components/ui/ProgressiveImage';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  retail_price_etb: number;
  fuel: string;
  images: string[];
  certified_km?: number;
  condition?: string;
  locationName?: string;
  branchName?: string;
  inquiryCount?: number;
}

const MAKE_FILTERS = ['All', 'Toyota', 'BMW', 'Mercedes', 'BYD', 'Hyundai', 'Suzuki'];

// ── Shared Listing Card ──────────────────────────────────────────────────────
function ListingCard({ car }: { car: Vehicle }) {
  const conditionText = car.condition
    ? car.condition
    : car.certified_km
      ? `${Math.round(car.certified_km / 1000)}k km`
      : car.year < new Date().getFullYear()
        ? 'Used'
        : 'New';

  return (
    <Link to={`/inventory/${car.id}`} className="market-card group block">
      <div className="market-card-img relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
        <ProgressiveImage
          src={car.images[0]}
          alt={`${car.year} ${car.make} ${car.model}`.replace(/\s+/g, ' ')}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {car.fuel === 'ELECTRIC' && (
          <span
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
            style={{ background: '#16a34a' }}
          >
            ⚡ Electric
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="market-card-body">
        <p className="market-card-price">
          ETB {((car.retail_price_etb || 0) / 1_000_000).toFixed(2)}M
        </p>
        <p className="market-card-title">
          {`${car.year} ${car.make} ${car.model}`.replace(/\s+/g, ' ')}
        </p>
        <p className="market-card-meta">
          {car.branchName || car.locationName || 'Addis Ababa'} · {conditionText}
        </p>
      </div>
    </Link>
  );
}

// ── Trending post card (community-post style) ─────────────────────────────────
function TrendingCard({ car, rank }: { car: Vehicle; rank: number }) {

  return (
    <Link
      to={`/inventory/${car.id}`}
      className="block shrink-0 rounded-2xl overflow-hidden group"
      style={{
        width: 260,
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)',
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <ProgressiveImage
          src={car.images[0]}
          alt={`${car.year} ${car.make} ${car.model}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Rank badge */}
        <div
          className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white"
          style={{ background: rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : 'rgba(0,0,0,0.55)' }}
        >
          #{rank}
        </div>
        {car.fuel === 'ELECTRIC' && (
          <span
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
            style={{ background: '#16a34a' }}
          >
            ⚡ EV
          </span>
        )}
      </div>

      {/* Post body */}
      <div className="p-3">
        <p className="font-bold text-[13px] leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          {car.year} {car.make} {car.model}
        </p>
        <p className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--color-accent)' }}>
          ETB {((car.retail_price_etb || 0) / 1_000_000).toFixed(2)}M
        </p>
      </div>
    </Link>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="market-card animate-pulse">
      <div
        className="market-card-img rounded-xl"
        style={{ aspectRatio: '16/10', background: 'var(--color-bg-tertiary)' }}
      />
      <div className="market-card-body space-y-2">
        <div className="h-4 rounded-md w-2/3" style={{ background: 'var(--color-bg-tertiary)' }} />
        <div className="h-3 rounded-md w-3/4" style={{ background: 'var(--color-bg-tertiary)' }} />
        <div className="h-3 rounded-md w-1/2" style={{ background: 'var(--color-bg-tertiary)' }} />
      </div>
    </div>
  );
}

function TrendingSkeleton() {
  return (
    <div className="shrink-0 rounded-2xl overflow-hidden animate-pulse" style={{ width: 260, background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
      <div style={{ aspectRatio: '4/3', background: 'var(--color-bg-tertiary)' }} />
      <div className="p-3 space-y-2">
        <div className="h-3 rounded w-3/4" style={{ background: 'var(--color-bg-tertiary)' }} />
        <div className="h-3 rounded w-1/2" style={{ background: 'var(--color-bg-tertiary)' }} />
      </div>
    </div>
  );
}

const Home = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMake, setActiveMake] = useState('All');
  const [isMatchFinderOpen, setIsMatchFinderOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    ClientCache.swr<Vehicle[]>(
      `${API_URL}/vehicles/showroom`,
      (data) => {
        const list = Array.isArray(data) ? data : [];
        setVehicles(list.filter((v) => v.model.toLowerCase() !== 'rav4'));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  const filtered = vehicles.filter((v) => {
    return activeMake === 'All' || v.make.toLowerCase().includes(activeMake.toLowerCase());
  });

  const featured = filtered.slice(0, 8);
  const trending = [...vehicles]
    .sort((a, b) => (b.inquiryCount || 0) - (a.inquiryCount || 0))
    .slice(0, 6);

  // Quiz completion → navigate to inventory with filter params
  const handleQuizComplete = useCallback((answers: Record<string, string>) => {
    const params = new URLSearchParams();
    // Map quiz answers to inventory filter params
    if (answers.budget === 'BUDGET') {
      params.set('maxPrice', '3');
    } else if (answers.budget === 'MID') {
      params.set('minPrice', '3');
      params.set('maxPrice', '8');
    } else if (answers.budget === 'PREMIUM') {
      params.set('minPrice', '8');
    }
    if (answers.priority === 'EFFICIENCY') {
      params.set('fuel', 'ELECTRIC');
    }
    if (answers.purpose === 'OFFROAD') {
      params.set('bodyType', 'SUV');
    } else if (answers.purpose === 'CITY') {
      params.set('bodyType', 'Sedan');
    }
    navigate(`/inventory?${params.toString()}`);
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-bg-secondary)' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-3xl"
          >
            <p
              className="text-[11px] font-bold tracking-[0.18em] uppercase mb-2"
              style={{ color: 'var(--color-accent)' }}
            >
              PeaceCars Ethiopia
            </p>
            <h1
              className="text-[36px] md:text-6xl font-black tracking-tight leading-[1.06]"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {t('home.hero_title', 'Find your next vehicle with confidence')}
            </h1>
            <p
              className="mt-3 text-[15px] md:text-lg font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {t('home.hero_subtitle', "Ethiopia's premier platform for verified vehicles, transparent pricing, and seamless transactions.")}
            </p>
          </motion.div>

          {/* Hero CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-6 flex flex-wrap gap-3"
          >
            <Link
              to="/inventory"
              className="px-6 py-3 rounded-xl font-semibold text-[14px] text-white flex items-center gap-2"
              style={{ background: 'var(--color-accent)' }}
            >
              Browse All Cars <ArrowRight size={15} />
            </Link>
            <button
              onClick={() => setIsMatchFinderOpen(true)}
              className="px-6 py-3 rounded-xl font-semibold text-[14px] flex items-center gap-2 transition-colors"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <Wand2 size={15} style={{ color: 'var(--color-accent)' }} />
              Find My Match
            </button>
            <Link
              to="/sell"
              className="px-6 py-3 rounded-xl font-semibold text-[14px] flex items-center gap-2 transition-colors"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <Car size={15} />
              Sell My Car
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── TRENDING (community post style) ─────────────────────────────── */}
      <section className="pt-8 pb-2" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between px-4 md:px-8 mb-4">
            <div>
              <h2 className="section-title text-[18px] md:text-[20px] flex items-center gap-2">
                🔥 Trending Now
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                Most inquired vehicles this week
              </p>
            </div>
            <Link to="/inventory" className="section-link flex items-center gap-1 text-[13px]">
              See all <ChevronRight size={13} />
            </Link>
          </div>

          {/* Horizontal scroll – no padding so cards bleed to edges */}
          <div className="flex overflow-x-auto gap-3 px-4 md:px-8 pb-4 no-scrollbar snap-x snap-mandatory">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="snap-center">
                    <TrendingSkeleton />
                  </div>
                ))
              : trending.map((car, i) => (
                  <div key={car.id} className="snap-center">
                    <TrendingCard car={car} rank={i + 1} />
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ── BROWSE LISTINGS ────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto w-full px-4 md:px-8 py-2 md:py-6">
        {/* Section header + Make filter chips */}
        <div className="flex flex-col gap-3 mb-5">
          <div className="section-header mb-0">
            <h2 className="section-title text-[18px] md:text-[20px]">Latest Listings</h2>
            <Link to="/inventory" className="section-link flex items-center gap-1 text-[13px]">
              See all <ChevronRight size={13} />
            </Link>
          </div>

          {/* Make filter chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
            {MAKE_FILTERS.map((make) => (
              <button
                key={make}
                onClick={() => setActiveMake(make)}
                className={`chip ${activeMake === make ? 'active' : ''}`}
              >
                {make}
              </button>
            ))}
          </div>
        </div>

        {/* Listing grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
            : featured.length > 0
              ? featured.map((car) => <ListingCard key={car.id} car={car} />)
              : (
                  <div className="col-span-full py-16 text-center" style={{ color: 'var(--color-text-muted)' }}>
                    <p className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      No listings found
                    </p>
                    <p className="text-sm">Try adjusting your filter.</p>
                  </div>
                )}
        </div>

        {/* View all CTA */}
        {!loading && filtered.length > 8 && (
          <div className="mt-8 text-center">
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-[14px]"
              style={{
                background: 'var(--color-bg)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              View all {filtered.length} listings <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>

      {/* ── CONTACT ─────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--color-border)' }} />
      <section style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-bg-secondary)' }}
            >
              <Phone size={22} style={{ color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <p className="text-[16px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Talk to a Sales Advisor
              </p>
              <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                Available 7 days a week in Addis Ababa
              </p>
            </div>
          </div>
          <a
            href="tel:+251900000000"
            className="px-8 py-3 rounded-xl font-bold text-[15px] shrink-0"
            style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg)' }}
          >
            Call +251 900 000 000
          </a>
        </div>
      </section>

      <MatchFinder
        isOpen={isMatchFinderOpen}
        onClose={() => setIsMatchFinderOpen(false)}
        onComplete={handleQuizComplete}
      />
    </div>
  );
};

export default Home;
