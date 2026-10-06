// src/components/Security/ReauthModal.tsx
// Identity-confirmation modal shown before sensitive operations.

import React, { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';
import { useReauth } from '../../context/ReauthContext';
import { colors } from '../../styles/colors';

export const ReauthModal: React.FC = () => {
  const { isReauthRequired, onReauthSuccess, onReauthCancel } = useReauth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isReauthRequired) return;
    setError('');
    setPassword('');
  }, [isReauthRequired]);

  if (!isReauthRequired) return null;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.email) {
        setError('Session expired');
        setLoading(false);
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: session.session.user.email,
        password,
      });

      if (authError) {
        setError('Incorrect password');
        setLoading(false);
        return;
      }

      setPassword('');
      onReauthSuccess();
    } catch {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.overlay.backdrop,
        zIndex: 50,
      }}
    >
      <div
        style={{
          backgroundColor: colors.background.secondary,
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <h3
          style={{
            color: colors.text.primary,
            fontSize: 18,
            fontWeight: 600,
            margin: '0 0 6px',
          }}
        >
          Confirm Your Identity
        </h3>
        <p style={{ color: colors.text.secondary, fontSize: 14, margin: '0 0 24px' }}>
          This action requires verification for your security.
        </p>

        {/* Password verification */}
        <form onSubmit={handlePasswordSubmit}>
          <label
            style={{
              display: 'block',
              color: colors.text.secondary,
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Enter your password"
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${error ? colors.status.error : colors.border.light}`,
              borderRadius: 8,
              fontSize: 14,
              color: colors.text.primary,
              backgroundColor: colors.background.tertiary,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ color: colors.status.error, fontSize: 12, margin: '6px 0 0' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '10px 16px',
              backgroundColor: colors.primary.main,
              color: colors.text.inverse,
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !password ? 0.5 : 1,
            }}
          >
            {loading ? 'Verifying...' : 'Confirm'}
          </button>
        </form>

        {/* Cancel */}
        <button
          onClick={onReauthCancel}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '8px 0',
            background: 'none',
            border: 'none',
            color: colors.text.tertiary,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
