import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, X, Trophy, Fuel, Gauge, MapPin, ShieldCheck, Zap } from 'lucide-react';
import { useComparison } from '../lib/ComparisonContext';

export default function Compare() {
  const { compareList, removeFromCompare, clearCompare, count } = useComparison();

  if (count < 2) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center gap-8 text-text-primary">
        <div className="w-20 h-20 rounded-full bg-bg-secondary border border-border flex items-center justify-center">
          <Trophy size={36} className="text-text-secondary opacity-40" />
        </div>
        <div className="space-y-3 max-w-md">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Add vehicles to compare</h1>
          <p className="text-text-secondary font-medium">Browse the collection and tap "Compare" on at least 2 vehicles to see a side-by-side breakdown.</p>
        </div>
        <Link to="/inventory" className="peace-btn-primary px-8 py-3 text-sm">
          Browse Collection
        </Link>
      </div>
    );
  }

  const specRows: { label: string; icon: React.ReactNode; getValue: (car: any) => string }[] = [
    { label: 'Year', icon: null, getValue: (c) => String(c.year) },
    { label: 'Price', icon: null, getValue: (c) => `${((c.retail_price_etb || 0) / 1000000).toFixed(2)}M ETB` },
    { label: 'Powertrain', icon: <Fuel size={14} />, getValue: (c) => c.fuel },
    { label: 'Mileage', icon: <Gauge size={14} />, getValue: (c) => c.certified_km ? `${c.certified_km.toLocaleString()} km` : '—' },
    { label: 'Payment Status', icon: <ShieldCheck size={14} />, getValue: (c) => c.duty === 'DUTY_PAID' ? 'Fully Paid' : c.duty === 'DUTY_FREE' ? 'Bank-Financed' : 'Pending' },
    { label: 'Battery SOH', icon: <Zap size={14} />, getValue: (c) => c.battery_soh_percent ? `${c.battery_soh_percent}%` : 'N/A' },
    { label: 'Location', icon: <MapPin size={14} />, getValue: (c) => c.branchName || '—' },
  ];

  // Find best values for highlighting
  const findBest = (key: string) => {
    if (key === 'Price') {
      const prices = compareList.map(c => c.retail_price_etb || 0);
      const min = Math.min(...prices);
      return compareList.findIndex(c => (c.retail_price_etb || 0) === min);
    }
    if (key === 'Year') {
      const years = compareList.map(c => c.year);
      const max = Math.max(...years);
      return compareList.findIndex(c => c.year === max);
    }
    if (key === 'Battery SOH') {
      const sohs = compareList.map(c => c.battery_soh_percent || 0);
      const max = Math.max(...sohs);
      if (max === 0) return -1;
      return compareList.findIndex(c => (c.battery_soh_percent || 0) === max);
    }
    return -1;
  };

  return (
    <div className="min-h-screen bg-bg pb-32 text-text-primary">
      {/* Header */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-[1200px] mx-auto">
          <Link to="/inventory" className="inline-flex items-center gap-2 text-accent font-semibold text-sm mb-6 hover:underline">
            <ArrowLeft size={16} /> Back to Collection
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight">Compare.</h1>
              <p className="text-lg text-text-secondary font-medium mt-2">Side-by-side specification breakdown.</p>
            </div>
            <button
              onClick={clearCompare}
              className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto w-full px-6">
        <div className="w-full pb-6">
          <div className="space-y-6 md:space-y-10 w-full overflow-x-auto no-scrollbar pb-4">
            {/* Vehicle Headers */}
            {/* Mobile Header (Compact, no label column spacer) */}
            <div className="grid md:hidden gap-2 min-w-[max-content]" style={{ gridTemplateColumns: `repeat(${count}, minmax(120px, 1fr))` }}>
              {compareList.map((car, i) => (
                <div key={car.id} className="bg-bg-secondary border border-border rounded-xl relative shadow-sm p-2.5 flex flex-col items-center">
                   <button onClick={() => removeFromCompare(car.id)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-bg flex items-center justify-center text-text-primary hover:text-red-500 shadow-sm border border-border z-10">
                     <X size={12} />
                   </button>
                   <div className="w-20 h-14 sm:w-24 sm:h-16 mb-2 shrink-0">
                     <img src={car.images[0]} alt="" className="w-full h-full object-cover rounded-lg shadow-sm border border-border/50" />
                   </div>
                   <div className="text-center w-full px-1">
                     <h3 className="text-xs font-bold text-text-primary leading-tight truncate">{car.model}</h3>
                     <p className="text-[10px] font-bold text-accent mt-0.5 truncate">{((car.retail_price_etb || 0) / 1000000).toFixed(1)}M ETB</p>
                   </div>
                </div>
              ))}
            </div>

            {/* Desktop Header */}
            <div className="hidden md:grid gap-6" style={{ gridTemplateColumns: `180px repeat(${count}, minmax(180px, 1fr))` }}>
              {/* Label column spacer */}
              <div className="bg-bg" />

              {compareList.map((car, i) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group"
                >
                  <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden hover:border-accent transition-colors shadow-sm">
                    <div className="aspect-[4/3] relative">
                      <img
                        src={car.images[0]}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeFromCompare(car.id)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-bg flex items-center justify-center text-text-primary hover:text-red-500 hover:bg-bg-secondary transition-colors shadow-sm border border-border"
                      >
                        <X size={16} />
                      </button>
                      {car.fuel === 'ELECTRIC' && (
                        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-accent text-white text-[10px] font-bold shadow-sm">
                          ⚡ EV
                        </div>
                      )}
                    </div>
                    <div className="p-4 md:p-5 text-center">
                      <p className="text-xs font-medium text-text-secondary truncate">{car.year} {car.make}</p>
                      <h3 className="text-lg md:text-xl font-bold text-text-primary tracking-tight truncate">{car.model}</h3>
                      <p className="text-sm md:text-lg font-bold text-accent mt-1 truncate">{((car.retail_price_etb || 0) / 1000000).toFixed(2)}M ETB</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Specs Table */}
            <div className="rounded-xl border border-border overflow-hidden bg-bg-secondary shadow-sm md:min-w-full min-w-[max-content]">
              {specRows.map((row, ri) => {
                const bestIndex = findBest(row.label);
                return (
                  <div key={row.label} className={`border-b border-border last:border-0 ${ri % 2 === 0 ? 'bg-bg' : 'bg-bg-secondary'}`}>
                    
                    {/* Mobile Layout (Stacked Label) */}
                    <div className="md:hidden py-3">
                      <div className="text-center pb-2 flex items-center justify-center gap-1.5 opacity-60">
                         {row.icon && <span className="scale-75">{row.icon}</span>}
                         <span className="text-[10px] font-bold uppercase tracking-wider">{row.label}</span>
                      </div>
                      <div className="grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(120px, 1fr))` }}>
                        {compareList.map((car, ci) => (
                          <div key={car.id} className="text-center px-1 border-r border-border last:border-0 flex flex-col items-center justify-center">
                            <span className={`text-xs font-bold truncate ${bestIndex === ci ? 'text-accent' : 'text-text-primary'}`}>
                              {row.getValue(car)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Desktop Layout (Inline Label) */}
                    <div className="hidden md:grid items-center" style={{ gridTemplateColumns: `180px repeat(${count}, minmax(180px, 1fr))` }}>
                      <div className="px-6 py-5 flex items-center gap-2.5 border-r border-border">
                        {row.icon && <span className="text-text-secondary">{row.icon}</span>}
                        <span className="text-sm font-semibold text-text-primary leading-tight">{row.label}</span>
                      </div>
                      {compareList.map((car, ci) => (
                        <div key={car.id} className="px-6 py-5 text-center flex items-center justify-center">
                          <span className={`text-sm font-bold truncate ${bestIndex === ci ? 'text-accent' : 'text-text-primary'}`}>
                            {row.getValue(car)}
                            {bestIndex === ci && <span className="ml-1.5 text-[10px] text-accent">✓</span>}
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6">
          <div className="mt-8 mb-12 bg-bg-secondary border border-border rounded-xl p-8 sm:p-10 text-center space-y-4 shadow-sm">
            <h3 className="text-2xl font-bold text-text-primary tracking-tight">Found your match?</h3>
            <p className="text-text-secondary font-medium max-w-lg mx-auto">Contact an advisor to discuss pricing, financing, and delivery options.</p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 pt-2">
              {compareList.map(car => (
                <Link
                  key={car.id}
                  to={`/inventory/${car.id}`}
                  className="w-full sm:w-auto px-6 py-3 bg-text-primary text-bg rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity active:scale-95 text-center"
                >
                  View {car.model}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
