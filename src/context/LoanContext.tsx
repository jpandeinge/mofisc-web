// src/context/LoanContext.tsx

import React, { createContext, useContext, useState } from 'react';

interface FeedbackState {
  monthlyRepayments: number;
  totalInterestPaid: number;
  totalRepayments: number;
}

interface MortgageFeedbackState extends FeedbackState {
  loanAmount: number;
  minimumMonthlyIncome: number;
  numberOfPayments: number;
  totalRepaymentsMade: number;
}

interface VehicleFinanceFeedbackState extends FeedbackState {
  loanAmount: number;
  balloonValue: number;
  netIncomeRequired: number;
}

interface LoanContextType {
  personalLoan: {
    loanAmount: string;
    interestRate: string;
    repaymentPeriod: string;
    feedback: FeedbackState | null;
  };
  vehicleFinance: {
    purchasePrice: string;
    deposit: string;
    balloonPercentage: string;
    interestRate: string;
    repaymentPeriod: string;
    feedback: VehicleFinanceFeedbackState | null;
  };
  mortgage: {
    loanAmount: string;
    deposit: string;
    interestRate: string;
    repaymentPeriod: string;
    feedback: MortgageFeedbackState | null;
  };
  updatePersonalLoan: (field: string, value: string) => void;
  updateVehicleFinance: (field: string, value: string) => void;
  updateMortgage: (field: string, value: string) => void;
  setPersonalLoanFeedback: (feedback: FeedbackState | null) => void;
  setVehicleFinanceFeedback: (feedback: VehicleFinanceFeedbackState | null) => void;
  setMortgageFeedback: (feedback: MortgageFeedbackState | null) => void;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const LoanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [personalLoan, setPersonalLoan] = useState({
    loanAmount: '',
    interestRate: '',
    repaymentPeriod: '',
    feedback: null as FeedbackState | null,
  });

  const [vehicleFinance, setVehicleFinance] = useState({
    purchasePrice: '',
    deposit: '',
    balloonPercentage: '',
    interestRate: '',
    repaymentPeriod: '',
    feedback: null as VehicleFinanceFeedbackState | null,
  });

  const [mortgage, setMortgage] = useState({
    loanAmount: '',
    deposit: '',
    interestRate: '',
    repaymentPeriod: '',
    feedback: null as MortgageFeedbackState | null,
  });

  const updatePersonalLoan = (field: string, value: string) => {
    setPersonalLoan(prev => ({ ...prev, [field]: value }));
  };

  const updateVehicleFinance = (field: string, value: string) => {
    setVehicleFinance(prev => ({ ...prev, [field]: value }));
  };

  const updateMortgage = (field: string, value: string) => {
    setMortgage(prev => ({ ...prev, [field]: value }));
  };

  const setPersonalLoanFeedback = (feedback: FeedbackState | null) => {
    setPersonalLoan(prev => ({ ...prev, feedback }));
  };

  const setVehicleFinanceFeedback = (feedback: VehicleFinanceFeedbackState | null) => {
    setVehicleFinance(prev => ({ ...prev, feedback }));
  };

  const setMortgageFeedback = (feedback: MortgageFeedbackState | null) => {
    setMortgage(prev => ({ ...prev, feedback }));
  };

  return (
    <LoanContext.Provider value={{
      personalLoan,
      vehicleFinance,
      mortgage,
      updatePersonalLoan,
      updateVehicleFinance,
      updateMortgage,
      setPersonalLoanFeedback,
      setVehicleFinanceFeedback,
      setMortgageFeedback
    }}>
      {children}
    </LoanContext.Provider>
  );
};

export const useLoanContext = () => {
  const context = useContext(LoanContext);
  if (context === undefined) {
    throw new Error('useLoanContext must be used within a LoanProvider');
  }
  return context;
};