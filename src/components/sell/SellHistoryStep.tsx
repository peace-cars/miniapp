import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TextField, SelectField } from '../ui/FormControls';
import {
  PAYMENT_STATUSES,
  LIBRE_STATUSES,
  OWNER_COUNTS,
  ACCIDENT_HISTORY,
  INSURANCE_STATUSES,
  IMPORT_ORIGINS,
} from '../../lib/vehicleOptions';

interface SellHistoryStepProps {
  historyForm: {
    dutyStatus: string;
    libreStatus: string;
    numOwners: string;
    accidentHistory: string;
    insuranceStatus: string;
    importOrigin: string;
    askingPrice: string;
  };
  updateHistory: (key: string, value: string) => void;
}

export const SellHistoryStep: React.FC<SellHistoryStepProps> = ({ historyForm, updateHistory }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          {t('sell.steps.history.title', 'Legal & History.')}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {t('sell.steps.history.subtitle', 'Crucial details for accurate pricing in Ethiopia.')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectField
          label={t('forms.labels.payment_status', 'Payment Status')}
          options={PAYMENT_STATUSES}
          value={historyForm.dutyStatus}
          onChange={(e) => updateHistory('dutyStatus', e.target.value)}
        />
        <SelectField
          label={t('forms.labels.libre_status', 'Libre (Title) Status')}
          options={LIBRE_STATUSES}
          value={historyForm.libreStatus}
          onChange={(e) => updateHistory('libreStatus', e.target.value)}
        />
        <SelectField
          label={t('forms.labels.ownership_history', 'Ownership History')}
          options={OWNER_COUNTS}
          value={historyForm.numOwners}
          onChange={(e) => updateHistory('numOwners', e.target.value)}
        />
        <SelectField
          label={t('forms.labels.accident_history', 'Accident History')}
          options={ACCIDENT_HISTORY}
          value={historyForm.accidentHistory}
          onChange={(e) => updateHistory('accidentHistory', e.target.value)}
        />
        <SelectField
          label={t('forms.labels.insurance_status', 'Insurance Status')}
          options={INSURANCE_STATUSES}
          value={historyForm.insuranceStatus}
          onChange={(e) => updateHistory('insuranceStatus', e.target.value)}
        />
        <SelectField
          label={t('forms.labels.import_origin', 'Import Origin')}
          options={IMPORT_ORIGINS}
          value={historyForm.importOrigin}
          onChange={(e) => updateHistory('importOrigin', e.target.value)}
        />
        <div className="col-span-1 md:col-span-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <TextField
            label={t('forms.labels.asking_price', 'Your Asking Price (ETB)')}
            type="number"
            placeholder={t('forms.placeholders.price_etb', 'e.g. 5,000,000')}
            value={historyForm.askingPrice}
            onChange={(e) => updateHistory('askingPrice', e.target.value)}
          />
        </div>
      </div>
    </motion.div>
  );
};
