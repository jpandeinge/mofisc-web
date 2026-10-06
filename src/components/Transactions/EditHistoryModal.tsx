// src/components/Transactions/EditHistoryModal.tsx

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Edit3, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { colors, withOpacity, shadows } from '../../styles/colors';
import { TransactionEditHistory } from '../../types';
import { transactionEditService } from '../../services/transactionEditService';

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string | number;
  merchantName?: string;
}

/**
 * Revolut-style edit history modal showing all changes to a transaction.
 * Features:
 * - Beautiful timeline view with color-coded changes
 * - Formatted timestamps
 * - Loading and error states
 * - Smooth animations
 * - Mobile-responsive design
 */
const EditHistoryModal: React.FC<EditHistoryModalProps> = ({
  isOpen,
  onClose,
  transactionId,
  merchantName,
}) => {
  const [history, setHistory] = useState<TransactionEditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadEditHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, transactionId]);

  const loadEditHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await transactionEditService.getEditHistory(transactionId);
      setHistory(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load edit history');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: withOpacity(colors.background.primary, 0.8),
              backdropFilter: 'blur(4px)',
              zIndex: 99998,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '70vh',
              background: colors.background.secondary,
              borderRadius: '16px',
              boxShadow: shadows.xl,
              border: `1px solid ${colors.border.light}`,
              zIndex: 99999,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1rem',
                borderBottom: `1px solid ${colors.border.subtle}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: withOpacity(colors.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <History style={{ width: '16px', height: '16px', color: colors.primary.main }} />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: colors.text.primary,
                      margin: 0,
                    }}
                  >
                    Edit History
                  </h2>
                  {merchantName && (
                    <p
                      style={{
                        fontSize: '0.65rem',
                        color: colors.text.tertiary,
                        margin: '0.125rem 0 0 0',
                      }}
                    >
                      {merchantName}
                    </p>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: colors.background.tertiary,
                  border: `1px solid ${colors.border.subtle}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X style={{ width: '16px', height: '16px', color: colors.text.secondary }} />
              </motion.button>
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
              }}
            >
              {isLoading && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    gap: '0.75rem',
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: `2px solid ${withOpacity(colors.primary.main, 0.2)}`,
                      borderTopColor: colors.primary.main,
                      borderRadius: '50%',
                    }}
                  />
                  <p style={{ fontSize: '0.65rem', color: colors.text.tertiary }}>
                    Loading edit history...
                  </p>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '1.5rem',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: withOpacity(colors.status.error, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AlertCircle
                      style={{ width: '20px', height: '20px', color: colors.status.error }}
                    />
                  </div>
                  <p style={{ fontSize: '0.65rem', color: colors.status.error }}>{error}</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={loadEditHistory}
                    style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: '6px',
                      background: colors.primary.main,
                      color: colors.text.inverse,
                      border: 'none',
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Retry
                  </motion.button>
                </motion.div>
              )}

              {!isLoading && !error && history.length === 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '2rem 1.5rem',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: withOpacity(colors.text.tertiary, 0.08),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <History
                      style={{ width: '24px', height: '24px', color: colors.text.tertiary }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: '0.65rem',
                      color: colors.text.tertiary,
                      textAlign: 'center',
                    }}
                  >
                    No edits have been made to this transaction yet.
                  </p>
                </div>
              )}

              {!isLoading && !error && history.length > 0 && (
                <div style={{ position: 'relative' }}>
                  {/* Timeline line */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '15px',
                      top: '18px',
                      bottom: '18px',
                      width: '2px',
                      background: withOpacity(colors.border.light, 0.5),
                    }}
                  />

                  {/* Timeline items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {history.map((edit, index) => (
                      <motion.div
                        key={edit.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                          position: 'relative',
                          paddingLeft: '2.25rem',
                        }}
                      >
                        {/* Timeline dot */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '9px',
                            top: '6px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: colors.primary.main,
                            border: `2px solid ${colors.background.secondary}`,
                            boxShadow: `0 0 0 1px ${withOpacity(colors.primary.main, 0.2)}`,
                          }}
                        />

                        {/* Edit content */}
                        <div
                          style={{
                            background: colors.background.tertiary,
                            borderRadius: '10px',
                            border: `1px solid ${colors.border.subtle}`,
                            padding: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.375rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <Edit3
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  color: colors.primary.main,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  color: colors.text.primary,
                                  textTransform: 'capitalize',
                                }}
                              >
                                {edit.field_name.replace('_', ' ')}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.6rem',
                                color: colors.text.tertiary,
                              }}
                            >
                              {format(new Date(edit.edited_at), 'MMM d, yyyy • h:mm a')}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.65rem' }}>
                            <div style={{ marginBottom: '0.25rem' }}>
                              <span style={{ color: colors.text.tertiary }}>From: </span>
                              <span
                                style={{
                                  color: colors.status.error,
                                  textDecoration: 'line-through',
                                  fontWeight: 500,
                                }}
                              >
                                {edit.old_value || '(empty)'}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: colors.text.tertiary }}>To: </span>
                              <span
                                style={{
                                  color: colors.status.success,
                                  fontWeight: 500,
                                }}
                              >
                                {edit.new_value || '(empty)'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default EditHistoryModal;
