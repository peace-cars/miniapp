import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, ArrowRight, BarChart3 } from 'lucide-react';
import { useComparison } from '../lib/ComparisonContext';

export default function ComparisonTray() {
  const { compareList, removeFromCompare, clearCompare, count } = useComparison();

  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[150] px-4 pb-4"
      >
        <div className="max-w-[900px] mx-auto bg-[#1d1d1f] rounded-2xl shadow-2xl border border-[#333] p-4 flex items-center gap-4">
          {/* Vehicle Thumbnails */}
          <div className="flex items-center gap-3 flex-1 overflow-x-auto no-scrollbar">
            {compareList.map((car) => (
              <div key={car.id} className="relative shrink-0 group">
                <div className="w-16 h-12 rounded-xl overflow-hidden bg-[#2d2d2f] border border-[#444]">
                  <img
                    src={car.images[0]}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFromCompare(car.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} strokeWidth={3} />
                </button>
                <p className="text-[9px] text-[#86868b] font-semibold text-center mt-1 max-w-[64px] truncate">
                  {car.make} {car.model}
                </p>
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: 3 - count }).map((_, i) => (
              <div key={`empty-${i}`} className="shrink-0 w-16 h-12 rounded-xl border-2 border-dashed border-[#444] flex items-center justify-center">
                <span className="text-[10px] text-[#555] font-bold">+</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={clearCompare}
              className="text-xs font-semibold text-[#86868b] hover:text-white transition-colors px-3 py-2"
            >
              Clear
            </button>
            <Link
              to="/compare"
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                count >= 2
                  ? 'bg-[#0071e3] text-white hover:bg-[#0077ed]'
                  : 'bg-[#2d2d2f] text-[#555] cursor-not-allowed pointer-events-none'
              }`}
            >
              <BarChart3 size={16} />
              Compare {count}/3
              {count >= 2 && <ArrowRight size={14} />}
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
