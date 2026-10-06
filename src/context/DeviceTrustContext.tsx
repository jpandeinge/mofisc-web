// src/context/DeviceTrustContext.tsx

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { generateFingerprint } from '../utils/fingerprint';
import { secureLogger } from '../utils/secureLogger';
import { useLocation } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface TrustedDevice {
  id: string;
  fingerprint: string;
  device_name: string | null;
  friendly_name: string;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  is_trusted: boolean;
  is_current_device: boolean;
  is_suspicious: boolean;
  location: string | null;
  last_login_location: string | null;
  login_count: number;
  last_used_at: string;
  last_login_at: string | null;
  created_at: string;
}

const parseTimestamp = (value?: string | null): number => {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
};

const dedupeDevices = (items: TrustedDevice[]): TrustedDevice[] => {
  const byFingerprint = new Map<string, TrustedDevice>();
  const sorted = [...items].sort((a, b) => {
    const aScore =
      parseTimestamp(a.last_used_at) || parseTimestamp(a.last_login_at) || parseTimestamp(a.created_at);
    const bScore =
      parseTimestamp(b.last_used_at) || parseTimestamp(b.last_login_at) || parseTimestamp(b.created_at);
    return bScore - aScore;
  });

  sorted.forEach((item) => {
    const key = item.fingerprint || item.id;
    if (!byFingerprint.has(key)) {
      byFingerprint.set(key, item);
    }
  });

  const deduped = Array.from(byFingerprint.values());

  // Hide legacy duplicate rows for the current device once a stable client device
  // identifier is present. This keeps UX clean while backend identity stabilises.
  const signatureOf = (device: TrustedDevice): string =>
    `${device.friendly_name || ''}|${device.browser || ''}|${device.os || ''}`.toLowerCase();

  const currentStableSignatures = new Set(
    deduped
      .filter((device) => device.is_current_device && (device.device_name || '').startsWith('client_'))
      .map(signatureOf)
  );

  if (currentStableSignatures.size === 0) {
    return deduped;
  }

  return deduped.filter((device) => {
    if (device.is_current_device) return true;
    if ((device.device_name || '').startsWith('client_')) return true;
    return !currentStableSignatures.has(signatureOf(device));
  });
};

interface DeviceTrustContextType {
  devices: TrustedDevice[];
  loading: boolean;
  currentFingerprint: string;
  isNewDevice: boolean;
  isSuspicious: boolean;
  fetchDevices: () => Promise<void>;
  trustDevice: (deviceId: string) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  removeAllDevices: () => Promise<void>;
  checkCurrentDevice: () => Promise<void>;
}

const DeviceTrustContext = createContext<DeviceTrustContextType | undefined>(undefined);

const getAuthHeaders = async () => {
  const session = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: session.data.session ? `Bearer ${session.data.session.access_token}` : '',
  };
};

