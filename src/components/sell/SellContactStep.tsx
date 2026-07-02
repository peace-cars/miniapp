import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TextField, SelectField } from '../ui/FormControls';
import { ETHIOPIAN_CITIES } from '../../lib/vehicleOptions';

interface SellContactStepProps {
  contactForm: {
    fullName: string;
    contactPhone: string;
    contactCity: string;
  };
  updateContact: (key: string, value: string) => void;
}

export const SellContactStep: React.FC<SellContactStepProps> = ({ contactForm, updateContact }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          {t('sell.steps.contact.title', 'Contact Information.')}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {t('sell.steps.contact.subtitle', 'How should we reach you with your valuation?')}
        </p>
      </div>
      <div className="space-y-3">
        <TextField
          label={t('forms.labels.full_name', 'Full Name')}
          value={contactForm.fullName}
          onChange={(e) => updateContact('fullName', e.target.value)}
        />
        <TextField
          label={t('forms.labels.phone_number', 'Phone Number')}
          placeholder={t('forms.placeholders.phone', '+251 9...')}
          value={contactForm.contactPhone}
          onChange={(e) => updateContact('contactPhone', e.target.value)}
        />
        <SelectField
          label={t('forms.labels.city_region', 'City / Region')}
          options={ETHIOPIAN_CITIES.map((c) => ({ value: c, label: c }))}
          value={contactForm.contactCity}
          onChange={(e) => updateContact('contactCity', e.target.value)}
        />
      </div>
    </motion.div>
  );
};
