'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { UserProfile } from '@/types';

export interface WizardProfile extends Partial<UserProfile> {
  annualWages?: number;
  ficaWithheldAmount?: number;
}

interface WizardContextValue {
  profile: WizardProfile;
  updateProfile: (updates: Partial<WizardProfile>) => void;
  step: number;
  setStep: (step: number) => void;
  goNext: () => void;
  goPrev: () => void;
}

const defaultProfile: WizardProfile = {
  visaType: undefined,
  countryOfOrigin: '',
  yearsInUS: 1,
  stateOfResidence: '',
  incomeTypes: [],
  ficaWithheld: false,
  tuitionPaid: 0,
  scholarshipAmount: 0,
};

const WizardContext = createContext<WizardContextValue | null>(null);

const TOTAL_STEPS = 7;

export function WizardProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<WizardProfile>(defaultProfile);
  const [step, setStep] = useState(1);

  const updateProfile = useCallback((updates: Partial<WizardProfile>) => {
    setProfile((p) => ({ ...p, ...updates }));
  }, []);

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const goPrev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  return (
    <WizardContext.Provider
      value={{
        profile,
        updateProfile,
        step,
        setStep,
        goNext,
        goPrev,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}
