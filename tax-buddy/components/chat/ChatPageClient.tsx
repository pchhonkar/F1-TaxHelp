'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from './ChatInterface';
import type { UserProfile } from '@/types';

const PROFILE_KEY = 'taxbuddy-wizard-profile';

export function ChatPageClient() {
  const [userProfile, setUserProfile] = useState<Partial<UserProfile> | undefined>();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserProfile>;
        setUserProfile(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  return <ChatInterface userProfile={userProfile} />;
}
