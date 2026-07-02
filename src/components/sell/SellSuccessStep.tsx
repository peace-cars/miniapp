import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export const SellSuccessStep: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      key="step7"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
    >
      <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-8">
        <CheckCircle2 size={48} className="text-green-500" />
      </div>
      <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        {t('sell.success.title', 'Request Submitted')}
      </h2>
      <p className="text-lg max-w-md mb-8" style={{ color: 'var(--color-text-secondary)' }}>
        {t('sell.success.subtitle', "Our valuation team will review your vehicle's details. You can track the status in your portal.")}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link to="/portal" className="flex-1">
          <Button variant="primary" className="w-full flex justify-center items-center gap-2">
            {t('sell.actions.track', 'Track Status')} <ArrowRight size={18} />
          </Button>
        </Link>
        <Link to="/inventory" className="flex-1">
          <Button variant="ghost" className="w-full font-bold" style={{ color: 'var(--color-accent)' }}>
            {t('sell.actions.return', 'Return to Showroom')}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};
