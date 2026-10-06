// src/components/Layout/BankFilter.tsx

import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiLayers } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { BankInfo } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '../UI/button';

// Bank logos mapping
const BANK_LOGOS: Record<string, string> = {
  'First National Bank Namibia': '/images/banks/fnb.png',
  'Standard Bank Namibia': '/images/banks/standard_bank.png',
  'Nedbank Namibia': '/images/banks/nedbank.png',
  'Bank Windhoek': '/images/banks/bank_windhoek.png',
};

interface BankFilterProps {
  selectedBank: string | null;
  availableBanks: BankInfo[];
  onSelectBank: (bankName: string | null) => void;
  isLoading?: boolean;
  isCollapsed?: boolean;
}

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 }
};

const BankFilter: React.FC<BankFilterProps> = ({
  selectedBank,
  availableBanks,
  onSelectBank,
  isLoading = false,
  isCollapsed = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown (production fintech UX pattern)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Don't render if no banks available
  if (availableBanks.length === 0) {
    return null;
  }

  const totalTransactions = availableBanks.reduce((sum, b) => sum + b.transaction_count, 0);
  const selectedBankInfo = availableBanks.find(b => b.name === selectedBank);

  const getBankLogo = (bankName: string) => {
    return BANK_LOGOS[bankName] || null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label */}
      {!isCollapsed && (
        <div className="px-4 py-2">
          <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">
            Filter by Bank
          </span>
        </div>
      )}

      {/* Bank Selector Button */}
      <Button
        onClick={() => !isCollapsed && setIsOpen(!isOpen)}
        variant="outline"
        disabled={isLoading}
        className={cn(
          "w-full justify-between h-auto py-3 px-4",
          "bg-[#D2E3FC]/20 border-[#D2E3FC]/40 hover:bg-[#D2E3FC]/30 hover:border-[#4285F4]/40",
          "backdrop-blur-sm transition-all duration-200",
          "text-[#174EA6] hover:text-[#174EA6]",
          isOpen && "bg-[#D2E3FC]/30 border-[#4285F4]/50 ring-2 ring-[#4285F4]/20",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {selectedBank ? (
            getBankLogo(selectedBank) ? (
              <img
                src={getBankLogo(selectedBank)!}
                alt={selectedBank}
                className="flex-shrink-0 w-6 h-6 object-contain rounded"
              />
            ) : (
              <span className={cn(
                "flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                "bg-[#4285F4]/10 text-[#174EA6]"
              )}>
                {selectedBank.substring(0, 2).toUpperCase()}
              </span>
            )
          ) : (
            <FiLayers size={20} className="flex-shrink-0 text-[#4285F4]" />
          )}
          {!isCollapsed && (
            <div className="flex flex-col items-start min-w-0">
              <span className="truncate font-medium text-sm">
                {selectedBank ? selectedBankInfo?.display_name : 'All Banks'}
              </span>
              <span className="text-xs text-[#5F6368]">
                {selectedBank
                  ? `${selectedBankInfo?.transaction_count || 0} transactions`
                  : `${totalTransactions} transactions`}
              </span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <FiChevronDown
            size={16}
            className={cn(
              "transform transition-transform duration-200 flex-shrink-0",
              isOpen && "rotate-180"
            )}
          />
        )}
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden border border-[#D2E3FC]/50 bg-white/98 backdrop-blur-xl shadow-xl"
          >
            {/* All Banks option */}
            <button
              onClick={() => {
                onSelectBank(null);
                setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 transition-all duration-200 flex items-center gap-3",
                selectedBank === null
                  ? 'bg-gradient-to-r from-[#4285F4]/15 to-[#D2E3FC]/20 text-[#174EA6] font-semibold'
                  : 'hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#174EA6]'
              )}
            >
              <FiLayers size={18} className={selectedBank === null ? "text-[#4285F4]" : "text-[#5F6368]"} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">All Banks</span>
                <span className="text-xs text-[#5F6368]">{totalTransactions} transactions</span>
              </div>
            </button>

            {/* Divider */}
            <div className="h-px bg-[#D2E3FC]/40 mx-2" />

            {/* Individual banks */}
            {availableBanks.map((bank) => {
              const logo = getBankLogo(bank.name);
              return (
                <button
                  key={bank.name}
                  onClick={() => {
                    onSelectBank(bank.name);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-all duration-200 flex items-center gap-3",
                    selectedBank === bank.name
                      ? 'bg-gradient-to-r from-[#4285F4]/15 to-[#D2E3FC]/20 text-[#174EA6] font-semibold'
                      : 'hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#174EA6]'
                  )}
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt={bank.name}
                      className="flex-shrink-0 w-6 h-6 object-contain rounded"
                    />
                  ) : (
                    <span className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                      "bg-[#4285F4]/10 text-[#174EA6]"
                    )}>
                      {bank.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{bank.display_name}</span>
                    <span className="text-xs text-[#5F6368]">{bank.transaction_count} transactions</span>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BankFilter;
