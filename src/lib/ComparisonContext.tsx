import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Vehicle } from '../shared/types';
interface ComparisonContextType {
  compareList: Vehicle[];
  addToCompare: (vehicle: Vehicle) => void;
  removeFromCompare: (id: string) => void;
  toggleCompare: (vehicle: Vehicle) => void;
  isInCompare: (id: string) => boolean;
  clearCompare: () => void;
  count: number;
}

const ComparisonContext = createContext<ComparisonContextType>({
  compareList: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  toggleCompare: () => {},
  isInCompare: () => false,
  clearCompare: () => {},
  count: 0,
});

const STORAGE_KEY = 'peacecars_compare';
const MAX_COMPARE = 3;

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<Vehicle[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = useCallback((vehicle: Vehicle) => {
    setCompareList(prev => {
      if (prev.length >= MAX_COMPARE) return prev;
      if (prev.find(v => v.id === vehicle.id)) return prev;
      return [...prev, vehicle];
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setCompareList(prev => prev.filter(v => v.id !== id));
  }, []);

  const toggleCompare = useCallback((vehicle: Vehicle) => {
    setCompareList(prev => {
      if (prev.find(v => v.id === vehicle.id)) {
        return prev.filter(v => v.id !== vehicle.id);
      }
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, vehicle];
    });
  }, []);

  const isInCompare = useCallback((id: string) => !!compareList.find(v => v.id === id), [compareList]);

  const clearCompare = useCallback(() => setCompareList([]), []);

  return (
    <ComparisonContext.Provider value={{ compareList, addToCompare, removeFromCompare, toggleCompare, isInCompare, clearCompare, count: compareList.length }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export const useComparison = () => useContext(ComparisonContext);
