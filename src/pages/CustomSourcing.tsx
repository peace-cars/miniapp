import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Car, DollarSign, Clock, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { useTranslation } from 'react-i18next';

const FIELD = 'w-full neo-inset rounded-xl p-3 outline-none transition-all text-sm';
const FIELD_COLOR = { color: 'var(--color-text-primary)' };
const LABEL = 'block text-sm font-semibold mb-1.5';

export default function CustomSourcing() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    min_year: 2015,
    max_year: 2024,
    max_mileage: '',
    transmission: '',
    fuel_type: '',
    max_budget: '',
    payment_method: 'Cash',
    must_have_features: '',
    exterior_colors: '',
    urgency: 'Within 1 month',
    contact_name: session?.profile?.full_name || '',
    contact_email: session?.user?.email || '',
    contact_phone: session?.profile?.phone_number || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateStep = (): boolean => {
    setStepError(null);
    if (step === 1) {
      if (!formData.make.trim()) { setStepError('Please enter the vehicle Make (e.g. Toyota).'); return false; }
      if (!formData.model.trim()) { setStepError('Please enter the vehicle Model (e.g. RAV4).'); return false; }
      if (!formData.min_year || Number(formData.min_year) < 1990) { setStepError('Please enter a valid Min Year.'); return false; }
      if (!formData.max_year || Number(formData.max_year) < Number(formData.min_year)) { setStepError('Max Year must be ≥ Min Year.'); return false; }
    }
    if (step === 2) {
      if (!formData.max_budget || Number(formData.max_budget) <= 0) { setStepError('Please enter your maximum budget.'); return false; }
    }
    if (step === 3) {
      if (!formData.contact_name.trim()) { setStepError('Please enter your full name.'); return false; }
      if (!formData.contact_phone.trim()) { setStepError('Please enter your phone number.'); return false; }
    }
    return true;
  };

  const nextStep = () => { if (!validateStep()) return; setStep(p => Math.min(p + 1, 3)); };
  const prevStep = () => { setStepError(null); setStep(p => Math.max(p - 1, 1)); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!session) { navigate('/login?redirect=/custom-sourcing'); return; }
    setIsSubmitting(true);
    try {
      await apiClient.post('/sourcing-requests', {
        ...formData,
        min_year: parseInt(formData.min_year.toString(), 10),
        max_year: parseInt(formData.max_year.toString(), 10),
        max_mileage: formData.max_mileage ? parseInt(formData.max_mileage.toString(), 10) : null,
        max_budget: parseFloat(formData.max_budget.toString()),
        must_have_features: formData.must_have_features.split(',').map(f => f.trim()).filter(Boolean),
        exterior_colors: formData.exterior_colors.split(',').map(c => c.trim()).filter(Boolean),
      });
      navigate('/sourcing');
    } catch (err) {
      console.error(err);
      setStepError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: t('sell.steps.identity.title', 'Vehicle Identity').replace('.', ''), icon: Car },
    { num: 2, label: t('forms.labels.max_budget', 'Budget'), icon: DollarSign },
    { num: 3, label: t('sell.steps.contact.title', 'Contact Information').replace('.', ''), icon: Clock },
  ];

  return (
    <div
      className="fixed inset-x-0 overflow-hidden flex flex-col"
      style={{
        top: 0,
        bottom: 0,
        background: 'var(--color-bg-secondary)',
        paddingTop: 80,
        paddingBottom: 72,
      }}
    >
      {/* Step indicator - fixed top */}
      <div className="max-w-3xl mx-auto w-full px-4 pt-2 pb-2 shrink-0">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: step >= s.num ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                    color: step >= s.num ? '#fff' : 'var(--color-text-muted)',
                    border: `2px solid ${step >= s.num ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className="text-[10px] font-bold" style={{ color: step >= s.num ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 mb-4 transition-all duration-500"
                  style={{ background: step > s.num ? 'var(--color-accent)' : 'var(--color-border)' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form content - scrollable */}
      <div className="flex-1 overflow-y-auto px-4" style={{ scrollbarWidth: 'none', paddingBottom: 80 }}>
        <div className="max-w-3xl mx-auto">
          <div className="py-4 my-2">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>Step 1 of 3</p>
                  <h2 className="text-2xl font-black mb-4" style={{ color: 'var(--color-text-primary)' }}>{t('sell.steps.identity.title', 'Vehicle Identity.')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>{t('forms.labels.make', 'Make *')}</label>
                      <input name="make" required value={formData.make} onChange={handleChange} placeholder={t('forms.placeholders.toyota', 'e.g. Toyota')} className={FIELD} style={FIELD_COLOR} />
                    </div>
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>{t('forms.labels.model', 'Model *')}</label>
                      <input name="model" required value={formData.model} onChange={handleChange} placeholder={t('forms.placeholders.rav4', 'e.g. RAV4')} className={FIELD} style={FIELD_COLOR} />
                    </div>
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>{t('forms.labels.min_year', 'Min Year *')}</label>
                      <input type="number" name="min_year" required value={formData.min_year} onChange={handleChange} className={FIELD} style={FIELD_COLOR} />
                    </div>
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>{t('forms.labels.max_year', 'Max Year *')}</label>
                      <input type="number" name="max_year" required value={formData.max_year} onChange={handleChange} className={FIELD} style={FIELD_COLOR} />
                    </div>
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>{t('forms.labels.current_mileage', 'Current Mileage')} (optional)</label>
                      <input type="number" name="max_mileage" value={formData.max_mileage} onChange={handleChange} placeholder="e.g. 50000" className={FIELD} style={FIELD_COLOR} />
                    </div>
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>{t('forms.labels.transmission', 'Transmission')}</label>
                      <select name="transmission" value={formData.transmission} onChange={handleChange} className={FIELD} style={FIELD_COLOR}>
                        <option value="">Any</option>
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>Step 2 of 3</p>
                  <h2 className="text-2xl font-black mb-4" style={{ color: 'var(--color-text-primary)' }}>Budget & Preferences</h2>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>{t('forms.labels.max_budget', 'Max Budget (ETB or USD) *')}</label>
                      <input type="number" name="max_budget" required value={formData.max_budget} onChange={handleChange} placeholder={t('forms.placeholders.budget_35m', 'e.g. 3,500,000')} className={FIELD} style={FIELD_COLOR} />
                    </div>
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>Payment Method</label>
                      <select name="payment_method" value={formData.payment_method} onChange={handleChange} className={FIELD} style={FIELD_COLOR}>
                        <option value="Cash">Cash</option>
                        <option value="Finance">Financing / Loan</option>
                        <option value="Trade-in">Trade-In</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>{t('forms.labels.specific_features', 'Specific features or requirements?')} <span className="font-normal opacity-60">(comma separated)</span></label>
                      <input name="must_have_features" value={formData.must_have_features} onChange={handleChange} placeholder={t('forms.placeholders.features', 'e.g. Sunroof, Leather seats, Backup camera')} className={FIELD} style={FIELD_COLOR} />
                    </div>
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>{t('forms.labels.preferred_colors', 'Preferred Colors (Comma separated)')} <span className="font-normal opacity-60">(comma separated)</span></label>
                      <input name="exterior_colors" value={formData.exterior_colors} onChange={handleChange} placeholder="e.g. Black, White, Silver" className={FIELD} style={FIELD_COLOR} />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>Step 3 of 3</p>
                  <h2 className="text-2xl font-black mb-4" style={{ color: 'var(--color-text-primary)' }}>{t('sell.steps.contact.title', 'Contact Information.')}</h2>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>{t('forms.labels.urgency', 'How soon do you need it?')}</label>
                      <select name="urgency" value={formData.urgency} onChange={handleChange} className={FIELD} style={FIELD_COLOR}>
                        <option value="ASAP">ASAP — ready to buy today</option>
                        <option value="Within 1 month">Within 1 month</option>
                        <option value="1-3 months">1–3 months</option>
                        <option value="Just exploring">Just exploring</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>{t('forms.labels.full_name', 'Full Name *')}</label>
                      <input required name="contact_name" value={formData.contact_name} onChange={handleChange} className={FIELD} style={FIELD_COLOR} />
                    </div>
                    <div>
                      <label className={LABEL} style={{ color: 'var(--color-text-secondary)' }}>{t('forms.labels.phone_number', 'Phone Number *')}</label>
                      <input required type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} placeholder={t('forms.placeholders.phone', '+251 9...')} className={FIELD} style={FIELD_COLOR} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating bottom action bar */}
      <div className="fixed bottom-[72px] left-0 right-0 px-4 md:px-6 z-[90] pointer-events-none">
        <div
          className="max-w-3xl mx-auto flex items-center justify-between p-2 rounded-2xl border shadow-2xl pointer-events-auto"
          style={{
            background: 'var(--color-bg-secondary)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderColor: 'var(--color-border)',
          }}
        >
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-[var(--color-bg)]'
            }`}
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ChevronLeft size={16} strokeWidth={3} /> {t('common.back', 'Back')}
          </button>

          <div className="relative flex items-center gap-2">
            {stepError && (
              <span className="text-[11px] font-bold text-red-500 whitespace-nowrap absolute -top-9 right-0 bg-red-50/80 dark:bg-red-900/30 px-3 py-1 rounded-full backdrop-blur-sm border border-red-200/30">
                {stepError}
              </span>
            )}

            {/* Derive disabled state */}
            {(() => {
              const isNextDisabled = step === 1
                ? !formData.make.trim() || !formData.model.trim() || !formData.min_year || !formData.max_year
                : step === 2
                ? !formData.max_budget
                : !formData.contact_name.trim() || !formData.contact_phone.trim();

              return step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isNextDisabled}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-sm active:scale-95 transition-all"
                  style={{
                    background: isNextDisabled ? 'var(--color-bg-secondary)' : 'var(--color-accent)',
                    color: isNextDisabled ? 'var(--color-text-muted)' : '#fff',
                    cursor: isNextDisabled ? 'not-allowed' : 'pointer',
                    border: isNextDisabled ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  {t('common.next', 'Next')} <ChevronRight size={16} strokeWidth={3} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.contact_name.trim() || !formData.contact_phone.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition-all"
                  style={{
                    background: (isSubmitting || !formData.contact_name.trim() || !formData.contact_phone.trim())
                      ? 'var(--color-bg-secondary)'
                      : 'var(--color-accent)',
                    color: (isSubmitting || !formData.contact_name.trim() || !formData.contact_phone.trim())
                      ? 'var(--color-text-muted)'
                      : '#fff',
                    cursor: (isSubmitting || !formData.contact_name.trim() || !formData.contact_phone.trim())
                      ? 'not-allowed'
                      : 'pointer',
                    border: (!formData.contact_name.trim() || !formData.contact_phone.trim()) ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  {isSubmitting && step === 3 && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {step === 3 ? (isSubmitting ? t('sell.actions.submitting', 'Submitting...') : t('common.submit', 'Submit Request')) : t('common.next', 'Next')} <ChevronRight size={16} strokeWidth={3} />
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
