import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { FUEL_TYPES, BODY_TYPES, PAYMENT_STATUSES } from '../lib/vehicleOptions';

export type FilterState = {
  priceRange: [number, number];
  yearRange: [number, number];
  fuelTypes: string[];
  bodyTypes: string[];
  dutyStatuses: string[];
  sortBy: string;
}

export const DEFAULT_FILTERS: FilterState = {
  priceRange: [0, 50],
  yearRange: [2000, 2026],
  fuelTypes: [],
  bodyTypes: [],
  dutyStatuses: [],
  sortBy: 'newest',
};

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  resultCount: number;
}

export default function FilterPanel({ filters, onChange, onReset, resultCount }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('price');

  const activeCount = [
    filters.fuelTypes.length > 0,
    filters.bodyTypes.length > 0,
    filters.dutyStatuses.length > 0,
    filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] || filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1],
    filters.yearRange[0] !== DEFAULT_FILTERS.yearRange[0] || filters.yearRange[1] !== DEFAULT_FILTERS.yearRange[1],
  ].filter(Boolean).length;

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-border bg-bg text-text-primary hover:bg-bg-secondary transition-all text-sm font-semibold shadow-sm active:scale-95"
      >
        <SlidersHorizontal size={16} />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Slide-Out Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[2000]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/70"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-[450px] bg-bg border-l border-border shadow-2xl flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold text-text-primary tracking-tight">Refine Results</h3>
                  <p className="text-xs text-text-secondary font-medium mt-0.5">{resultCount} vehicles available</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-full bg-bg-secondary hover:bg-border flex items-center justify-center text-text-primary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2">

                {/* Sort */}
                <div className="pb-4 mb-2 border-b border-border">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 block">Sort By</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'newest', label: 'Newest' },
                      { value: 'price_low', label: 'Price: Low → High' },
                      { value: 'price_high', label: 'Price: High → Low' },
                      { value: 'year_new', label: 'Year: Newest' },
                      { value: 'km_low', label: 'Lowest KM' },
                    ].map(s => (
                      <button
                        key={s.value}
                        onClick={() => onChange({ ...filters, sortBy: s.value })}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all border ${
                          filters.sortBy === s.value
                            ? 'bg-text-primary text-bg border-text-primary'
                            : 'bg-bg text-text-primary border-border hover:border-text-secondary'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <FilterSection
                  title="Price Range (Millions ETB)"
                  isOpen={expandedSection === 'price'}
                  onToggle={() => toggleSection('price')}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1 block">Min</label>
                        <input
                          type="number"
                          value={filters.priceRange[0]}
                          onChange={e => onChange({ ...filters, priceRange: [Number(e.target.value), filters.priceRange[1]] })}
                          className="w-full bg-bg-secondary border-none rounded-xl px-4 py-3 text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </div>
                      <span className="text-[#d2d2d7] font-bold mt-5">—</span>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1 block">Max</label>
                        <input
                          type="number"
                          value={filters.priceRange[1]}
                          onChange={e => onChange({ ...filters, priceRange: [filters.priceRange[0], Number(e.target.value)] })}
                          className="w-full bg-bg-secondary border-none rounded-xl px-4 py-3 text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={1}
                      value={filters.priceRange[1]}
                      onChange={e => onChange({ ...filters, priceRange: [filters.priceRange[0], Number(e.target.value)] })}
                      className="w-full accent-[#0071e3] h-1"
                    />
                    <div className="flex justify-between text-[10px] text-text-secondary font-semibold">
                      <span>0M</span>
                      <span>50M+</span>
                    </div>
                  </div>
                </FilterSection>

                {/* Year Range */}
                <FilterSection
                  title="Year Range"
                  isOpen={expandedSection === 'year'}
                  onToggle={() => toggleSection('year')}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1 block">From</label>
                      <input
                        type="number"
                        min={2000}
                        max={2026}
                        value={filters.yearRange[0]}
                        onChange={e => onChange({ ...filters, yearRange: [Number(e.target.value), filters.yearRange[1]] })}
                        className="w-full bg-bg-secondary border-none rounded-xl px-4 py-3 text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </div>
                    <span className="text-[#d2d2d7] font-bold mt-5">—</span>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1 block">To</label>
                      <input
                        type="number"
                        min={2000}
                        max={2026}
                        value={filters.yearRange[1]}
                        onChange={e => onChange({ ...filters, yearRange: [filters.yearRange[0], Number(e.target.value)] })}
                        className="w-full bg-bg-secondary border-none rounded-xl px-4 py-3 text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </div>
                  </div>
                </FilterSection>

                {/* Fuel Types */}
                <FilterSection
                  title="Powertrain"
                  isOpen={expandedSection === 'fuel'}
                  onToggle={() => toggleSection('fuel')}
                  badge={filters.fuelTypes.length || undefined}
                >
                  <div className="flex flex-wrap gap-2">
                    {FUEL_TYPES.map(f => (
                      <button
                        key={f.value}
                        onClick={() => onChange({ ...filters, fuelTypes: toggleArray(filters.fuelTypes, f.value) })}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all border ${
                          filters.fuelTypes.includes(f.value)
                            ? 'bg-accent text-white border-accent'
                            : 'bg-bg-secondary text-text-primary border-transparent hover:border-border'
                        }`}
                      >
                        {f.value === 'ELECTRIC' && '⚡ '}
                        {f.value === 'HYBRID' && '🔋 '}
                        {f.value === 'DIESEL' && '⛽ '}
                        {f.value === 'PETROL' && '🔧 '}
                        {f.label}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                {/* Body Types */}
                <FilterSection
                  title="Body Style"
                  isOpen={expandedSection === 'body'}
                  onToggle={() => toggleSection('body')}
                  badge={filters.bodyTypes.length || undefined}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {BODY_TYPES.map(b => (
                      <button
                        key={b.value}
                        onClick={() => onChange({ ...filters, bodyTypes: toggleArray(filters.bodyTypes, b.value) })}
                        className={`px-4 py-3 rounded-2xl text-xs font-semibold transition-all border text-left ${
                          filters.bodyTypes.includes(b.value)
                            ? 'bg-accent text-white border-accent'
                            : 'bg-bg-secondary text-text-primary border-transparent hover:border-border'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                {/* Payment Status */}
                <FilterSection
                  title="Payment Status"
                  isOpen={expandedSection === 'duty'}
                  onToggle={() => toggleSection('duty')}
                  badge={filters.dutyStatuses.length || undefined}
                >
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_STATUSES.map(d => (
                      <button
                        key={d.value}
                        onClick={() => onChange({ ...filters, dutyStatuses: toggleArray(filters.dutyStatuses, d.value) })}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all border ${
                          filters.dutyStatuses.includes(d.value)
                            ? 'bg-text-primary text-bg border-text-primary'
                            : 'bg-bg-secondary text-text-primary border-transparent hover:border-border'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              </div>

              {/* Footer */}
              <div className="px-6 py-5 border-t border-[#e5e5e5] flex gap-3">
                <button
                  onClick={onReset}
                  className="flex-1 py-3.5 rounded-2xl border border-border text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-[2] py-3.5 rounded-2xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors active:scale-[0.98]"
                >
                  Show {resultCount} Result{resultCount !== 1 ? 's' : ''}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* Accordion Section */
function FilterSection({ title, isOpen, onToggle, badge, children }: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text-primary">{title}</span>
          {badge && (
            <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
