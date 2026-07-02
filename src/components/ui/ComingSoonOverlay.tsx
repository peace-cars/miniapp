import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonOverlayProps {
  featureName: string;
}

/**
 * A full-page glassmorphism overlay rendered on top of the existing page.
 * The page itself renders normally behind the overlay (all layout/nav intact).
 */
export function ComingSoonOverlay({ featureName }: ComingSoonOverlayProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
      style={{
        background: 'rgba(var(--color-bg-rgb, 255 255 255) / 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Glass card */}
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="mx-4 max-w-sm w-full rounded-[32px] overflow-hidden border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/[0.08] shadow-[0_32px_80px_-16px_rgba(15,23,42,0.25)] dark:shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-8 flex flex-col items-center gap-6 text-center"
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-primary-main/20 to-primary-main/5 border border-primary-main/20 flex items-center justify-center shadow-lg shadow-primary-main/10">
          <Rocket size={36} className="text-primary-main" strokeWidth={1.5} />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-[22px] font-black text-text-main tracking-tight">
            {featureName}
          </h2>
          <p className="text-[13px] font-medium leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            We're putting the finishing touches on this feature.<br />
            It'll be ready very soon!
          </p>
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-primary-main/10 text-primary-main border border-primary-main/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-main animate-pulse" />
          Coming Soon
        </span>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all active:scale-95"
          style={{
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <ArrowLeft size={15} />
          Go Back
        </button>
      </motion.div>
    </motion.div>
  );
}
