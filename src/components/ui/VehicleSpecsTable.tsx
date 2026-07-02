import React from 'react';
import { motion } from 'framer-motion';

export interface SpecItem {
  label: string;
  value: string;
  sub: string;
}

interface VehicleSpecsTableProps {
  specs: SpecItem[];
}

export const VehicleSpecsTable: React.FC<VehicleSpecsTableProps> = ({ specs }) => {
  return (
    <section className="border-y border-border bg-bg-secondary">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-0 md:divide-x md:divide-border">
          {specs.map((spec, i) => (
            <motion.div 
              key={spec.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="text-center px-6 space-y-2"
            >
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{spec.label}</p>
              <p className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">{spec.value}</p>
              <p className="text-xs font-medium text-accent">{spec.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
