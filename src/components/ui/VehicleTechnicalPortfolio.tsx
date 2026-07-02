import React from 'react';
import type { Vehicle } from '../../shared/types';
import { useTranslation } from 'react-i18next';

interface VehicleTechnicalPortfolioProps {
  car: Vehicle;
}

export const VehicleTechnicalPortfolio: React.FC<VehicleTechnicalPortfolioProps> = ({ car }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">{t('details.portfolio.title', 'Technical Portfolio.')}</h2>
        <p className="text-sm text-text-secondary font-medium leading-relaxed">
          Precision engineering specifications for the modern Ethiopian road.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border border border-border rounded-xl overflow-hidden">
        {[
          { label: t('details.specs.range', 'Range'), value: car.range_km ? `${car.range_km} km` : '—' },
          { label: t('details.specs.battery', 'Battery Capacity'), value: car.battery_capacity_kwh ? `${car.battery_capacity_kwh} kWh` : '—' },
          { label: t('details.specs.motor', 'Motor Power'), value: car.motor_power_kw ? `${Math.round(Number(car.motor_power_kw) * 1.341)} HP` : '—' },
          { label: t('details.specs.drivetrain', 'Drive Train'), value: car.drive_train || '—' },
          { label: t('details.specs.interior', 'Interior'), value: car.interior_color || '—' },
          { label: t('details.specs.os_lang', 'OS Language'), value: car.software_language || 'English' },
        ].map((item) => (
          <div key={item.label} className="bg-bg p-5 md:p-6 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{item.label}</span>
            <span className="text-base md:text-lg font-bold text-text-primary">{item.value}</span>
          </div>
        ))}
      </div>
      
      {car.features && car.features.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {car.features.map((feature: string, i: number) => (
            <span key={i} className="px-3.5 py-1.5 rounded-xl bg-bg-secondary border border-border text-text-primary text-[11px] font-semibold">
              {feature}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
