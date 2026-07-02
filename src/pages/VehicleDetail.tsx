import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../lib/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Fuel,
  MapPin,
  ArrowLeft,
  BadgeCheck,
  FileCheck,
  Heart,
  BarChart3,
  Eye,
  ArrowRight,
  Send,
  Users,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useWishlist } from '../lib/WishlistContext';
import { useComparison } from '../lib/ComparisonContext';
import { useTranslation } from 'react-i18next';
import ChatPortal from '../components/ChatPortal';
import { ClientCache } from '../lib/cache';
import { VehicleDetailSkeleton } from '../components/ui/Skeleton';
import { VehicleSpecsTable } from '../components/ui/VehicleSpecsTable';
import { VehicleTechnicalPortfolio } from '../components/ui/VehicleTechnicalPortfolio';
import { VehicleGallery } from '../components/ui/VehicleGallery';

import type { Vehicle } from '../shared/types';

interface SimilarVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  retail_price_etb: number;
  fuel: string;
  images: string[];
}

const VehicleDetail = () => {
  const { id } = useParams();
  const { session } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toggleCompare, isInCompare } = useComparison();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [car, setCar] = useState<Vehicle | null>(null);
  const [isTradeInOpen, setIsTradeInOpen] = useState(false);
  const [tradeInForm, setTradeInForm] = useState({ make: '', model: '', year: '', mileage: '', askingPrice: '', contactPhone: session?.profile?.phone_number || '' });
  const [isSubmittingTradeIn, setIsSubmittingTradeIn] = useState(false);
  const [tradeInSuccess, setTradeInSuccess] = useState(false);
  const [similarVehicles, setSimilarVehicles] = useState<SimilarVehicle[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (session?.profile?.phone_number && !tradeInForm.contactPhone) {
      setTradeInForm(p => ({ ...p, contactPhone: session.profile.phone_number }));
    }
  }, [session]);

  const handleTradeInSubmit = async () => {
    if (!tradeInForm.make || !tradeInForm.model || !tradeInForm.year || !tradeInForm.contactPhone) {
      alert('Please fill out all required fields.');
      return;
    }
    
    setIsSubmittingTradeIn(true);
    try {
      await ClientCache.swr(`${API_URL}/trade-in-requests`, async () => {
        const res = await fetch(`${API_URL}/trade-in-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({
            vehicleMakeModel: `${tradeInForm.year} ${tradeInForm.make} ${tradeInForm.model}`,
            carDescription: `Target: ${car?.make} ${car?.model} (ID: ${car?.id})`,
            askingPrice: Number(tradeInForm.askingPrice) || 0,
            locationId: car?.branch_id || undefined, // undefined will be stripped by JSON.stringify or handled by @IsOptional
            vehicleDetails: {
              make: tradeInForm.make,
              model: tradeInForm.model,
              year: tradeInForm.year,
              mileage: tradeInForm.mileage,
              targetVehicleId: car?.id
            },
            contactPhone: tradeInForm.contactPhone
          })
        });
        if (!res.ok) throw new Error('Submission failed');
        return res.json();
      });
      setTradeInSuccess(true);
      setTimeout(() => {
        setIsTradeInOpen(false);
        setTradeInSuccess(false);
        setTradeInForm({ make: '', model: '', year: '', mileage: '', askingPrice: '', contactPhone: session?.profile?.phone_number || '' });
      }, 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to submit trade-in request. Please try again.');
    } finally {
      setIsSubmittingTradeIn(false);
    }
  };

  // Simulated view count for social proof
  const [viewCount] = useState(() => Math.floor(Math.random() * 25) + 5);

  useEffect(() => {
    if (!id) return;

    // Fetch single vehicle details from cache/SWR
    ClientCache.swr<Vehicle>(
      `${API_URL}/vehicles/showroom/${id}`,
      (data) => setCar(data),
      (err) => console.error('Failed to load vehicle:', err),
    );

    // Fetch all vehicles for "similar" section from cache/SWR
    ClientCache.swr<any[]>(`${API_URL}/vehicles/showroom`, (data) => {
      if (Array.isArray(data)) {
        setSimilarVehicles(data.filter((v: any) => v.id !== id).slice(0, 4));
      }
    });
  }, [id]);

  if (!car) {
    return <VehicleDetailSkeleton />;
  }

  const images =
    car.images && car.images.length > 0
      ? car.images
      : [
          'https://images.unsplash.com/photo-1550520920-aa136006dcce?auto=format&fit=crop&q=80&w=2938',
        ];

  const specs = [
    { label: t('details.specs.powertrain', 'Powertrain'), value: t(`details.specs.${car.fuel?.toLowerCase()}`, car.fuel || '—'), sub: t('details.specs.architecture', 'Architecture') },
    {
      label: t('details.specs.certified_mileage', 'Certified Mileage'),
      value: car.certified_km ? `${(car.certified_km / 1000).toFixed(0)}K` : '—',
      sub: t('details.specs.kilometers', 'Kilometers'),
    },
    {
      label: t('details.specs.valuation', 'Valuation'),
      value: `${((car.retail_price_etb || 0) / 1000000).toFixed(1)}M`,
      sub: t('details.specs.ethiopian_birr', 'Ethiopian Birr'),
    },
    {
      label: t('details.specs.payment', 'Payment'),
      value:
        car.duty === 'DUTY_PAID'
          ? t('details.specs.fully_paid', 'Fully Paid')
          : car.duty === 'DUTY_FREE'
            ? 'Bank-Financed'
            : 'Pending',
      sub: t('details.specs.status', 'Status'),
    },
  ];

  return (
    <div
      className="min-h-screen font-sans antialiased pb-28 lg:pb-0"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Floating Action Header (Mobile First) */}
      <div className="sticky top-[64px] z-[100] px-3 md:px-8 w-full max-w-[1400px] mx-auto pointer-events-none transition-all mt-3">
        <div 
          className="flex items-center justify-between h-14 md:h-16 px-2 md:px-4 rounded-full border shadow-lg pointer-events-auto"
          style={{ 
            background: 'rgba(var(--color-bg-rgb), 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-card-raised)'
          }}
        >
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-95"
            style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
          >
            <ArrowLeft size={18} />
          </button>
          
          {/* Title & Price (Centered on mobile, left on desktop) */}
          <div className="flex-1 px-3 truncate text-center md:text-left flex flex-col md:flex-row md:items-center md:gap-3">
            <span className="text-[13px] md:text-[15px] font-bold truncate block" style={{ color: 'var(--color-text-primary)' }}>
              {car.year} {car.make} {car.model}
            </span>
            <span className="text-[11px] md:text-[13px] font-black" style={{ color: 'var(--color-accent)' }}>
              ETB {((car.retail_price_etb || 0) / 1_000_000).toFixed(2)}M
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={() => toggleWishlist(car.id)}
              className="hidden md:flex w-10 h-10 rounded-full items-center justify-center transition-all active:scale-90"
              style={{
                background: isInWishlist(car.id) ? '#fee2e2' : 'var(--color-bg-secondary)',
              }}
              title="Save"
            >
              <Heart
                size={16}
                color={isInWishlist(car.id) ? '#ef4444' : 'var(--color-text-secondary)'}
                fill={isInWishlist(car.id) ? '#ef4444' : 'none'}
              />
            </button>
            <button
              onClick={() => setIsChatOpen(true)}
              className="text-[11px] md:text-[13px] font-bold px-4 py-2 md:py-2.5 rounded-full uppercase tracking-wider transition-all active:scale-95"
              style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg)' }}
            >
              {t('details.actions.inquire', 'Inquire')}
            </button>
          </div>
        </div>
      </div>

      {/* Page title + badge */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-6 pb-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <p
              className="text-[13px] font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {car.year} · {car.make}
            </p>
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {car.model}
            </h1>
            <p
              className="text-[14px] mt-1.5 font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {t('details.badges.inspected', 'Inspected')} · {t('details.badges.certified', 'Certified')} · {t('details.badges.delivery', 'Ready for delivery in Addis Ababa')}
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold self-start"
            style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
          >
            <Eye size={11} />
            🔥 {viewCount} {t('details.stats.viewed_today', 'viewed today')}
            {(car.inquiryCount || 0) > 0 && <span>· {car.inquiryCount} {t('details.stats.inquiries', 'inquiries')}</span>}
          </motion.div>
        </div>
      </div>

      {/* Main Gallery */}
      <VehicleGallery car={car} images={images} />

      {/* Specs Bar */}
      <VehicleSpecsTable specs={specs} />

      {/* Content Grid */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        {/* Mobile View Stack (Specs first, then Actions, then Finance) */}
        <div className="lg:hidden flex flex-col gap-10">
          {/* 1. At a Glance (Quick Specs) */}
          <div className="bg-bg-secondary border border-border rounded-3xl p-6 space-y-5">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {t('details.glance.title', 'At a Glance')}
            </p>
            <div className="space-y-4">
              {[
                { label: t('details.specs.year', 'Year'), value: car.year },
                { label: t('details.specs.fuel_type', 'Fuel Type'), value: t(`details.specs.${car.fuel?.toLowerCase()}`, car.fuel) },
                {
                  label: t('details.specs.payment_status', 'Payment Status'),
                  value:
                    car.duty === 'DUTY_PAID'
                      ? t('details.specs.fully_paid', 'Fully Paid')
                      : car.duty === 'DUTY_FREE'
                        ? 'Bank-Financed'
                        : 'Pending',
                },
                ...(car.certified_km
                  ? [{ label: t('details.specs.certified_km', 'Certified KM'), value: `${car.certified_km.toLocaleString()} km` }]
                  : []),
                ...(car.battery_soh_percent
                  ? [{ label: 'Battery SOH', value: `${car.battery_soh_percent}%` }]
                  : []),
                { label: t('details.specs.vin', 'VIN / Chassis'), value: car.vin_chassis },
                { label: t('details.specs.plate', 'Plate Code'), value: car.plate_code || 'PENDING' },
                ...(car.charger_type && car.charger_type !== 'NONE'
                  ? [{ label: 'Charger', value: car.charger_type }]
                  : []),
                { label: 'OS Language', value: car.software_language || 'English' },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-text-primary"
                >
                  <span className="text-sm text-text-secondary font-medium">{row.label}</span>
                  <span className="text-sm font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Technical Portfolio Spec Grid */}
          <VehicleTechnicalPortfolio car={car} />

          {/* 3. Action Block CTAs */}
          <div className="bg-bg-secondary border border-border rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t('details.price.starting_at', 'Starting at')}
              </p>
              <p className="text-3xl font-bold text-text-primary tracking-tight">
                {((car.retail_price_etb || 0) / 1000000).toFixed(2)}
                <span className="text-lg font-medium text-text-secondary ml-1.5">M ETB</span>
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setIsChatOpen(true)}
                className="w-full py-4 rounded-2xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg)' }}
              >
                {t('details.actions.contact_advisor', 'Contact an Advisor')}
              </button>
              <a
                href={`https://t.me/peacecarsbot?start=vehicle_${car.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#0088cc] text-white py-4 rounded-2xl font-semibold text-sm hover:bg-[#0077b5] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Send size={16} className="rotate-[15deg]" />
                {t('details.actions.telegram', 'Inquire on Telegram')}
              </a>
              <button
                onClick={() => setIsTradeInOpen(true)}
                className="w-full bg-bg text-text-primary py-4 rounded-2xl font-semibold text-sm border border-border hover:bg-border active:scale-[0.98] transition-all"
              >
                {t('details.actions.trade_in', 'Trade-In Estimate')}
              </button>
              <Link
                to="/community"
                className="w-full bg-accent/10 text-accent py-4 rounded-2xl font-semibold text-sm hover:bg-accent/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Users size={16} />
                {t('details.actions.community', 'Discuss in Community')}
              </Link>
            </div>

            <div className="pt-6 border-t border-border space-y-4">
              {[
                { icon: <ShieldCheck size={16} />, text: t('details.badges.integrity', 'Verified Integrity Guaranteed') },
                { icon: <CheckCircle2 size={16} />, text: t('details.badges.free_delivery', 'Free Delivery in Addis Ababa') },
                { icon: <MapPin size={16} />, text: car.branchName || t('details.badges.registry', 'Main Registry') },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="text-accent">{item.icon}</span>
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>



          {/* 5. Verification Standard */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
                {t('details.standard.title', 'The Peace Standard.')}
              </h2>
              <p className="text-sm text-text-secondary font-medium leading-relaxed">
                Clear cleared. Vetted document audits.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <ShieldCheck size={18} />, title: t('details.badges.inspected', 'Inspected'), desc: '150-point' },
                { icon: <FileCheck size={18} />, title: t('details.badges.verified', 'Verified'), desc: 'Customs' },
                { icon: <BadgeCheck size={18} />, title: t('details.badges.certified', 'Certified'), desc: 'Specialist' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-bg-secondary rounded-2xl p-4 space-y-2 border border-border text-center"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent mx-auto">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-bold text-text-primary text-[10px] md:text-xs">
                      {item.title}
                    </p>
                    <p className="text-[8px] md:text-[10px] text-text-secondary font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content (Desktop only) */}
        <div className="hidden lg:col-span-7 lg:block space-y-20">


          {/* Verification Section */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-text-primary tracking-tight">
                {t('details.standard.title', 'The Peace Standard.')}
              </h2>
              <p className="text-text-secondary font-medium leading-relaxed max-w-lg">
                Every vehicle undergoes a 150-point engineering audit and full customs clearance
                before it reaches you.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: <ShieldCheck size={22} />, title: t('details.badges.inspected', 'Inspected'), desc: '150-point audit' },
                { icon: <FileCheck size={22} />, title: t('details.badges.verified', 'Verified'), desc: 'Full documentation' },
                { icon: <BadgeCheck size={22} />, title: t('details.badges.certified', 'Certified'), desc: 'Peace guarantee' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-bg-secondary rounded-2xl p-6 space-y-4 border border-border hover:border-border-light transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{item.title}</p>
                    <p className="text-xs text-text-secondary font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Portfolio Section */}
          <div className="space-y-8 pt-12 border-t border-border">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-text-primary tracking-tight">
                {t('details.portfolio.title', 'Technical Portfolio.')}
              </h2>
              <p className="text-text-secondary font-medium leading-relaxed max-w-lg">
                Precision engineering specifications for the modern Ethiopian road.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border rounded-3xl overflow-hidden">
              {[
                { label: t('details.specs.range', 'Range'), value: car.range_km ? `${car.range_km} km` : '—' },
                {
                  label: t('details.specs.battery', 'Battery Capacity'),
                  value: car.battery_capacity_kwh ? `${car.battery_capacity_kwh} kWh` : '—',
                },
                {
                  label: t('details.specs.motor', 'Motor Power'),
                  value: car.motor_power_kw ? `${Math.round(Number(car.motor_power_kw) * 1.341)} HP` : '—',
                },
                { label: t('details.specs.drivetrain', 'Drive Train'), value: car.drive_train || '—' },
                { label: t('details.specs.interior', 'Interior'), value: car.interior_color || '—' },
                { label: t('details.specs.os_lang', 'OS Language'), value: car.software_language || 'English' },
              ].map((item) => (
                <div key={item.label} className="bg-bg p-6 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    {item.label}
                  </span>
                  <span className="text-lg font-bold text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Features list */}
            {car.features && car.features.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4">
                {car.features.map((feature: string, i: number) => (
                  <span
                    key={i}
                    className="px-4 py-2 rounded-xl bg-bg-secondary border border-border text-text-primary text-[11px] font-semibold"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (Desktop only) */}
        <div className="hidden lg:col-span-5 lg:pl-8 lg:block">
          <div className="sticky top-[120px] space-y-6">
            {/* Price Card */}
            <div className="bg-bg border border-border rounded-3xl p-8 space-y-8 shadow-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('details.price.starting_at', 'Starting at')}
                </p>
                <p className="text-4xl font-bold text-text-primary tracking-tight">
                  {((car.retail_price_etb || 0) / 1000000).toFixed(2)}
                  <span className="text-lg font-medium text-text-secondary ml-1.5">M ETB</span>
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="w-full py-4 rounded-2xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                  style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg)' }}
                >
                  {t('details.actions.contact_advisor', 'Contact an Advisor')}
                </button>
                <a
                  href={`https://t.me/peacecarsbot?start=vehicle_${car.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#0088cc] text-white py-4 rounded-2xl font-semibold text-sm hover:bg-[#0077b5] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16} className="rotate-[15deg]" />
                  {t('details.actions.telegram', 'Inquire on Telegram')}
                </a>
                <button
                  onClick={() => setIsTradeInOpen(true)}
                  className="w-full bg-bg-secondary text-text-primary py-4 rounded-2xl font-semibold text-sm border border-border hover:bg-border active:scale-[0.98] transition-all"
                >
                  {t('details.actions.trade_in', 'Trade-In Estimate')}
                </button>
                <Link
                  to="/community"
                  className="w-full bg-accent/10 text-accent py-4 rounded-2xl font-semibold text-sm hover:bg-accent/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Users size={16} />
                  {t('details.actions.community', 'Discuss in Community')}
                </Link>
              </div>

              <div className="pt-6 border-t border-border space-y-5">
                {[
                  { icon: <ShieldCheck size={16} />, text: t('details.badges.integrity', 'Verified Integrity Guaranteed') },
                  { icon: <CheckCircle2 size={16} />, text: t('details.badges.free_delivery', 'Free Delivery in Addis Ababa') },
                  { icon: <MapPin size={16} />, text: car.branchName || t('details.badges.registry', 'Main Registry') },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                    <span className="text-accent">{item.icon}</span>
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Specs */}
            <div className="bg-bg-secondary border border-border rounded-3xl p-8 space-y-5">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {t('details.glance.title', 'At a Glance')}
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Year', value: car.year },
                  { label: 'Fuel Type', value: car.fuel },
                  {
                    label: 'Payment Status',
                    value:
                      car.duty === 'DUTY_PAID'
                        ? 'Fully Paid'
                        : car.duty === 'DUTY_FREE'
                          ? 'Bank-Financed'
                          : 'Pending',
                  },
                  ...(car.certified_km
                    ? [{ label: 'Certified KM', value: `${car.certified_km.toLocaleString()} km` }]
                    : []),
                  ...(car.battery_soh_percent
                    ? [{ label: 'Battery SOH', value: `${car.battery_soh_percent}%` }]
                    : []),
                  { label: 'VIN / Chassis', value: car.vin_chassis },
                  { label: 'Plate Code', value: car.plate_code || 'PENDING' },
                  ...(car.charger_type && car.charger_type !== 'NONE'
                    ? [{ label: 'Charger', value: car.charger_type }]
                    : []),
                  { label: 'OS Language', value: car.software_language || 'English' },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 text-text-primary"
                  >
                    <span className="text-sm text-text-secondary font-medium">{row.label}</span>
                    <span className="text-sm font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Vehicles */}
      {similarVehicles.length > 0 && (
        <section
          className="border-t py-10 md:py-14"
          style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <div className="max-w-[1400px] mx-auto px-4 md:px-8">
            <div className="section-header mb-6">
              <div>
                <h2 className="section-title">{t('details.similar.title', 'You might also like')}</h2>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('details.similar.subtitle', 'Similar vehicles in our collection')}
                </p>
              </div>
              <Link to="/inventory" className="section-link flex items-center gap-1">
                View all <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
              {similarVehicles.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link to={`/inventory/${v.id}`} className="market-card group block">
                    <div className="market-card-img aspect-[4/3]">
                      <img
                        src={v.images[0]}
                        alt={`${v.year} ${v.make} ${v.model}`}
                        loading="lazy"
                      />
                    </div>
                    <div className="market-card-body">
                      <p className="market-card-price">
                        ETB {((v.retail_price_etb || 0) / 1_000_000).toFixed(2)}M
                      </p>
                      <p className="market-card-title">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="market-card-meta">Addis Ababa</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trade-In Modal */}
      <AnimatePresence>
        {isTradeInOpen && (
          <div className="fixed inset-0 z-[200] overflow-hidden flex items-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTradeInOpen(false)}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[90vh] md:m-auto md:rounded-3xl neo-card flex flex-col overflow-hidden rounded-t-3xl shadow-2xl"
              style={{ background: 'var(--color-bg-base)' }}
            >
              <div className="px-6 py-5 md:px-8 md:py-6 border-b border-border flex items-center justify-between z-10" style={{ background: 'var(--color-bg-base)' }}>
                <div>
                  <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-1">
                    {t('details.trade_in.badge', 'Equity Analysis')}
                  </p>
                  <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight">
                    {t('details.trade_in.title', 'Trade-In Estimate')}
                  </h3>
                </div>
                <button
                  onClick={() => setIsTradeInOpen(false)}
                  className="w-10 h-10 neo-inset rounded-full text-text-primary flex items-center justify-center transition-all hover:opacity-80"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar pb-24">
                {tradeInSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
                      <CheckCircle2 size={40} strokeWidth={3} />
                    </div>
                    <h3 className="text-2xl font-black text-text-primary">Request Submitted!</h3>
                    <p className="text-text-secondary font-medium">Our appraisal team will review your trade-in and contact you shortly.</p>
                  </motion.div>
                ) : (
                  <>
                    <div className="neo-inset p-4 md:p-5 rounded-2xl flex gap-5 items-center">
                      <img
                        src={images[0]}
                        className="w-24 h-16 md:w-32 md:h-20 rounded-xl object-cover"
                        style={{ boxShadow: 'var(--shadow-neo)' }}
                        alt=""
                      />
                      <div>
                        <p className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
                          Target Vehicle
                        </p>
                        <p className="text-lg md:text-xl font-black text-text-primary tracking-tight">
                          {car.make} {car.model}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <h4 className="text-sm font-black text-text-primary uppercase tracking-widest">Your Current Vehicle</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Make *</label>
                          <input type="text" value={tradeInForm.make} onChange={(e) => setTradeInForm({...tradeInForm, make: e.target.value})} placeholder="e.g. Toyota" className="w-full neo-inset rounded-xl px-4 py-3 text-sm text-text-primary font-bold focus:outline-none transition-all placeholder:text-text-muted/60" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Model *</label>
                          <input type="text" value={tradeInForm.model} onChange={(e) => setTradeInForm({...tradeInForm, model: e.target.value})} placeholder="e.g. RAV4" className="w-full neo-inset rounded-xl px-4 py-3 text-sm text-text-primary font-bold focus:outline-none transition-all placeholder:text-text-muted/60" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Year *</label>
                          <input type="number" value={tradeInForm.year} onChange={(e) => setTradeInForm({...tradeInForm, year: e.target.value})} placeholder="2022" className="w-full neo-inset rounded-xl px-4 py-3 text-sm text-text-primary font-bold focus:outline-none transition-all placeholder:text-text-muted/60" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Mileage (KM)</label>
                          <input type="number" value={tradeInForm.mileage} onChange={(e) => setTradeInForm({...tradeInForm, mileage: e.target.value})} placeholder="15000" className="w-full neo-inset rounded-xl px-4 py-3 text-sm text-text-primary font-bold focus:outline-none transition-all placeholder:text-text-muted/60" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Expected Value (ETB)</label>
                          <input type="number" value={tradeInForm.askingPrice} onChange={(e) => setTradeInForm({...tradeInForm, askingPrice: e.target.value})} placeholder="e.g. 2,500,000" className="w-full neo-inset rounded-xl px-4 py-3 text-sm text-text-primary font-bold focus:outline-none transition-all placeholder:text-text-muted/60" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Phone Number *</label>
                          <input type="tel" value={tradeInForm.contactPhone} onChange={(e) => setTradeInForm({...tradeInForm, contactPhone: e.target.value})} placeholder="+251 9..." className="w-full neo-inset rounded-xl px-4 py-3 text-sm text-text-primary font-bold focus:outline-none transition-all placeholder:text-text-muted/60" />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleTradeInSubmit}
                      disabled={isSubmittingTradeIn}
                      className="w-full py-4 mt-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      style={{ 
                        background: isSubmittingTradeIn ? 'var(--color-bg-secondary)' : 'var(--color-text-primary)', 
                        color: isSubmittingTradeIn ? 'var(--color-text-muted)' : 'var(--color-bg)',
                        boxShadow: 'var(--shadow-neo)'
                      }}
                    >
                      {isSubmittingTradeIn ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : t('details.trade_in.submit', 'Submit for Appraisal')}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Sticky Bottom Actions (Mobile Only) */}
      <div
        className="lg:hidden fixed left-0 right-0 z-[150] px-3 pointer-events-none transition-all"
        style={{
          bottom: 'calc(80px + env(safe-area-inset-bottom, 16px))',
        }}
      >
        <div 
          className="mx-auto flex w-full max-w-md items-center justify-between gap-1.5 p-1.5 rounded-[28px] pointer-events-auto border"
          style={{ 
            background: 'var(--color-bg-secondary)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderColor: 'var(--color-border)',
            boxShadow: '0 -2px 16px rgba(0,0,0,0.06), 0 8px 32px -4px rgba(0,0,0,0.10)'
          }}
        >
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex-1 h-12 rounded-[22px] font-bold text-[13px] hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ background: 'var(--color-text-primary)', color: 'var(--color-bg)' }}
          >
            {t('details.actions.contact_advisor', 'Contact Advisor')}
          </button>
          <a
            href={`https://t.me/peacecarsbot?start=vehicle_${car.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-12 bg-[#0088cc] text-white rounded-[22px] font-bold text-[13px] hover:bg-[#0077b5] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <Send size={15} className="rotate-[15deg] mb-0.5" />
            Telegram
          </a>
          <button
            onClick={() => setIsTradeInOpen(true)}
            className="w-12 h-12 rounded-[22px] transition-all flex items-center justify-center active:scale-[0.98] shrink-0"
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Trade-In"
          >
            <BarChart3 size={18} />
          </button>
        </div>
      </div>

      <ChatPortal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        vehicle={car}
        userId={session?.user?.id || ''}
      />
    </div>
  );
};

export default VehicleDetail;
