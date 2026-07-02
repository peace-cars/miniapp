import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PackageSearch, ArrowRight, ShieldCheck, Check, 
  HelpCircle, Globe, Plane, Camera
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';
import { apiClient } from '../lib/apiClient';

const STEPS = [
  { id: 'specs', title: 'Vehicle Specs' },
  { id: 'budget', title: 'Import Terms' },
  { id: 'contact', title: 'Personal Info' }
];

export default function CustomOrder() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    yearRange: '2022-2025',
    fuelType: 'ELECTRIC',
    budget: '',
    dutyStatus: 'DUTY_PAID',
    notes: '',
    name: '',
    phone: '',
    photos: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < STEPS.length - 1) {
      nextStep();
    } else {
      setSubmitting(true);
      try {
        await apiClient.post('/sourcing-requests', {
          make: formData.make,
          model: formData.model,
          min_year: parseInt(formData.yearRange.split('-')[0]) || 2022,
          max_year: parseInt(formData.yearRange.split('-')[1]) || 2025,
          fuel_type: formData.fuelType,
          max_budget: parseFloat(formData.budget),
          payment_method: formData.dutyStatus,
          notes: formData.notes,
          urgency: 'MEDIUM',
          contact_name: formData.name,
          contact_email: 'placeholder@email.com',
          contact_phone: formData.phone,
          photos: formData.photos
        });
        setIsSubmitted(true);
      } catch (err) {
        console.error('Failed to submit request', err);
        alert('Failed to submit. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-8 max-w-md"
        >
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-600 mx-auto">
            <Check size={48} strokeWidth={3} />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-text-primary tracking-tight">Request Received.</h1>
            <p className="text-lg text-text-secondary font-medium">
              Our sourcing team has been notified. We will review your requirements and contact you within 24 hours with a preliminary availability report.
            </p>
          </div>
          <div className="pt-6">
            <Link to="/inventory" className="peace-btn-primary px-8 py-3">
              Back to Collection
            </Link>
          </div>
          <div className="pt-10 flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Inquiry ID</p>
              <p className="text-sm font-mono font-bold text-text-primary">PC-{Math.random().toString(36).substring(7).toUpperCase()}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Status</p>
              <p className="text-sm font-bold text-accent">Reviewing</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-10 md:pb-16 bg-bg-secondary border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bg border border-border text-accent text-xs font-bold shadow-sm">
            <PackageSearch size={14} /> Custom Sourcing Service
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-text-primary tracking-tight leading-[1.1]">
            Didn't find your match? <br/>
            Let us source it for you.
          </h1>
          <p className="text-lg md:text-xl text-text-secondary font-medium max-w-2xl mx-auto">
            Direct access to global auction houses and exclusive dealership networks. 
            Vetted and imported by PeaceCars.
          </p>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 mt-16">
        
        {/* Form Column */}
        <div className="lg:col-span-7">
          {/* Progress bar */}
          <div className="flex items-center gap-4 mb-12">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex-1 flex flex-col gap-2">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${
                  i <= currentStep ? 'bg-accent' : 'bg-border'
                }`} />
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  i === currentStep ? 'text-accent' : 'text-text-secondary'
                }`}>{s.title}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Make</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Toyota"
                        value={formData.make}
                        onChange={e => setFormData({...formData, make: e.target.value})}
                        className="w-full bg-bg-secondary border border-border rounded-2xl px-6 py-4 font-semibold text-text-primary focus:ring-2 focus:ring-accent/30 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Model</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. BZ4X"
                        value={formData.model}
                        onChange={e => setFormData({...formData, model: e.target.value})}
                        className="w-full bg-bg-secondary border border-border rounded-2xl px-6 py-4 font-semibold text-text-primary focus:ring-2 focus:ring-accent/30 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Preferred Powertrain</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['ELECTRIC', 'HYBRID', 'PETROL', 'DIESEL'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({...formData, fuelType: type})}
                          className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                            formData.fuelType === type 
                              ? 'bg-text-primary text-bg border-text-primary' 
                              : 'bg-bg text-text-primary border-border hover:border-text-secondary'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Special Requirements</label>
                    <textarea 
                      placeholder="Color, interior, optional features..."
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-bg-secondary border border-border rounded-2xl px-6 py-4 font-semibold text-text-primary focus:ring-2 focus:ring-accent/30 transition-all h-32 resize-none outline-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-widest">
                      <Camera size={14} /> Example Photos <span className="opacity-50 lowercase">(optional)</span>
                    </div>
                    <div className="bg-bg-secondary border border-border p-4 rounded-2xl">
                      <ImageUpload 
                        bucket="vehicles"
                        folder="sourcing"
                        maxFiles={5}
                        onUploadComplete={(urls) => setFormData(prev => ({ ...prev, photos: urls }))}
                        label="Drop example photos here"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Payment Status Preference</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { id: 'DUTY_PAID', label: 'Fully Paid', desc: 'Ready for full ownership' },
                        { id: 'DUTY_FREE', label: 'Bank-Financed', desc: 'For eligible bank-financed purchases' }
                      ].map(status => (
                        <button
                          key={status.id}
                          type="button"
                          onClick={() => setFormData({...formData, dutyStatus: status.id})}
                          className={`p-6 rounded-2xl border text-left transition-all ${
                            formData.dutyStatus === status.id 
                              ? 'bg-accent/5 border-accent ring-1 ring-accent' 
                              : 'bg-bg border-border hover:border-text-secondary'
                          }`}
                        >
                          <p className="font-bold text-text-primary">{status.label}</p>
                          <p className="text-xs text-text-secondary mt-1">{status.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Total Budget (Millions ETB)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary font-bold">ETB</span>
                      <input 
                        required
                        type="number" 
                        placeholder="e.g. 4.5"
                        value={formData.budget}
                        onChange={e => setFormData({...formData, budget: e.target.value})}
                        className="w-full bg-bg-secondary border border-border rounded-2xl pl-16 pr-6 py-4 font-semibold text-text-primary focus:ring-2 focus:ring-accent/30 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex gap-4">
                    <HelpCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-500 font-medium leading-relaxed">
                      Our budget estimates include shipping, port fees, and our professional sourcing commission. 
                      Financing terms are calculated separately based on real-time bank rates.
                    </p>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Full Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-bg-secondary border border-border rounded-2xl px-6 py-4 font-semibold text-text-primary focus:ring-2 focus:ring-accent/30 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Phone Number</label>
                      <input 
                        required
                        type="tel" 
                        placeholder="+251 ..."
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-bg-secondary border border-border rounded-2xl px-6 py-4 font-semibold text-text-primary focus:ring-2 focus:ring-accent/30 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-8 bg-text-primary rounded-[2rem] text-bg space-y-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={20} className="text-accent" />
                      <p className="font-bold tracking-tight">Order Protection</p>
                    </div>
                    <p className="text-sm opacity-80 font-medium leading-relaxed">
                      By submitting this request, you agree to PeaceCars sourcing terms. 
                      No commitment is required until we find a vehicle that meets your exact specifications and you approve the final valuation.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-4 pt-6">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-10 py-4 rounded-2xl border border-border text-sm font-bold text-text-primary hover:bg-bg-secondary transition-all active:scale-[0.98]"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="peace-btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : currentStep === STEPS.length - 1 ? 'Submit Request' : 'Continue'}
                {!submitting && <ArrowRight size={16} />}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-bg-secondary border border-border rounded-[2rem] p-10 space-y-10">
            <h3 className="text-2xl font-bold text-text-primary tracking-tight">The Sourcing Journey.</h3>
            
            <div className="space-y-8">
              {[
                { icon: <Globe size={18} />, title: 'Global Search', desc: 'We scour networks in UAE, Europe, and Korea for your specific build.' },
                { icon: <ShieldCheck size={18} />, title: 'Remote Audit', desc: 'Our agents perform on-site inspections before any commitment.' },
                { icon: <Plane size={18} />, title: 'Swift Import', desc: 'Full customs handling and secure transport to Ethiopia.' },
                { icon: <PackageSearch size={18} />, title: 'Peace Delivery', desc: 'Final 150-point inspection and home delivery in Addis.' }
              ].map((step, i) => (
                <div key={i} className="flex gap-5">
                  <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-accent shadow-sm shrink-0">
                    {step.icon}
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-text-primary">{step.title}</p>
                    <p className="text-xs text-text-secondary font-medium leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs font-bold text-text-primary">Currently Sourcing: 14 Active Requests</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
