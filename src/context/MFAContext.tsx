// src/context/MFAContext.tsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { secureLogger } from '../utils/secureLogger';

interface MFAFactor {
  id: string;
  type: 'totp';
  status: 'verified' | 'unverified';
  friendly_name?: string;
  created_at: string;
}

interface MFAContextType {
  factors: MFAFactor[];
  loading: boolean;
  enrollMFA: () => Promise<{ qrCode: string; secret: string; factorId: string } | null>;
  verifyMFA: (factorId: string, code: string) => Promise<boolean>;
  challengeMFA: (factorId: string) => Promise<string | null>;
  verifyChallenge: (factorId: string, challengeId: string, code: string) => Promise<boolean>;
  unenrollMFA: (factorId: string) => Promise<boolean>;
  refreshFactors: () => Promise<void>;
  hasMFA: boolean;
}

const MFAContext = createContext<MFAContextType | undefined>(undefined);

export const MFAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const hasMFA = factors.some(f => f.status === 'verified');

  // Fetch all MFA factors for current user
  const refreshFactors = useCallback(async () => {
    if (!user) {
      setFactors([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) throw error;

      if (data?.all) {
        // Map Supabase Factor type to our MFAFactor interface
        const mappedFactors: MFAFactor[] = data.all.map((factor: any) => ({
          id: factor.id,
          type: factor.factor_type || 'totp',
          status: factor.status,
          friendly_name: factor.friendly_name,
          created_at: factor.created_at,
        }));
        setFactors(mappedFactors);
      }
    } catch (error: any) {
      secureLogger.error('MFA', 'Failed to fetch MFA factors', error);
      toast.error('Failed to load MFA settings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Enroll in TOTP (Time-based One-Time Password) MFA
  const enrollMFA = useCallback(async () => {
    if (!user) {
      toast.error('You must be logged in to enable MFA');
      return null;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      if (!data) {
        throw new Error('No enrollment data returned');
      }

      // Type guard: ensure we got TOTP data
      if (data.type !== 'totp' || !('totp' in data)) {
        throw new Error('Expected TOTP factor but got different type');
      }

      // Generate QR code URL for Google Authenticator, Authy, etc.
      const issuer = 'Mofisc';
      const accountName = user.email || user.id;
      const otpAuthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${data.totp.secret}&issuer=${issuer}`;

      await refreshFactors();

      return {
        qrCode: otpAuthUrl,
        secret: data.totp.secret,
        factorId: data.id,
      };
    } catch (error: any) {
      secureLogger.error('MFA', 'Failed to enroll MFA', error);
      toast.error(error.message || 'Failed to set up MFA');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, refreshFactors]);

  // Verify the MFA enrollment with a code from authenticator app
  const verifyMFA = useCallback(async (factorId: string, code: string) => {
    try {
      setLoading(true);

      // First create a challenge for the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;
      if (!challengeData?.id) throw new Error('Failed to create challenge');

      // Then verify the challenge with the code
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (error) throw error;

      if (data) {
        toast.success('MFA enabled successfully! Your account is now more secure.', {
          position: 'top-center',
        });
        await refreshFactors();
        return true;
      }

      return false;
    } catch (error: any) {
      secureLogger.error('MFA', 'Failed to verify MFA', error);
      toast.error('Invalid code. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshFactors]);

  // Create an MFA challenge (required at login if MFA is enabled)
  const challengeMFA = useCallback(async (factorId: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error) throw error;

      return data?.id || null;
    } catch (error: any) {
      secureLogger.error('MFA', 'Failed to create MFA challenge', error);
      toast.error('Failed to create MFA challenge');
      return null;
    }
  }, []);

  // Verify an MFA challenge (at login)
  const verifyChallenge = useCallback(async (factorId: string, challengeId: string, code: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) throw error;

      return !!data;
    } catch (error: any) {
      secureLogger.error('MFA', 'Failed to verify MFA challenge', error);
      toast.error('Invalid MFA code');
      return false;
    }
  }, []);

  // Remove MFA (unenroll)
  const unenrollMFA = useCallback(async (factorId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) throw error;

      toast.success('MFA disabled successfully');
      await refreshFactors();
      return true;
    } catch (error: any) {
      secureLogger.error('MFA', 'Failed to unenroll MFA', error);
      toast.error('Failed to disable MFA');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshFactors]);

  // Load factors when user changes
  React.useEffect(() => {
    if (user) {
      refreshFactors();
    } else {
      setFactors([]);
    }
  }, [user, refreshFactors]);

  return (
    <MFAContext.Provider
      value={{
        factors,
        loading,
        enrollMFA,
        verifyMFA,
        challengeMFA,
        verifyChallenge,
        unenrollMFA,
        refreshFactors,
        hasMFA,
      }}
    >
      {children}
    </MFAContext.Provider>
  );
};

export const useMFA = () => {
  const context = useContext(MFAContext);
  if (!context) {
    throw new Error('useMFA must be used within MFAProvider');
  }
  return context;
};
