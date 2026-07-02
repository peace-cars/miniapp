import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Edit3 } from 'lucide-react';
import { Button } from '../ui/Button';

interface SellReviewStepProps {
  contactForm: any;
  identityForm: any;
  techForm: any;
  historyForm: any;
  setStep: (step: number) => void;
}

export const SellReviewStep: React.FC<SellReviewStepProps> = ({
  contactForm,
  identityForm,
  techForm,
  historyForm,
  setStep,
}) => {
  const { t } = useTranslation();

  return (
    <motion.div
      key="step6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          {t('sell.steps.review.title', 'Review & Submit.')}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {t('sell.steps.review.subtitle', 'Please verify your vehicle details before finalizing.')}
        </p>
      </div>

      <div className="rounded-xl p-8 space-y-8" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="flex justify-between items-start border-b pb-6" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <p className="text-sm font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              {t('forms.sell_step6.target_valuation', 'Target Valuation')}
            </p>
            <p className="text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {Number(historyForm.askingPrice || 0).toLocaleString()} ETB
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStep(4)}>
            <Edit3 size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <p className="text-xs mb-1 uppercase font-bold tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
              {t('forms.sell_step6.vehicle', 'Vehicle')}
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {identityForm.year} {identityForm.make} {identityForm.model}
            </p>
          </div>
          <div>
            <p className="text-xs mb-1 uppercase font-bold tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
              {t('forms.sell_step6.fuel_trans', 'Fuel & Trans')}
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {techForm.fuelType}, {techForm.transmission}
            </p>
          </div>
          <div>
            <p className="text-xs mb-1 uppercase font-bold tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
              {t('forms.sell_step6.mileage', 'Mileage')}
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {Number(techForm.mileage || 0).toLocaleString()} KM
            </p>
          </div>
          <div>
            <p className="text-xs mb-1 uppercase font-bold tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
              {t('forms.sell_step6.duty', 'Duty')}
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {historyForm.dutyStatus.replace('_', ' ')}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs mb-1 uppercase font-bold tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
              {t('forms.sell_step6.contact', 'Contact')}
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {contactForm.fullName} ({contactForm.contactPhone})
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
