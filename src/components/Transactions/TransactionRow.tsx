// src/components/Transactions/TransactionRow.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { History } from 'lucide-react';
import { format } from 'date-fns';
import { Transaction } from '../../types';
import { colors, withOpacity } from '../../styles/colors';
import { formatCurrency } from '../../utils/formatters';
import EditableField from './EditableField';
import EditHistoryModal from './EditHistoryModal';
import BatchEditConfirmationModal from './BatchEditConfirmationModal';
import {
  transactionEditService,
  SimilarTransaction,
} from '../../services/transactionEditService';
import { toast } from 'react-toastify';

interface TransactionRowProps {
  transaction: Transaction;
  onTransactionUpdate: (updatedTransaction: Transaction) => void;
  isHighlighted?: boolean;
}

/**
 * Revolut-style transaction row with inline editing capabilities.
 * Features:
 * - Inline editable category and merchant name
 * - Visual indicators for edited fields
 * - Edit history modal
 * - Optimistic updates
 * - Beautiful animations
 */
const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onTransactionUpdate,
  isHighlighted = false,
}) => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [localTransaction, setLocalTransaction] = useState(transaction);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [similarTransactions, setSimilarTransactions] = useState<SimilarTransaction[]>([]);
  const [batchUpdateField, setBatchUpdateField] = useState<'merchant_name' | 'category'>('merchant_name');
  const [batchOldValue, setBatchOldValue] = useState('');
  const [batchNewValue, setBatchNewValue] = useState('');

  const isEdited = (localTransaction.edit_count || 0) > 0;
  const isCategoryEdited = localTransaction.user_edited_fields?.includes('category');
  const isMerchantEdited = localTransaction.user_edited_fields?.includes('merchant_name');

  const handleFieldUpdate = async (field: 'category' | 'merchant_name', newValue: string) => {
    const currentFields = localTransaction.user_edited_fields || [];
    const updatedFields = currentFields.includes(field)
      ? currentFields
      : [...currentFields, field];

    const optimisticTransaction = {
      ...localTransaction,
      [field]: newValue,
      user_edited_fields: updatedFields,
      edit_count: (localTransaction.edit_count || 0) + 1,
      last_edited_at: new Date().toISOString(),
    };

    // Optimistic update
    setLocalTransaction(optimisticTransaction);
    onTransactionUpdate(optimisticTransaction);

    try {
      const oldValue = localTransaction[field] || '';

      const result = await transactionEditService.updateTransaction(localTransaction.id, {
        [field]: newValue,
      });

      // Update with server response
      setLocalTransaction(result.transaction);
      onTransactionUpdate(result.transaction);

      // After successful update, instantly check for similar transactions (Revolut-style)
      // Find transactions similar to the OLD value (what user edited FROM)
      // Then suggest updating them all to the NEW value
      // Non-blocking: Don't wait for similarity results to complete the edit
      transactionEditService.findSimilarTransactions(
        localTransaction.id,
        field,
        oldValue  // Use OLD value to find similar transactions
      ).then((similarResult) => {
        // If similar transactions found, show batch modal instantly
        if (similarResult.count > 0) {
          setSimilarTransactions(similarResult.similar_transactions);
          setBatchUpdateField(field);
          setBatchOldValue(oldValue);
          setBatchNewValue(newValue);
          setIsBatchModalOpen(true);
        }
      }).catch((_similarError: any) => {
        // Gracefully degrade if similarity search fails - edit still succeeds
        // Error tracking handled by Sentry
      });
    } catch (error: any) {
      // Revert on error
      setLocalTransaction(transaction);
      onTransactionUpdate(transaction);

      toast.error(error.response?.data?.detail || error.message || 'Failed to update', {
        autoClose: 3000,
      });
      throw error;
    }
  };

  const handleRevertCategory = async () => {
    try {
      const result = await transactionEditService.revertCategoryToOriginal(localTransaction.id);

      const revertedTransaction = {
        ...localTransaction,
        category: result.original_category,
      };

      setLocalTransaction(revertedTransaction);
      onTransactionUpdate(revertedTransaction);

    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to revert', {
        autoClose: 3000,
      });
      throw error;
    }
  };

  const handleBatchConfirm = async (selectedIds: string[]) => {
    try {
      const updates = {
        [batchUpdateField]: batchNewValue,
      };

      const result = await transactionEditService.batchUpdateTransactions(selectedIds, updates);

      // Handle partial failures
      if (result.failed_count > 0) {
        toast.warning(
          `Updated ${result.updated_count} transactions. ${result.failed_count} failed.`,
          { autoClose: 4000 }
        );
      }

      // Update local transaction state if it was part of the batch
      if (selectedIds.includes(localTransaction.id.toString())) {
        const updatedFields = [...(localTransaction.user_edited_fields || [])];
        if (!updatedFields.includes(batchUpdateField)) {
          updatedFields.push(batchUpdateField);
        }

        const updatedTransaction = {
          ...localTransaction,
          [batchUpdateField]: batchNewValue,
          user_edited_fields: updatedFields,
          edit_count: (localTransaction.edit_count || 0) + 1,
          last_edited_at: new Date().toISOString(),
        };

        setLocalTransaction(updatedTransaction);
        onTransactionUpdate(updatedTransaction);
      }

      // Close modal first for smooth UX (Revolut-style)
      setIsBatchModalOpen(false);

      // Revolut-style: Seamless refresh without full page reload
      // Dispatch event for parent to handle - trust the parent, no fallback reload
      if (typeof window !== 'undefined') {
        // Dispatch custom event for parent to handle
        const refreshEvent = new CustomEvent('transactionsBatchUpdated', {
          detail: {
            updatedIds: selectedIds,
            updateCount: result.updated_count,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(refreshEvent);
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to batch update transactions';

      toast.error(errorMessage, {
        autoClose: 5000,
      });

      // Don't close modal on error so user can retry
      throw error;
    }
  };

  const displayMerchantName =
    localTransaction.merchant_name ||
    localTransaction.transaction_description ||
    'Unknown merchant';

  return (
    <>
      <motion.tr
        id={`transaction-${localTransaction.id}`}
        tabIndex={-1}
        aria-label={isHighlighted ? 'Transaction selected from notification' : undefined}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          backgroundColor: withOpacity(colors.background.tertiary, 0.5),
        }}
        transition={{ duration: 0.2 }}
        style={{
          borderBottom: `1px solid ${colors.border.subtle}`,
          backgroundColor: isHighlighted
            ? withOpacity(colors.primary.main, 0.1)
            : undefined,
          boxShadow: isHighlighted
            ? `inset 4px 0 0 ${colors.primary.main}`
            : undefined,
        }}
      >
        {/* Date */}
        <td
          style={{
            padding: '0.75rem',
            fontSize: '0.65rem',
            color: colors.text.secondary,
            fontWeight: 400,
          }}
        >
          {format(new Date(localTransaction.transaction_date), 'MMM dd, yyyy')}
        </td>

        {/* Description (Read-only) */}
        <td
          style={{
            padding: '0.75rem',
            fontSize: '0.65rem',
            color: colors.text.primary,
            maxWidth: '200px',
          }}
          className="truncate"
          title={localTransaction.transaction_description}
        >
          {localTransaction.transaction_description}
        </td>

        {/* Merchant Name (Editable) — no description fallback here so a
            missing merchant shows the add-merchant placeholder instead of
            masquerading the raw description as a merchant */}
        <td style={{ padding: '0.75rem' }}>
          <EditableField
            value={localTransaction.merchant_name || ''}
            originalValue={localTransaction.original_merchant_name}
            onSave={(newValue) => handleFieldUpdate('merchant_name', newValue)}
            fieldType="merchant_name"
            isEdited={isMerchantEdited}
            placeholder="Click to add merchant name"
          />
        </td>

        {/* Category (Editable) */}
        <td style={{ padding: '0.75rem' }}>
          <EditableField
            value={localTransaction.category}
            originalValue={localTransaction.original_category}
            onSave={(newValue) => handleFieldUpdate('category', newValue)}
            onRevert={handleRevertCategory}
            fieldType="category"
            isEdited={isCategoryEdited}
            placeholder="Click to add category"
          />
        </td>

        {/* Amount */}
        <td
          style={{
            padding: '0.75rem',
            fontSize: '0.65rem',
            fontWeight: 500,
            textAlign: 'right',
            color:
              localTransaction.transaction_type.toLowerCase() === 'credit'
                ? colors.status.success
                : colors.status.error,
          }}
        >
          {localTransaction.transaction_type.toLowerCase() === 'credit' ? '+' : '-'}
          {formatCurrency(Math.abs(localTransaction.transaction_amount))}
        </td>

        {/* Balance */}
        <td
          style={{
            padding: '0.75rem',
            fontSize: '0.65rem',
            color: colors.text.secondary,
            textAlign: 'right',
          }}
        >
          {formatCurrency(localTransaction.balance)}
        </td>

        {/* Edit History Button */}
        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
          {isEdited && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsHistoryModalOpen(true)}
              title="View edit history"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                background: withOpacity(colors.primary.main, 0.1),
                border: `1px solid ${withOpacity(colors.primary.main, 0.2)}`,
                color: colors.primary.main,
                fontSize: '0.625rem',
                fontWeight: 500,
                cursor: 'pointer',
                margin: '0 auto',
              }}
            >
              <History style={{ width: '12px', height: '12px' }} />
              {localTransaction.edit_count}
            </motion.button>
          )}
        </td>
      </motion.tr>

      {/* Edit History Modal */}
      <EditHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        transactionId={localTransaction.id}
        merchantName={displayMerchantName}
      />

      {/* Batch Edit Confirmation Modal */}
      <BatchEditConfirmationModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onConfirm={handleBatchConfirm}
        similarTransactions={similarTransactions}
        field={batchUpdateField}
        oldValue={batchOldValue}
        newValue={batchNewValue}
      />
    </>
  );
};

export default TransactionRow;
