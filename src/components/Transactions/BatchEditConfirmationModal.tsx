// src/components/Transactions/BatchEditConfirmationModal.tsx

import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Layers } from 'lucide-react';
import { colors, withOpacity } from '../../styles/colors';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface SimilarTransaction {
  id: string;
  transaction_date: string;
  transaction_description: string;
  merchant_name: string | null;
  category: string | null;
  transaction_amount: number;
  similarity_score: number;
}

interface BatchEditConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => Promise<void>;
  similarTransactions: SimilarTransaction[];
  field: 'merchant_name' | 'category';
  oldValue: string;
  newValue: string;
}

/**
 * Revolut-style modal for confirming batch updates to similar transactions.
 * Key layout fixes:
 * - Viewport-safe wrapper (grid + safe-area padding)
 * - Modal uses maxHeight with dvh + internal scroll area
 * - Footer always visible (never inside scroll container)
 */
const BatchEditConfirmationModal: React.FC<BatchEditConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  similarTransactions,
  field,
  oldValue,
  newValue,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Pre-select all transactions instantly for better UX
    return new Set(similarTransactions.map((t) => t.id));
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep selection in sync if similarTransactions changes while modal is open
  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(new Set(similarTransactions.map((t) => t.id)));
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, similarTransactions]);

  // Revolut-style: lock background scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const toggleTransaction = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(similarTransactions.map((t) => t.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleConfirm = async () => {
    if (selectedIds.size === 0) {
      setError('Please select at least one transaction');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(Array.from(selectedIds));
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to update transactions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldLabel = field === 'merchant_name' ? 'Merchant Name' : 'Category';

  const similarityLabel = useMemo(() => {
    const n = similarTransactions.length;
    return `Found ${n} similar transaction${n !== 1 ? 's' : ''}`;
  }, [similarTransactions.length]);

  const scrollbarStyles = `
    .batch-modal-scroll::-webkit-scrollbar { width: 6px; }
    .batch-modal-scroll::-webkit-scrollbar-track { background: transparent; }
    .batch-modal-scroll::-webkit-scrollbar-thumb {
      background: ${withOpacity(colors.border.light, 0.5)};
      border-radius: 10px;
    }
    .batch-modal-scroll::-webkit-scrollbar-thumb:hover {
      background: ${withOpacity(colors.border.light, 0.8)};
    }
  `;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            style={{
              position: 'fixed',
              inset: 0,
              background: withOpacity('#000', 0.55),
              zIndex: 9999,
              backdropFilter: 'blur(6px)',
            }}
          />

          {/* Viewport-safe wrapper */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              display: 'grid',
              placeItems: 'center',
              // Safe-area padding for iOS home-indicator / notches
              paddingTop: 'max(16px, env(safe-area-inset-top))',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              paddingLeft: 'max(16px, env(safe-area-inset-left))',
              paddingRight: 'max(16px, env(safe-area-inset-right))',
              pointerEvents: 'none', // allow only modal to be interactive
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                pointerEvents: 'auto',
                width: 'min(92vw, 640px)',
                // Use dvh so the modal respects mobile browser UI chrome
                maxHeight: 'min(86dvh, 760px)',
                height: 'auto',
                background: colors.background.primary,
                borderRadius: '18px',
                boxShadow: `0 24px 70px ${withOpacity('#000', 0.45)}`,
                border: `1px solid ${colors.border.light}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Batch update similar transactions"
            >
              {/* Header */}
              <div
                style={{
                  padding: '1.1rem 1.25rem',
                  borderBottom: `1px solid ${colors.border.light}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: colors.background.primary,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      background: withOpacity(colors.primary.main, 0.1),
                      flexShrink: 0,
                    }}
                  >
                    <Layers style={{ width: '16px', height: '16px', color: colors.primary.main }} />
                  </div>
                  <h2
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 650,
                      color: colors.text.primary,
                      margin: 0,
                      letterSpacing: '-0.01em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Batch Update Similar Transactions
                  </h2>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{
                    background: withOpacity(colors.background.secondary, 0.6),
                    border: `1px solid ${colors.border.light}`,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    padding: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '10px',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                  aria-label="Close"
                >
                  <X style={{ width: '18px', height: '18px', color: colors.text.tertiary }} />
                </motion.button>
              </div>

              {/* Scroll area (the ONLY scroll container) */}
              <div
                className="batch-modal-scroll"
                style={{
                  flex: '1 1 auto',
                  minHeight: 0, // critical so footer doesn't get pushed out
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: '1.1rem 1.25rem 1.25rem',
                }}
              >
                <style>{scrollbarStyles}</style>

                {/* Summary */}
                <div
                  style={{
                    marginBottom: '0.9rem',
                    padding: '0.8rem',
                    background: withOpacity(colors.primary.main, 0.05),
                    borderRadius: '10px',
                    border: `1px solid ${withOpacity(colors.primary.main, 0.12)}`,
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: colors.text.secondary, marginBottom: '0.25rem' }}>
                    {similarityLabel}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: colors.text.primary, fontWeight: 600 }}>
                    Updating: <span style={{ fontWeight: 700 }}>{fieldLabel}</span>
                  </div>
                  <div style={{ fontSize: '0.66rem', color: colors.text.secondary, marginTop: '0.25rem' }}>
                    From: <span style={{ color: colors.text.tertiary }}>&quot;{oldValue}&quot;</span> → To:{' '}
                    <span style={{ color: colors.primary.main, fontWeight: 650 }}>&quot;{newValue}&quot;</span>
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={selectAll}
                    disabled={isSubmitting}
                    style={{
                      fontSize: '0.64rem',
                      padding: '0.42rem 0.8rem',
                      background: withOpacity(colors.primary.main, 0.12),
                      border: `1px solid ${withOpacity(colors.primary.main, 0.22)}`,
                      borderRadius: '10px',
                      color: colors.primary.main,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontWeight: 650,
                      opacity: isSubmitting ? 0.6 : 1,
                    }}
                  >
                    Select all
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={deselectAll}
                    disabled={isSubmitting}
                    style={{
                      fontSize: '0.64rem',
                      padding: '0.42rem 0.8rem',
                      background: colors.background.secondary,
                      border: `1px solid ${colors.border.light}`,
                      borderRadius: '10px',
                      color: colors.text.secondary,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontWeight: 650,
                      opacity: isSubmitting ? 0.6 : 1,
                    }}
                  >
                    Deselect all
                  </motion.button>
                </div>

                {/* List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {similarTransactions.map((t, index) => {
                    const isSelected = selectedIds.has(t.id);
                    const similarityPercent = Math.round(t.similarity_score * 100);

                    // Truncate extremely long descriptions for UI performance
                    const truncatedDescription = t.transaction_description.length > 100
                      ? t.transaction_description.substring(0, 100) + '...'
                      : t.transaction_description;

                    return (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.015 }}
                        onClick={() => !isSubmitting && toggleTransaction(t.id)}
                        style={{
                          padding: '0.8rem',
                          background: isSelected
                            ? withOpacity(colors.primary.main, 0.06)
                            : colors.background.secondary,
                          border: `1px solid ${
                            isSelected ? withOpacity(colors.primary.main, 0.22) : colors.border.light
                          }`,
                          borderRadius: '12px',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: isSubmitting ? 0.65 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          {/* Checkbox */}
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '6px',
                              border: `2px solid ${isSelected ? colors.primary.main : colors.border.light}`,
                              background: isSelected ? colors.primary.main : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '0.1rem',
                            }}
                          >
                            {isSelected && (
                              <Check style={{ width: '11px', height: '11px', color: colors.text.inverse }} />
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.64rem', color: colors.text.tertiary }}>
                                {formatDate(t.transaction_date)}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.58rem',
                                  fontWeight: 700,
                                  padding: '0.14rem 0.45rem',
                                  borderRadius: '6px',
                                  background: withOpacity(colors.status.success, 0.15),
                                  color: colors.status.success,
                                }}
                              >
                                {similarityPercent}% match
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: '0.7rem',
                                color: colors.text.primary,
                                fontWeight: 600,
                                marginBottom: '0.16rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: 'system-ui, -apple-system, sans-serif', // Better Unicode support
                              }}
                              title={t.transaction_description}
                            >
                              {truncatedDescription}
                            </div>

                            <div
                              style={{
                                fontSize: '0.62rem',
                                color: colors.text.secondary,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatCurrency(t.transaction_amount)}
                              </span>
                              {field === 'merchant_name' && t.merchant_name && (
                                <>
                                  <span>•</span>
                                  <span>{t.merchant_name}</span>
                                </>
                              )}
                              {field === 'category' && t.category && (
                                <>
                                  <span>•</span>
                                  <span>{t.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{
                      marginTop: '1rem',
                      padding: '0.8rem',
                      background: withOpacity(colors.status.error, 0.1),
                      border: `1px solid ${withOpacity(colors.status.error, 0.3)}`,
                      borderRadius: '12px',
                      fontSize: '0.68rem',
                      color: colors.status.error,
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </div>

              {/* Footer (always visible) */}
              <div
                style={{
                  flexShrink: 0,
                  padding: '1rem 1.25rem',
                  borderTop: `1px solid ${colors.border.light}`,
                  background: colors.background.primary,
                  position: 'relative',
                }}
              >
                {/* subtle top fade like Revolut */}
                <div
                  style={{
                    position: 'absolute',
                    top: -18,
                    left: 0,
                    right: 0,
                    height: 18,
                    background: `linear-gradient(to top, ${colors.background.primary}, ${withOpacity(
                      colors.background.primary,
                      0
                    )})`,
                    pointerEvents: 'none',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    disabled={isSubmitting}
                    style={{
                      padding: '0.72rem 1.25rem',
                      fontSize: '0.82rem',
                      fontWeight: 650,
                      background: 'transparent',
                      border: `1.5px solid ${colors.border.light}`,
                      borderRadius: '12px',
                      color: colors.text.primary,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1,
                    }}
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    disabled={isSubmitting || selectedIds.size === 0}
                    style={{
                      padding: '0.72rem 1.35rem',
                      fontSize: '0.82rem',
                      fontWeight: 750,
                      background:
                        isSubmitting || selectedIds.size === 0 ? colors.background.tertiary : colors.primary.main,
                      border: 'none',
                      borderRadius: '12px',
                      color: isSubmitting || selectedIds.size === 0 ? colors.text.tertiary : colors.text.inverse,
                      cursor: isSubmitting || selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow:
                        isSubmitting || selectedIds.size === 0
                          ? 'none'
                          : `0 10px 22px ${withOpacity(colors.primary.main, 0.25)}`,
                      opacity: isSubmitting ? 0.9 : 1,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          style={{
                            width: '12px',
                            height: '12px',
                            border: `2px solid ${colors.text.inverse}`,
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                          }}
                        />
                        Updating…
                      </>
                    ) : (
                      `Update ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''}`
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default BatchEditConfirmationModal;
