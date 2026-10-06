import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import { useStatementContext } from '../../context/StatementContext';
import { uploadStatement } from '../../utils/api';
import { useLoading } from '../../context/LoadingContext';
import { toast } from 'react-toastify';
import { cn } from '../../lib/utils';
import UpgradeLimitModal, { LimitError } from '../Shared/UpgradeLimitModal';
import { useSubscription } from '../../context/SubscriptionContext';
import { secureLogger } from '../../utils/secureLogger';

interface UploadButtonProps {
  isCollapsed?: boolean;
}

export const UploadButton: React.FC<UploadButtonProps> = ({ isCollapsed = false }) => {
  const { setTransactions, setMetrics, loadTransactions, loadAllTransactions, setViewMode } = useStatementContext();
  const { setIsProcessing, setProcessingVariant, setPersistentLoading } = useLoading();
  const { subscription, effectivePlan, refreshUsage } = useSubscription();
  const [uploadState, setUploadState] = useState({ status: 'idle', progress: 0 });
  const [limitError, setLimitError] = useState<LimitError | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are supported');
      setUploadState({ status: 'error', progress: 0 });
      return;
    }

    try {
      setUploadState({ status: 'processing', progress: 0 });
      setIsProcessing(true);
      setProcessingVariant('upload');
      setPersistentLoading(true);

      const data = await uploadStatement(file);

      if (data && data.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        if (data.metrics) {
          setMetrics(data.metrics);
        }

        try {
          await loadAllTransactions();
          setViewMode('aggregated');
        } catch (error) {
          secureLogger.error('UploadButton', 'Failed to load aggregated data after upload', error);
          await loadTransactions(1);
        }

        toast.success('Statement processed successfully');
        setUploadState({ status: 'success', progress: 100 });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      const serverError =
        error?.response?.data?.detail ||
        error?.detail ||
        error?.data ||
        error?.response?.data ||
        error ||
        {};
      const errorCode = serverError?.error || serverError?.code;
      const message =
        serverError?.message ||
        error?.message ||
        'Failed to process statement';

      const isPlanLimit =
        errorCode === 'transaction_limit_exceeded' ||
        errorCode === 'bank_limit_exceeded' ||
        error?.response?.status === 403 ||
        serverError?.upgrade_url === '/pricing' ||
        (serverError?.current_plan && serverError?.limit);

      if (isPlanLimit) {
        refreshUsage?.().catch(() => {});
        const limitData: LimitError = {
          type: errorCode === 'bank_limit_exceeded' ? 'bank_limit_exceeded' : 'transaction_limit_exceeded',
          message: message || 'You have reached your plan limit. Please upgrade to continue.',
          currentCount:
            serverError.current_count ??
            serverError.current_banks ??
            serverError.transactions_used,
          limit:
            serverError.limit ??
            serverError.transactions_limit ??
            (effectivePlan === 'basic' ? 300 : effectivePlan === 'free' ? 100 : undefined),
          currentPlan: serverError.current_plan || effectivePlan || subscription?.plan || 'free',
          hiddenTransactions: serverError.hidden_transactions,
          totalTransactions:
            serverError.current_count ??
            serverError.current_banks ??
            serverError.total_transactions,
        };
        setLimitError(limitData);
        setIsUpgradeModalOpen(true);
        setUploadState({ status: 'error', progress: 0 });
        // Clear file input to avoid repeat attempts without action
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      toast.error(message || 'Failed to process statement');
      setUploadState({ status: 'error', progress: 0 });
    } finally {
      setIsProcessing(false);
      setPersistentLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadState({ status: 'idle', progress: 0 }), 2000);
    }
  };

  return (
    <div className="relative">
      {limitError && (
        <UpgradeLimitModal
          isOpen={isUpgradeModalOpen}
          onClose={() => {
            setIsUpgradeModalOpen(false);
            refreshUsage?.();
          }}
          limitError={limitError}
        />
      )}

      <motion.button
        whileHover={{ scale: uploadState.status === 'idle' ? 1.02 : 1 }}
        whileTap={{ scale: uploadState.status === 'idle' ? 0.98 : 1 }}
        onClick={() => uploadState.status === 'idle' && fileInputRef.current?.click()}
        disabled={uploadState.status !== 'idle'}
        className={cn(
          "w-full rounded-xl font-semibold transition-all duration-200 shadow-lg overflow-hidden",
          "disabled:cursor-not-allowed",
          isCollapsed ? "p-3" : "py-3 px-4",
          uploadState.status === 'idle' && "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-blue-500/30",
          uploadState.status === 'processing' && "bg-gradient-to-r from-blue-600 to-blue-700",
          uploadState.status === 'success' && "bg-gradient-to-r from-emerald-600 to-emerald-700",
          uploadState.status === 'error' && "bg-gradient-to-r from-red-600 to-red-700"
        )}
      >
        <AnimatePresence mode="wait">
          {uploadState.status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "flex items-center text-white",
                isCollapsed ? "justify-center" : "justify-center gap-2"
              )}
            >
              <FiUpload size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">New Statement</span>}
            </motion.div>
          )}

          {uploadState.status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "flex items-center text-white",
                isCollapsed ? "justify-center" : "justify-center gap-2"
              )}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FiLoader size={20} className="flex-shrink-0" />
              </motion.div>
              {!isCollapsed && <span className="text-sm">Processing...</span>}
            </motion.div>
          )}

          {uploadState.status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "flex items-center text-white",
                isCollapsed ? "justify-center" : "justify-center gap-2"
              )}
            >
              <FiCheck size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">Success!</span>}
            </motion.div>
          )}

          {uploadState.status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "flex items-center text-white",
                isCollapsed ? "justify-center" : "justify-center gap-2"
              )}
            >
              <FiX size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">Failed</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
};

export default UploadButton;