export const DeviceTrustProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFingerprint, setCurrentFingerprint] = useState('');
  const [isNewDevice, setIsNewDevice] = useState(false);
  const [isSuspicious, setIsSuspicious] = useState(false);

  // Ref to prevent concurrent device checks (race condition fix)
  const checkInProgressRef = useRef(false);
  const lastCheckedUserRef = useRef<string | null>(null);
  const shouldShowSecurityToasts = useMemo(() => {
    const path = location.pathname;
    const publicRoutes = [
      '/',
      '/signin',
      '/signup',
      '/pricing',
      '/about',
      '/api-reference',
      '/terms',
      '/data-policy',
      '/cookie-policy',
      '/auth/callback',
      '/verify-email',
      '/forgot-password',
      '/payment/success'
    ];

    if (publicRoutes.includes(path)) {
      return false;
    }
    return document?.visibilityState !== 'hidden';
  }, [location.pathname]);

  const fetchDevices = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      // Pass current fingerprint to mark the current device
      const url = currentFingerprint
        ? `${API_BASE_URL}/v1/security/devices?current_fingerprint=${encodeURIComponent(currentFingerprint)}`
        : `${API_BASE_URL}/v1/security/devices`;

      const response = await fetch(url, { headers });

      if (!response.ok) throw new Error('Failed to fetch devices');

      const data = await response.json();
      setDevices(dedupeDevices(Array.isArray(data) ? data : []));
    } catch (error) {
      secureLogger.error('DeviceTrust', 'Failed to fetch devices', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentFingerprint]);

  const checkCurrentDevice = useCallback(async () => {
    if (!user) return;

    // Prevent concurrent calls (race condition fix)
    if (checkInProgressRef.current) {
      secureLogger.debug('DeviceTrust', 'Device check already in progress, skipping');
      return;
    }

    // Skip if we already checked for this user
    if (lastCheckedUserRef.current === user.id) {
      secureLogger.debug('DeviceTrust', 'Device already checked for this user');
      return;
    }

    checkInProgressRef.current = true;

    try {
      const checkSessionKey = `device-check-complete-${user.id}`;
      const dedupeWindowMs = 45 * 1000;
      const lastCheckAt = Number(sessionStorage.getItem(checkSessionKey) || '0');
      if (lastCheckAt > 0 && Date.now() - lastCheckAt < dedupeWindowMs) {
        await fetchDevices();
        return;
      }

      const fp = await generateFingerprint();
      setCurrentFingerprint(fp.fingerprint);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/v1/security/devices/check`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fingerprint: fp.fingerprint,
          device_name: fp.clientDeviceId,
          user_agent: fp.userAgent,
          browser: fp.browser,
          os: fp.os,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Failed to check device (${response.status}): ${detail.slice(0, 120)}`);
      }

      const data = await response.json();
      setIsNewDevice(data.is_new_device);
      setIsSuspicious(data.is_suspicious || false);

      // Mark this user as checked
      lastCheckedUserRef.current = user.id;
      sessionStorage.setItem(checkSessionKey, String(Date.now()));

      if (shouldShowSecurityToasts && data.is_new_device) {
        const toastKey = `device-trust-new-${user.id}`;
        if (!sessionStorage.getItem(toastKey)) {
          sessionStorage.setItem(toastKey, 'true');
          toast.info('New device detected. Trust this device to avoid future prompts.', {
            position: 'top-center',
            autoClose: 5000,
            toastId: toastKey,
          });
        }
      }

      if (shouldShowSecurityToasts && data.is_suspicious) {
        const toastKey = `device-trust-suspicious-${user.id}`;
        if (!sessionStorage.getItem(toastKey)) {
          sessionStorage.setItem(toastKey, 'true');
          toast.warning('Login from new location detected. Please verify this is you.', {
            position: 'top-center',
            autoClose: 6500,
            toastId: toastKey,
          });
        }
      }

      // Fetch devices with the fingerprint we just generated
      const devicesUrl = `${API_BASE_URL}/v1/security/devices?current_fingerprint=${encodeURIComponent(fp.fingerprint)}`;
      const devicesResponse = await fetch(devicesUrl, { headers });
      if (devicesResponse.ok) {
        const devicesData = await devicesResponse.json();
        setDevices(dedupeDevices(Array.isArray(devicesData) ? devicesData : []));
      }
    } catch (error) {
      secureLogger.error('DeviceTrust', 'Failed to check device', error);
    } finally {
      checkInProgressRef.current = false;
    }
  }, [user]);

  const trustDevice = useCallback(async (deviceId: string) => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/v1/security/devices/${deviceId}/trust`, {
        method: 'PUT',
        headers,
      });

      if (!response.ok) throw new Error('Failed to trust device');

      toast.success('Device trusted successfully');
      await fetchDevices();
    } catch (error) {
      secureLogger.error('DeviceTrust', 'Failed to trust device', error);
      toast.error('Failed to trust device');
    } finally {
      setLoading(false);
    }
  }, [fetchDevices]);

  const removeDevice = useCallback(async (deviceId: string) => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/v1/security/devices/${deviceId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) throw new Error('Failed to remove device');

      toast.success('Device removed');
      await fetchDevices();
    } catch (error) {
      secureLogger.error('DeviceTrust', 'Failed to remove device', error);
      toast.error('Failed to remove device');
    } finally {
      setLoading(false);
    }
  }, [fetchDevices]);

  const removeAllDevices = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/v1/security/devices`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) throw new Error('Failed to remove devices');

      toast.success('All devices removed');
      await fetchDevices();
    } catch (error) {
      secureLogger.error('DeviceTrust', 'Failed to remove all devices', error);
      toast.error('Failed to remove all devices');
    } finally {
      setLoading(false);
    }
  }, [fetchDevices]);

  // Check device on login - only depend on user.id to prevent re-runs
  useEffect(() => {
    if (user?.id) {
      // Clear devices first when user changes (important for user switching)
      if (lastCheckedUserRef.current && lastCheckedUserRef.current !== user.id) {
        setDevices([]);
        setCurrentFingerprint('');
        setIsNewDevice(false);
        setIsSuspicious(false);
      }
      checkCurrentDevice();
    } else {
      // Reset state on logout
      setDevices([]);
      setCurrentFingerprint('');
      setIsNewDevice(false);
      setIsSuspicious(false);
      lastCheckedUserRef.current = null;
    }
    // Only depend on user?.id, not the entire user object or checkCurrentDevice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <DeviceTrustContext.Provider
      value={{
        devices,
        loading,
        currentFingerprint,
        isNewDevice,
        isSuspicious,
        fetchDevices,
        trustDevice,
        removeDevice,
        removeAllDevices,
        checkCurrentDevice,
      }}
    >
      {children}
    </DeviceTrustContext.Provider>
  );
};

export const useDeviceTrust = () => {
  const context = useContext(DeviceTrustContext);
  if (!context) {
    throw new Error('useDeviceTrust must be used within DeviceTrustProvider');
  }
  return context;
};
