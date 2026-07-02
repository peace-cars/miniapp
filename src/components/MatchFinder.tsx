import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, ChevronRight, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (answers: Record<string, string>) => void;
}

export default function MatchFinder({ isOpen, onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);
  const { t } = useTranslation();

  const questions = useMemo(() => [
    {
      id: 'purpose',
      text: t('match_finder.questions.purpose.text', "What's your main driving environment?"),
      subtitle: t('match_finder.questions.purpose.subtitle', 'This helps us match the right body style.'),
      options: [
        { label: t('match_finder.questions.purpose.options.CITY.label', 'City Commuting'), value: 'CITY', icon: '🏙️', desc: t('match_finder.questions.purpose.options.CITY.desc', 'Sedan, hatchback, compact') },
        { label: t('match_finder.questions.purpose.options.OFFROAD.label', 'Off-road / Adventure'), value: 'OFFROAD', icon: '⛰️', desc: t('match_finder.questions.purpose.options.OFFROAD.desc', 'SUV, crossover, 4×4') },
        { label: t('match_finder.questions.purpose.options.FAMILY.label', 'Family / Long Distance'), value: 'FAMILY', icon: '👨‍👩‍👧', desc: t('match_finder.questions.purpose.options.FAMILY.desc', 'Minivan, large SUV') },
      ],
    },
    {
      id: 'priority',
      text: t('match_finder.questions.priority.text', 'What do you value most?'),
      subtitle: t('match_finder.questions.priority.subtitle', "We'll prioritize your preference in results."),
      options: [
        { label: t('match_finder.questions.priority.options.EFFICIENCY.label', 'Fuel Economy / EV'), value: 'EFFICIENCY', icon: '⚡', desc: t('match_finder.questions.priority.options.EFFICIENCY.desc', 'Electric or hybrid') },
        { label: t('match_finder.questions.priority.options.LUXURY.label', 'Luxury & Comfort'), value: 'LUXURY', icon: '✨', desc: t('match_finder.questions.priority.options.LUXURY.desc', 'Premium interior & features') },
        { label: t('match_finder.questions.priority.options.RESALE.label', 'Durability & Resale'), value: 'RESALE', icon: '💎', desc: t('match_finder.questions.priority.options.RESALE.desc', 'Long-term value') },
      ],
    },
    {
      id: 'budget',
      text: t('match_finder.questions.budget.text', 'What is your budget range?'),
      subtitle: t('match_finder.questions.budget.subtitle', 'All prices are in Ethiopian Birr.'),
      options: [
        { label: t('match_finder.questions.budget.options.BUDGET.label', 'Under 3M ETB'), value: 'BUDGET', icon: '🏷️', desc: t('match_finder.questions.budget.options.BUDGET.desc', 'Practical & reliable') },
        { label: t('match_finder.questions.budget.options.MID.label', '3M – 8M ETB'), value: 'MID', icon: '📈', desc: t('match_finder.questions.budget.options.MID.desc', 'Great balance of value') },
        { label: t('match_finder.questions.budget.options.PREMIUM.label', 'Above 8M ETB'), value: 'PREMIUM', icon: '🏛️', desc: t('match_finder.questions.budget.options.PREMIUM.desc', 'Top-tier selection') },
      ],
    },
  ], [t]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [questions[step].id]: value };
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setStep(step + 1); // Show results
    }
  };

  const handleViewMatches = () => {
    onClose();
    onComplete?.(answers);
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
  };

  const progress = Math.min((step / questions.length) * 100, 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center p-0 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Sheet */}
          <motion.div
            initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.96, y: 24 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden flex flex-col"
            style={{
              background: 'var(--color-bg)',
              boxShadow: '0 24px 80px 0 rgba(0,0,0,0.22)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Progress bar */}
            <div className="h-1 w-full" style={{ background: 'var(--color-bg-secondary)' }}>
              <motion.div
                className="h-full"
                style={{ background: 'var(--color-accent)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>

            {/* Header */}
            <div
              className="px-6 py-4 flex items-center justify-between border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                >
                  <Wand2 size={16} />
                </div>
                <div>
                  <p className="font-bold text-[14px]" style={{ color: 'var(--color-text-primary)' }}>
                    {t('match_finder.title', 'Match Finder')}
                  </p>
                  {step < questions.length && (
                    <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      {step + 1} of {questions.length}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <AnimatePresence mode="wait">
                {step < questions.length ? (
                  <motion.div
                    key={`q-${step}`}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <h4
                        className="text-[22px] font-black tracking-tight leading-tight"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {questions[step].text}
                      </h4>
                      {questions[step].subtitle && (
                        <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                          {questions[step].subtitle}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {questions[step].options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleSelect(opt.value)}
                          className="flex items-center justify-between p-4 rounded-2xl text-left transition-all active:scale-[0.98] group"
                          style={{
                            border: '1.5px solid var(--color-border)',
                            background: 'var(--color-bg-secondary)',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)';
                            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-light)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-secondary)';
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl leading-none">{opt.icon}</span>
                            <div>
                              <p className="font-bold text-[14px]" style={{ color: 'var(--color-text-primary)' }}>
                                {opt.label}
                              </p>
                              {opt.desc && (
                                <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                  {opt.desc}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 text-center py-4"
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl"
                      style={{ background: 'var(--color-accent-light)' }}
                    >
                      ✨
                    </div>
                    <div className="space-y-2">
                      <h4
                        className="text-[26px] font-black tracking-tight"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {t('match_finder.results.title', 'Your Profile is Ready.')}
                      </h4>
                      <p className="text-[14px] max-w-xs mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                        {t('match_finder.results.subtitle', "We've filtered the inventory based on your preferences. Let's find your match.")}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleViewMatches}
                        className="w-full py-4 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 transition-opacity active:opacity-80"
                        style={{ background: 'var(--color-accent)' }}
                      >
                        {t('match_finder.results.view_matches', 'View Matches')} <ArrowRight size={18} />
                      </button>
                      <button
                        onClick={reset}
                        className="text-[13px] font-semibold transition-colors py-1"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {t('match_finder.results.restart', 'Restart Quiz')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
