// src/hooks/useCalculatorTracking.ts

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type CalculatorType = 'personal_loan' | 'vehicle_finance' | 'mortgage';

interface CalculatorTrackingHook {
  trackCalculatorUse: (
    calculatorType: CalculatorType,
    inputs: Record<string, any>,
    outputs: Record<string, any>,
    metadata?: Record<string, any>
  ) => Promise<void>;
  isTracking: boolean;
}

export const useCalculatorTracking = (): CalculatorTrackingHook => {
  const [isTracking, setIsTracking] = useState(false);
  const { user } = useAuth();

  const trackCalculatorUse = useCallback(async (
    calculatorType: CalculatorType,
    inputs: Record<string, any>,
    outputs: Record<string, any>,
    metadata: Record<string, any> = {}
  ) => {
    // Don't track if no user is logged in
    if (!user) return;

    try {
      setIsTracking(true);

      await supabase
        .from('calculator_history')
        .insert([{
          user_id: user.id,
          calculator_type: calculatorType,
          inputs,
          outputs,
          metadata
        }]);

      // We don't need to handle the response - this is fire and forget
    } catch (error) {
      // Silent error handling for non-critical functionality
      setIsTracking(false);
    } finally {
      setIsTracking(false);
    }
  }, [user]);

  return { trackCalculatorUse, isTracking };
};