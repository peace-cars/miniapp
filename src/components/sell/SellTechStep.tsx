import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TextField, SelectField } from '../ui/FormControls';
import { FUEL_TYPES, TRANSMISSIONS, DRIVE_TYPES, CHARGER_TYPES, SOFTWARE_LANGUAGES } from '../../lib/vehicleOptions';

interface SellTechStepProps {
  techForm: {
    fuelType: string;
    transmission: string;
    driveType: string;
    engineCc: string;
    batteryKwh: string;
    batterySoh: string;
    chargerType: string;
    mileage: string;
    vin: string;
    softwareLanguage: string;
  };
  updateTech: (key: string, value: string) => void;
}

export const SellTechStep: React.FC<SellTechStepProps> = ({ techForm, updateTech }) => {
  const { t } = useTranslation();
  const isEV = ['ELECTRIC', 'HYBRID'].includes(techForm.fuelType);

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          {t('sell.steps.specs.title', 'Technical Specs.')}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {t('sell.steps.specs.subtitle', 'Engine, drivetrain, and powertrain details.')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectField
          label={t('forms.labels.fuel_powertrain', 'Fuel / Powertrain')}
          options={FUEL_TYPES}
          value={techForm.fuelType}
          onChange={(e) => updateTech('fuelType', e.target.value)}
          className="col-span-1 md:col-span-2"
        />
        <SelectField
          label={t('forms.labels.transmission', 'Transmission')}
          options={TRANSMISSIONS}
          value={techForm.transmission}
          onChange={(e) => updateTech('transmission', e.target.value)}
        />
        <SelectField
          label={t('forms.labels.drive_type', 'Drive Type')}
          options={DRIVE_TYPES}
          value={techForm.driveType}
          onChange={(e) => updateTech('driveType', e.target.value)}
        />

        {!isEV ? (
          <TextField
            label={t('forms.labels.engine_cc', 'Engine Capacity (CC)')}
            type="number"
            placeholder={t('forms.placeholders.cc_2000', 'e.g. 2000')}
            value={techForm.engineCc}
            onChange={(e) => updateTech('engineCc', e.target.value)}
          />
        ) : (
          <>
            <TextField
              label={t('forms.labels.battery_kwh', 'Battery Capacity (kWh)')}
              type="number"
              placeholder={t('forms.placeholders.kwh_60', 'e.g. 60.5')}
              value={techForm.batteryKwh}
              onChange={(e) => updateTech('batteryKwh', e.target.value)}
            />
            <TextField
              label={t('forms.labels.battery_soh', 'Battery Health (SoH %)')}
              type="number"
              placeholder={t('forms.placeholders.soh_98', 'e.g. 98')}
              value={techForm.batterySoh}
              onChange={(e) => updateTech('batterySoh', e.target.value)}
            />
            <SelectField
              label={t('forms.labels.charger_standard', 'Charger Standard')}
              options={CHARGER_TYPES}
              value={techForm.chargerType}
              onChange={(e) => updateTech('chargerType', e.target.value)}
              className="col-span-1 md:col-span-2"
            />
          </>
        )}

        <TextField
          label={t('forms.labels.current_mileage', 'Current Mileage (KM)')}
          type="number"
          value={techForm.mileage}
          onChange={(e) => updateTech('mileage', e.target.value)}
        />
        <TextField
          label={t('forms.labels.vin', 'VIN / Chassis Number (Optional)')}
          value={techForm.vin}
          onChange={(e) => updateTech('vin', e.target.value)}
        />
        <SelectField
          label={t('forms.labels.software_lang', 'Software / Dashboard Language')}
          options={SOFTWARE_LANGUAGES}
          value={techForm.softwareLanguage}
          onChange={(e) => updateTech('softwareLanguage', e.target.value)}
          className="col-span-1 md:col-span-2"
        />
      </div>
    </motion.div>
  );
};
