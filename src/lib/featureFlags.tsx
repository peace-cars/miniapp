import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from './apiClient';

export interface FeatureFlags {
  sell: boolean;
  source: boolean;
  community: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  sell: true,
  source: true,
  community: true,
};

const FeatureFlagsContext = createContext<FeatureFlags>(DEFAULT_FLAGS);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (!res.ok) return;
        const result = await res.json();
        const data: Record<string, string> = result.data || result;
        setFlags({
          sell:      data['feature_sell']      === 'true',
          source:    data['feature_source']    === 'true',
          community: data['feature_community'] === 'true',
        });
      } catch {
        // Network failure — keep defaults (all disabled)
      }
    };
    fetchFlags();
  }, []);

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlags {
  return useContext(FeatureFlagsContext);
}
