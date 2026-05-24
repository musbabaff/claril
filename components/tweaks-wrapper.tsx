'use client';

import { TweaksProvider, TweaksPanel } from '@/components/tweaks';

export default function RootTweaksWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TweaksProvider>
      {children}
      <TweaksPanel />
    </TweaksProvider>
  );
}
