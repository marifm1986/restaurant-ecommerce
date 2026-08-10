'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider } from '@/components/auth/auth-provider';
import { SettingsProvider } from '@/providers/settings-provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
