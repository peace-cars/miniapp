import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MapPin, DollarSign, CheckCircle2 } from 'lucide-react';
import ImageUpload from '../ImageUpload';
import { TextAreaField } from '../ui/FormControls';

interface SellPhotosStepProps {
  notesForm: {
    locationId: string;
    description: string;
  };
  updateNotes: (key: string, value: string) => void;
  photos: string[];
  setPhotos: (photos: string[]) => void;
  financingRequested: boolean;
  setFinancingRequested: (val: boolean) => void;
  locations: any[];
  isLoadingLocations: boolean;
  locationsError: string | null;
}

export const SellPhotosStep: React.FC<SellPhotosStepProps> = ({
  notesForm,
  updateNotes,
  photos,
  setPhotos,
  financingRequested,
  setFinancingRequested,
  locations,
  isLoadingLocations,
  locationsError,
}) => {
  const { t } = useTranslation();

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          {t('sell.steps.photos.title', 'Photos & Location.')}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {t('sell.steps.photos.subtitle', 'Provide a few images and choose your nearest branch.')}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('forms.labels.vehicle_photos', 'Vehicle Photos (Max 10)')}
          </label>
          <ImageUpload
            bucket="listings"
            folder="sell"
            maxFiles={10}
            onUploadComplete={(urls) => setPhotos([...photos, ...urls])}
          />
        </div>

        <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <label className="block text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {t('forms.labels.dropoff_location', 'Select Drop-off Branch')}
          </label>

          {isLoadingLocations ? (
            <div className="p-4 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {t('common.loading', 'Loading branches...')}
            </div>
          ) : locationsError ? (
            <div className="p-4 text-center text-sm text-red-500">
              {locationsError}
            </div>
          ) : locations.length === 0 ? (
            <div className="p-4 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {t('sell.steps.photos.no_branches', 'No active branches available.')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {locations.map((loc: any) => (
                <button
                  key={loc.id}
                  onClick={() => updateNotes('locationId', loc.id)}
                  className="flex flex-col text-left p-4 rounded-xl border transition-all active:scale-[0.98]"
                  style={{
                    borderColor:
                      notesForm.locationId === loc.id
                        ? 'var(--color-accent)'
                        : 'var(--color-border)',
                    background:
                      notesForm.locationId === loc.id
                        ? 'var(--color-bg-secondary)'
                        : 'transparent',
                  }}
                >
                  <MapPin
                    size={20}
                    className="mb-2"
                    style={{
                      color:
                        notesForm.locationId === loc.id
                          ? 'var(--color-accent)'
                          : 'var(--color-text-secondary)',
                    }}
                  />
                  <h4 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {loc.name}
                  </h4>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {loc.address || loc.district_id || 'PeaceCars Branch'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setFinancingRequested(!financingRequested)}
          className="w-full p-6 rounded-xl border flex items-center justify-between transition-all"
          style={{
            borderColor: financingRequested ? 'var(--color-accent)' : 'var(--color-border)',
            background: financingRequested ? 'var(--color-accent-light)' : 'transparent',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: financingRequested ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                color: financingRequested ? '#fff' : 'var(--color-text-primary)',
              }}
            >
              <DollarSign size={18} />
            </div>
            <div className="text-left">
              <h4 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {t('forms.sell_step5.request_financing', 'Request Trade-In Financing')}
              </h4>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {t('forms.sell_step5.financing_desc', 'Evaluate for a new vehicle upgrade loan.')}
              </p>
            </div>
          </div>
          <div
            className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
            style={{
              borderColor: financingRequested ? 'var(--color-accent)' : 'var(--color-border)',
              background: financingRequested ? 'var(--color-accent)' : 'transparent',
            }}
          >
            {financingRequested && <CheckCircle2 size={14} color="#fff" strokeWidth={3} />}
          </div>
        </button>

        <TextAreaField
          label={t('forms.labels.additional_notes', 'Additional Notes for Inspector')}
          placeholder={t('forms.placeholders.notes', 'Any scratches, missing tools, or recent repairs?')}
          value={notesForm.description}
          onChange={(e) => updateNotes('description', e.target.value)}
        />
      </div>
    </motion.div>
  );
};
