import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Loader2, Lock } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTranslation } from 'react-i18next';
import { API_URL, unwrapApiResponse } from '../lib/apiClient';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { ETHIOPIAN_CITIES } from '../lib/vehicleOptions';
import { SellLanding } from '../components/sell/SellLanding';

// Step components
import { SellContactStep } from '../components/sell/SellContactStep';
import { SellIdentityStep } from '../components/sell/SellIdentityStep';
import { SellTechStep } from '../components/sell/SellTechStep';
import { SellHistoryStep } from '../components/sell/SellHistoryStep';
import { SellPhotosStep } from '../components/sell/SellPhotosStep';
import { SellReviewStep } from '../components/sell/SellReviewStep';
import { SellSuccessStep } from '../components/sell/SellSuccessStep';

const Sell = () => {
  const { t } = useTranslation();
  const { session, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Locations state
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  // Forms state
  const [photos, setPhotos] = useState<string[]>([]);
  const [financingRequested, setFinancingRequested] = useState(false);

  const [contactForm, setContactForm] = useState({
    fullName: '',
    contactPhone: '',
    contactCity: ETHIOPIAN_CITIES[0] || 'Addis Ababa',
  });

  const [identityForm, setIdentityForm] = useState({
    make: '', model: '', year: '', bodyType: 'SUV', color: 'White', plateCode: 'CODE_2',
  });

  const [techForm, setTechForm] = useState({
    fuelType: 'PETROL', transmission: 'AUTOMATIC', driveType: 'AWD',
    engineCc: '', batteryKwh: '', batterySoh: '', chargerType: 'NONE',
    mileage: '', vin: '', softwareLanguage: 'ENGLISH',
  });

  const [historyForm, setHistoryForm] = useState({
    dutyStatus: 'DUTY_PAID', libreStatus: 'CLEAN', numOwners: '1ST',
    accidentHistory: 'NONE', insuranceStatus: 'COMPREHENSIVE', importOrigin: 'LOCAL', askingPrice: '',
  });

  const [notesForm, setNotesForm] = useState({ locationId: '', description: '' });

  useEffect(() => {
    if (!session) return;
    if (session.profile) {
      setContactForm((prev) => ({
        ...prev,
        fullName: session.profile.full_name || prev.fullName,
        contactPhone: session.profile.phone_number || prev.contactPhone,
      }));
    }

    setIsLoadingLocations(true);
    fetch(`${API_URL}/locations/public`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Network response was not ok');
        const json = await r.json();
        return unwrapApiResponse(json);
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setLocations(data);
          setLocationsError(null);
        } else {
          setLocationsError('Invalid branch data received');
        }
      })
      .catch((err) => {
        console.error('Failed to load branches:', err);
        setLocationsError('Failed to load branches');
      })
      .finally(() => {
        setIsLoadingLocations(false);
      });
  }, [session]);

  const updateContact = (k: string, v: string) => setContactForm((p) => ({ ...p, [k]: v }));
  const updateIdentity = (k: string, v: string) => setIdentityForm((p) => ({ ...p, [k]: v }));
  const updateTech = (k: string, v: string) => setTechForm((p) => ({ ...p, [k]: v }));
  const updateHistory = (k: string, v: string) => setHistoryForm((p) => ({ ...p, [k]: v }));
  const updateNotes = (k: string, v: string) => setNotesForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!session || !notesForm.locationId) return;

    setIsSubmitting(true);
    try {
      const vehicleDetails = {
        body_type: identityForm.bodyType, color: identityForm.color,
        fuel_type: techForm.fuelType, transmission: techForm.transmission,
        drive_type: techForm.driveType,
        engine_cc: techForm.fuelType === 'ELECTRIC' ? null : Number(techForm.engineCc) || null,
        battery_kwh: ['ELECTRIC', 'HYBRID'].includes(techForm.fuelType) ? Number(techForm.batteryKwh) || null : null,
        battery_soh: ['ELECTRIC', 'HYBRID'].includes(techForm.fuelType) ? Number(techForm.batterySoh) || null : null,
        charger_type: ['ELECTRIC', 'HYBRID'].includes(techForm.fuelType) ? techForm.chargerType : null,
        software_language: techForm.softwareLanguage, duty_status: historyForm.dutyStatus,
        libre_status: historyForm.libreStatus, num_owners: historyForm.numOwners,
        accident_history: historyForm.accidentHistory, insurance_status: historyForm.insuranceStatus,
        import_origin: historyForm.importOrigin, mileage: Number(techForm.mileage) || 0,
        vin: techForm.vin || null,
      };

      const res = await fetch(`${API_URL}/trade-in-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          vehicleMakeModel: `${identityForm.year} ${identityForm.make} ${identityForm.model}`,
          carDescription: `${notesForm.description}\nPlate: ${identityForm.plateCode}`,
          askingPrice: Number(historyForm.askingPrice.toString().replace(/,/g, '')),
          locationId: notesForm.locationId,
          photos: photos,
          financingRequested: financingRequested,
          vehicleDetails: vehicleDetails,
          contactPhone: contactForm.contactPhone,
          contactCity: contactForm.contactCity,
        }),
      });

      if (res.ok) setStep(7);
      else {
        const errorData = unwrapApiResponse(await res.json());
        alert(`Submission failed: ${errorData?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Network error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNextDisabled = () => {
    switch (step) {
      case 1: return !contactForm.fullName || !contactForm.contactPhone || !contactForm.contactCity;
      case 2: return !identityForm.make || !identityForm.model || !identityForm.year;
      case 3: return !techForm.mileage;
      case 4: return !historyForm.askingPrice;
      case 5: return !notesForm.locationId || photos.length === 0;
      default: return false;
    }
  };

  const getNextLabel = () => {
    if (step === 1) return t('sell.nav.vehicle_details', 'Vehicle Details');
    if (step === 5) return t('sell.nav.review_details', 'Review Details');
    if (step === 6) return isSubmitting ? t('sell.actions.submitting', 'Submitting...') : t('sell.actions.confirm', 'Confirm & Submit');
    return t('sell.actions.continue', 'Continue');
  };

  const handleNext = () => {
    if (step === 6) handleSubmit();
    else setStep((p) => Math.min(p + 1, 6));
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Loader2 className="animate-spin" style={{ color: 'var(--color-text-primary)' }} />
      </div>
    );

  if (showLanding) return <SellLanding onStart={() => setShowLanding(false)} />;

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8" style={{ background: 'var(--color-bg)' }}>
        <Lock size={64} style={{ color: 'var(--color-text-primary)' }} />
        <div className="space-y-4 max-w-sm">
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            {t('sell.auth.title', 'Identity Verification.')}
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            {t('sell.auth.subtitle', 'Please sign in to securely submit your vehicle for a professional appraisal.')}
          </p>
        </div>
        <Link to="/login" className="w-full max-w-xs">
          <Button variant="primary" size="lg" className="w-full py-4" style={{ background: 'var(--color-accent)' }}>
            {t('sell.auth.sign_in', 'Sign In to Continue')}
          </Button>
        </Link>
      </div>
    );
  }

  const floatingBottomBar = step < 7 && (
    <div className="fixed bottom-[72px] left-0 right-0 px-4 md:px-6 z-[90] pointer-events-none">
      <div className="max-w-3xl mx-auto flex items-center justify-between p-2 rounded-2xl border shadow-2xl pointer-events-auto"
        style={{ background: 'var(--color-bg-secondary)', backdropFilter: 'blur(24px)', borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setStep((p) => Math.max(p - 1, 1))}
          disabled={step === 1 || isSubmitting}
          className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all hover:bg-bg', step === 1 && 'opacity-0 pointer-events-none')}
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {t('common.back', 'Back')}
        </button>

        <button
          onClick={handleNext}
          disabled={getNextDisabled() || isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all active:scale-95"
          style={{
            background: getNextDisabled() || isSubmitting ? 'var(--color-bg-secondary)' : step === 6 ? 'var(--color-text-primary)' : 'var(--color-accent)',
            color: getNextDisabled() || isSubmitting ? 'var(--color-text-muted)' : '#fff',
            cursor: getNextDisabled() || isSubmitting ? 'not-allowed' : 'pointer',
            border: getNextDisabled() ? '1px solid var(--color-border)' : 'none',
          }}
        >
          {isSubmitting && step === 6 && <Loader2 size={16} className="animate-spin" />}
          {getNextLabel()}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-x-0 overflow-hidden" style={{ top: 0, bottom: 0, background: 'var(--color-bg-secondary)', paddingTop: 80, paddingBottom: 72 }}>
      {step < 7 && (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5, 6].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-300"
                    style={{
                      background: step >= s ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                      color: step >= s ? '#fff' : 'var(--color-text-muted)',
                      border: `2px solid ${step >= s ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    }}>
                    {step > s ? '✓' : s}
                  </div>
                </div>
                {i < 5 && <div className="flex-1 h-0.5 mx-1 transition-all duration-500" style={{ background: step > s ? 'var(--color-accent)' : 'var(--color-border)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'none', paddingBottom: 80 }}>
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className={cn(step < 7 ? 'py-4' : '')}>
            <AnimatePresence mode="wait">
              {step === 1 && <SellContactStep contactForm={contactForm} updateContact={updateContact} />}
              {step === 2 && <SellIdentityStep identityForm={identityForm} updateIdentity={updateIdentity} />}
              {step === 3 && <SellTechStep techForm={techForm} updateTech={updateTech} />}
              {step === 4 && <SellHistoryStep historyForm={historyForm} updateHistory={updateHistory} />}
              {step === 5 && (
                <SellPhotosStep
                  notesForm={notesForm} updateNotes={updateNotes}
                  photos={photos} setPhotos={setPhotos}
                  financingRequested={financingRequested} setFinancingRequested={setFinancingRequested}
                  locations={locations} isLoadingLocations={isLoadingLocations} locationsError={locationsError}
                />
              )}
              {step === 6 && (
                <SellReviewStep
                  contactForm={contactForm} identityForm={identityForm} techForm={techForm}
                  historyForm={historyForm} setStep={setStep}
                />
              )}
              {step === 7 && <SellSuccessStep />}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {floatingBottomBar}
    </div>
  );
};

export default Sell;
