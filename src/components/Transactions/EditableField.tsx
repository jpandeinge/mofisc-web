// src/components/Transactions/EditableField.tsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Check, X, RotateCcw } from 'lucide-react';
import { colors, withOpacity } from '../../styles/colors';
import { toTitleCase } from '../../utils/formatters';

interface EditableFieldProps {
  value: string;
  originalValue?: string | null;
  onSave: (newValue: string) => Promise<void>;
  onRevert?: () => Promise<void>;
  fieldType: 'category' | 'merchant_name';
  isEdited?: boolean;
  placeholder?: string;
  maxLength?: number;
}

/**
 * Revolut-style inline editable field with smooth animations and excellent UX.
 * Features:
 * - Click to edit with smooth transition
 * - Visual indicator for edited fields
 * - Revert to original value option
 * - Optimistic updates with error handling
 * - Keyboard shortcuts (Enter to save, Esc to cancel)
 */
const EditableField: React.FC<EditableFieldProps> = ({
  value,
  originalValue,
  onSave,
  onRevert,
  fieldType,
  isEdited = false,
  placeholder = 'Click to edit',
  maxLength = fieldType === 'category' ? 100 : 500,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = async () => {
    if (localValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }

    if (!localValue.trim()) {
      setError(`${fieldType === 'category' ? 'Category' : 'Merchant name'} cannot be empty`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Apply Title Case formatting before saving
      const formattedValue = toTitleCase(localValue.trim());
      await onSave(formattedValue);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to save');
      setLocalValue(value); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalValue(value);
    setError(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleRevert = async () => {
    if (!onRevert) return;

    setIsSaving(true);
    setError(null);

    try {
      await onRevert();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to revert');
    } finally {
      setIsSaving(false);
    }
  };

  const canRevert = fieldType === 'category' && originalValue && originalValue !== value;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <AnimatePresence mode="wait">
        {!isEditing ? (
          // Display mode
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsEditing(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsEditing(true);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Edit ${fieldType === 'category' ? 'category' : 'merchant name'}. Current value: ${value || 'empty'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              background: isEdited
                ? withOpacity(colors.status.warning, 0.08)
                : 'transparent',
              border: `1px solid ${isEdited ? withOpacity(colors.status.warning, 0.2) : 'transparent'}`,
              transition: 'all 0.2s ease',
              minHeight: '28px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isEdited
                ? withOpacity(colors.status.warning, 0.12)
                : withOpacity(colors.border.light, 0.5);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isEdited
                ? withOpacity(colors.status.warning, 0.08)
                : 'transparent';
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: '0.65rem',
                color: value ? colors.text.primary : colors.text.tertiary,
                fontWeight: isEdited ? 500 : 400,
              }}
            >
              {value || placeholder}
            </span>

            {isEdited && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  fontSize: '0.55rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.25rem',
                  borderRadius: '3px',
                  background: withOpacity(colors.status.warning, 0.15),
                  color: colors.status.warning,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Edited
              </motion.span>
            )}

            <Edit2
              style={{
                width: '12px',
                height: '12px',
                color: colors.text.tertiary,
                flexShrink: 0,
              }}
            />
          </motion.div>
        ) : (
          // Edit mode
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: colors.background.secondary,
                borderRadius: '6px',
                border: `1px solid ${colors.primary.main}`,
                padding: '0.125rem',
                boxShadow: `0 0 0 2px ${withOpacity(colors.primary.main, 0.1)}`,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={maxLength}
                disabled={isSaving}
                aria-label={`${fieldType === 'category' ? 'Category' : 'Merchant name'} input`}
                aria-describedby={error ? 'edit-error' : undefined}
                style={{
                  flex: 1,
                  padding: '0.375rem',
                  fontSize: '0.65rem',
                  color: colors.text.primary,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                }}
                placeholder={placeholder}
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={isSaving}
                aria-label="Save changes"
                title="Save (Enter)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '4px',
                  background: colors.status.success,
                  border: 'none',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                <Check style={{ width: '14px', height: '14px', color: colors.text.inverse }} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                disabled={isSaving}
                aria-label="Cancel editing"
                title="Cancel (Esc)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '4px',
                  background: colors.background.tertiary,
                  border: `1px solid ${colors.border.light}`,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                <X style={{ width: '14px', height: '14px', color: colors.text.secondary }} />
              </motion.button>

              {canRevert && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRevert}
                  disabled={isSaving}
                  aria-label={`Revert to original ${fieldType}`}
                  title={`Revert to original: ${originalValue}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '4px',
                    background: withOpacity(colors.status.info, 0.1),
                    border: `1px solid ${withOpacity(colors.status.info, 0.3)}`,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  <RotateCcw
                    style={{ width: '12px', height: '12px', color: colors.status.info }}
                  />
                </motion.button>
              )}
            </div>

            {error && (
              <motion.div
                id="edit-error"
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  fontSize: '0.625rem',
                  color: colors.status.error,
                  padding: '0.25rem 0.375rem',
                }}
              >
                {error}
              </motion.div>
            )}

            {canRevert && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  fontSize: '0.625rem',
                  color: colors.text.tertiary,
                  padding: '0.25rem 0.375rem',
                }}
              >
                Original: <strong>{originalValue}</strong>
              </motion.div>
            )}

            <div
              style={{
                fontSize: '0.55rem',
                color: colors.text.tertiary,
                padding: '0 0.375rem',
              }}
            >
              Press <kbd style={{
                padding: '0.0625rem 0.125rem',
                background: colors.background.tertiary,
                borderRadius: '2px',
                border: `1px solid ${colors.border.subtle}`,
                fontSize: '0.55rem',
              }}>Enter</kbd> to save • <kbd style={{
                padding: '0.0625rem 0.125rem',
                background: colors.background.tertiary,
                borderRadius: '2px',
                border: `1px solid ${colors.border.subtle}`,
                fontSize: '0.55rem',
              }}>Esc</kbd> to cancel
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditableField;
