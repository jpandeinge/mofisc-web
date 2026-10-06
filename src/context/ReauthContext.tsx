// src/context/ReauthContext.tsx
// Provides requireReauth() — call it before any sensitive operation.
// It opens a confirmation modal and returns a Promise
// that resolves on success or rejects if the user cancels.

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

interface ReauthContextType {
  requireReauth: () => Promise<void>;
  isReauthRequired: boolean;
  onReauthSuccess: () => void;
  onReauthCancel: () => void;
}

const ReauthContext = createContext<ReauthContextType | undefined>(undefined);

export const ReauthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReauthRequired, setIsReauthRequired] = useState(false);
  const pendingRef = useRef<{
    resolve: () => void;
    reject: (reason?: any) => void;
  } | null>(null);

  const requireReauth = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      pendingRef.current = { resolve, reject };
      setIsReauthRequired(true);
    });
  }, []);

  const onReauthSuccess = useCallback(() => {
    setIsReauthRequired(false);
    pendingRef.current?.resolve();
    pendingRef.current = null;
  }, []);

  const onReauthCancel = useCallback(() => {
    setIsReauthRequired(false);
    pendingRef.current?.reject(new Error('Re-authentication cancelled'));
    pendingRef.current = null;
  }, []);

  return (
    <ReauthContext.Provider
      value={{ requireReauth, isReauthRequired, onReauthSuccess, onReauthCancel }}
    >
      {children}
    </ReauthContext.Provider>
  );
};

export const useReauth = () => {
  const context = useContext(ReauthContext);
  if (!context) throw new Error('useReauth must be used within a ReauthProvider');
  return context;
};
