// src/components/Security/MFASetupModal.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Smartphone, Key, Copy, Check, AlertTriangle } from 'lucide-react';
import { useMFA } from '../../context/MFAContext';
import { toast } from 'react-toastify';
import QRCode from 'qrcode';
import { colors, withOpacity } from '../../styles/colors';
import { secureLogger } from '../../utils/secureLogger';

interface MFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MFASetupModal: React.FC<MFASetupModalProps> = ({ isOpen, onClose }) => {
  const { enrollMFA, verifyMFA } = useMFA();
  const [step, setStep] = useState<'intro' | 'scan' | 'verify'>('intro');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const result = await enrollMFA();
      if (result) {
        setSecret(result.secret);
        setFactorId(result.factorId);

        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(result.qrCode, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrCodeUrl(qrDataUrl);
        setStep('scan');
      }
    } catch (error) {
      secureLogger.error('MFASetup', 'Enrollment error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const success = await verifyMFA(factorId, verificationCode);
      if (success) {
        onClose();
        // Reset state
        setStep('intro');
        setVerificationCode('');
        setQrCodeUrl('');
        setSecret('');
        setFactorId('');
      }
    } catch (error) {
      secureLogger.error('MFASetup', 'Verification error', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success('Secret key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    onClose();
    // Reset state after animation
    setTimeout(() => {
      setStep('intro');
      setVerificationCode('');
      setQrCodeUrl('');
      setSecret('');
      setFactorId('');
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: colors.overlay.backdrop }}
            className="fixed inset-0 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              style={{
                backgroundColor: colors.background.secondary,
                border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-6"
                style={{ borderBottom: `1px solid ${withOpacity(colors.text.secondary, 0.2)}` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: withOpacity(colors.primary.main, 0.1) }}
                  >
                    <Shield className="w-5 h-5" style={{ color: colors.primary.main }} />
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
                    Enable Two-Factor Authentication
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: colors.text.secondary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background.primary}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Step 1: Introduction */}
                {step === 'intro' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: withOpacity(colors.primary.main, 0.1) }}
                      >
                        <Shield className="w-8 h-8" style={{ color: colors.primary.main }} />
                      </div>
                      <h3 className="text-base font-semibold mb-2" style={{ color: colors.text.primary }}>
                        Protect Your Account
                      </h3>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        Add an extra layer of security to your account with two-factor authentication.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div
                        className="flex items-start gap-3 p-4 rounded-xl"
                        style={{
                          backgroundColor: colors.primary.lighter,
                          border: `1px solid ${colors.border.subtle}`
                        }}
                      >
                        <Smartphone className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.primary.main }} />
                        <div>
                          <p className="text-sm font-semibold mb-1" style={{ color: colors.text.primary }}>
                            Use an authenticator app
                          </p>
                          <p className="text-xs" style={{ color: colors.text.secondary }}>
                            Google Authenticator, Authy, 1Password, or any TOTP app
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-start gap-3 p-4 rounded-xl"
                        style={{
                          backgroundColor: colors.primary.lighter,
                          border: `1px solid ${colors.border.subtle}`
                        }}
                      >
                        <Key className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.primary.main }} />
                        <div>
                          <p className="text-sm font-semibold mb-1" style={{ color: colors.text.primary }}>
                            Generate time-based codes
                          </p>
                          <p className="text-xs" style={{ color: colors.text.secondary }}>
                            New 6-digit code every 30 seconds for secure login
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-4 rounded-xl"
                      style={{
                        backgroundColor: withOpacity(colors.status.warning, 0.1),
                        border: `1px solid ${withOpacity(colors.status.warning, 0.3)}`
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.status.warning }} />
                        <div>
                          <p className="text-sm font-semibold mb-1" style={{ color: colors.text.primary }}>
                            Important
                          </p>
                          <p className="text-xs" style={{ color: colors.text.secondary }}>
                            Make sure to save your backup codes. You'll need them if you lose access to your authenticator app.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleEnroll}
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-lg font-semibold transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: colors.primary.main,
                        color: colors.text.inverse
                      }}
                      onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
                      onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '1')}
                    >
                      {loading ? 'Setting up...' : 'Continue'}
                    </button>
                  </div>
                )}

                {/* Step 2: Scan QR Code */}
                {step === 'scan' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-base font-semibold mb-2" style={{ color: colors.text.primary }}>
                        Scan QR Code
                      </h3>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        Use your authenticator app to scan this QR code
                      </p>
                    </div>

                    {qrCodeUrl && (
                      <div className="flex justify-center">
                        <div
                          className="p-4 rounded-2xl shadow-sm"
                          style={{
                            backgroundColor: colors.background.secondary,
                            border: `1px solid ${colors.border.light}`
                          }}
                        >
                          <img src={qrCodeUrl} alt="MFA QR Code" className="w-64 h-64" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs text-center" style={{ color: colors.text.secondary }}>
                        Can't scan? Enter this code manually:
                      </p>
                      <div
                        className="flex items-center gap-2 p-3 rounded-lg"
                        style={{
                          backgroundColor: colors.primary.lighter,
                          border: `1px solid ${colors.border.subtle}`
                        }}
                      >
                        <code className="flex-1 text-sm font-mono text-center" style={{ color: colors.text.primary }}>
                          {secret}
                        </code>
                        <button
                          onClick={copyToClipboard}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background.secondary}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {copied ? (
                            <Check className="w-4 h-4" style={{ color: colors.status.success }} />
                          ) : (
                            <Copy className="w-4 h-4" style={{ color: colors.text.secondary }} />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setStep('verify')}
                      className="w-full py-3 px-4 rounded-lg font-semibold transition-all"
                      style={{
                        backgroundColor: colors.primary.main,
                        color: colors.text.inverse
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* Step 3: Verify Code */}
                {step === 'verify' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-base font-semibold mb-2" style={{ color: colors.text.primary }}>
                        Enter Verification Code
                      </h3>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        Enter the 6-digit code from your authenticator app
                      </p>
                    </div>

                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full px-4 py-3 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: colors.background.secondary,
                          border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
                          color: colors.text.primary
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = colors.primary.main}
                        onBlur={(e) => e.currentTarget.style.borderColor = withOpacity(colors.text.secondary, 0.2)}
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep('scan')}
                        className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all"
                        style={{
                          border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
                          color: colors.text.primary,
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background.primary}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleVerify}
                        disabled={loading || verificationCode.length !== 6}
                        className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all disabled:opacity-50"
                        style={{
                          backgroundColor: colors.primary.main,
                          color: colors.text.inverse
                        }}
                        onMouseEnter={(e) => !loading && verificationCode.length === 6 && (e.currentTarget.style.opacity = '0.9')}
                        onMouseLeave={(e) => !loading && verificationCode.length === 6 && (e.currentTarget.style.opacity = '1')}
                      >
                        {loading ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MFASetupModal;
