import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TextField, SelectField } from '../ui/FormControls';
import { MANUFACTURERS, BODY_TYPES, COLORS, PLATE_CODES } from '../../lib/vehicleOptions';

interface SellIdentityStepProps {
  identityForm: {
    make: string;
    model: string;
    year: string;
    bodyType: string;
    color: string;
    plateCode: string;
  };
  updateIdentity: (key: string, value: string) => void;
}

export const SellIdentityStep: React.FC<SellIdentityStepProps> = ({ identityForm, updateIdentity }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          {t('sell.steps.identity.title', 'Vehicle Identity.')}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {t('sell.steps.identity.subtitle', 'The basics of your car.')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectField
          label={t('forms.labels.manufacturer', 'Manufacturer')}
          options={[
            { value: '', label: t('sell.steps.identity.select_make', 'Select Manufacturer...') },
            ...MANUFACTURERS.map((m) => ({ value: m, label: m })),
          ]}
          value={identityForm.make}
          onChange={(e) => updateIdentity('make', e.target.value)}
          className="col-span-1 md:col-span-2"
        />
        <TextField
          label={t('forms.labels.model', 'Model')}
          placeholder={t('forms.placeholders.corolla_cross', 'e.g. Corolla Cross')}
          value={identityForm.model}
          onChange={(e) => updateIdentity('model', e.target.value)}
        />
        <TextField
          label={t('forms.labels.year', 'Year')}
          type="number"
          placeholder={t('forms.placeholders.year_2024', '2024')}
          value={identityForm.year}
          onChange={(e) => updateIdentity('year', e.target.value)}
        />
        <SelectField
          label={t('forms.labels.body_type', 'Body Type')}
          options={BODY_TYPES}
          value={identityForm.bodyType}
          onChange={(e) => updateIdentity('bodyType', e.target.value)}
        />
        <SelectField
          label={t('forms.labels.color', 'Color')}
          options={COLORS.map((c) => ({ value: c, label: c }))}
          value={identityForm.color}
          onChange={(e) => updateIdentity('color', e.target.value)}
        />
        <SelectField
          label={t('forms.labels.plate_code', 'Plate Code')}
          options={PLATE_CODES}
          value={identityForm.plateCode}
          onChange={(e) => updateIdentity('plateCode', e.target.value)}
          className="col-span-1 md:col-span-2"
        />
      </div>
    </motion.div>
  );
};
