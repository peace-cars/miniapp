import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, DollarSign, ShieldCheck, MapPin, Edit3 } from 'lucide-react';

interface SellLandingProps {
  onStart: () => void;
}

export const SellLanding: React.FC<SellLandingProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-bg-secondary pt-24 pb-40 text-text-primary">
      <section className="px-5 py-12 md:py-20 text-center space-y-5 md:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-4"
        >
          <span className="text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-4 py-1.5 rounded-full">
            Selling with PeaceCars
          </span>
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight leading-none">
            Sell your car. <br/> Leave the rest to us.
          </h1>
          <p className="text-base md:text-2xl text-text-secondary max-w-2xl mx-auto font-medium pt-2 md:pt-4">
            Direct access to the largest pool of verified buyers in Ethiopia. Professional appraisal, safe payment, and zero stress.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onStart}
              className="peace-btn-primary px-10 py-4 w-full sm:w-auto"
            >
              Get Started
            </button>
            <Link to="/track" className="text-accent font-bold flex items-center gap-1.5 hover:underline text-[15px]">
              Track a request <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </section>


    </div>
  );
};
