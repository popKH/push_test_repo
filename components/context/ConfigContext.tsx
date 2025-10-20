import React, { createContext, useContext, useEffect, useState } from 'react';

export type Criterion = {
  key: string;
  label: string;
  enabled: boolean;
  weight: number; // 0-100
};

export type RCCConfig = {
  criteria: Criterion[];
};

const STORAGE_KEY = 'rccConfig_v1';

const DEFAULT_CRITERIA: Criterion[] = [
  {
    key: 'standard_script',
    label: 'Standard Script',
    enabled: true,
    weight: 15,
  },
  {
    key: 'presenting_manners',
    label: 'Presenting & Manners',
    enabled: true,
    weight: 15,
  },
  {
    key: 'call_handling',
    label: 'Call Handling Skill',
    enabled: true,
    weight: 15,
  },
  { key: 'collection_act', label: 'Collection ACT', enabled: true, weight: 15 },
  { key: 'work_process', label: 'Work Process', enabled: true, weight: 10 },
  {
    key: 'emotional_detection',
    label: 'Emotional Detection',
    enabled: true,
    weight: 10,
  },
  {
    key: 'keyword_noise',
    label: 'Keyword & Noise Detection',
    enabled: true,
    weight: 10,
  },
  {
    key: 'scoring_criteria',
    label: 'Scoring Criteria (meta)',
    enabled: true,
    weight: 10,
  },
];

const defaultConfig: RCCConfig = { criteria: DEFAULT_CRITERIA };

type ConfigContextValue = {
  config: RCCConfig;
  setConfig: (c: RCCConfig) => void;
  resetConfig: () => void;
  updateCriterion: (key: string, patch: Partial<Criterion>) => void;
};

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<RCCConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as RCCConfig;
    } catch (e) {
      // ignore
    }
    return defaultConfig;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      // ignore
    }
  }, [config]);

  const resetConfig = () => setConfig(defaultConfig);

  const updateCriterion = (key: string, patch: Partial<Criterion>) => {
    setConfig((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c) =>
        c.key === key ? { ...c, ...patch } : c
      ),
    }));
  };

  return (
    <ConfigContext.Provider
      value={{ config, setConfig, resetConfig, updateCriterion }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextValue => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
};

export default ConfigProvider;
