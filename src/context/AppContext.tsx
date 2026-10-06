import React, { createContext, useContext, useState } from 'react';

type AppContextType = {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  currentBankAccount: string;
  setCurrentBankAccount: (account: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('Overview');
  const [currentBankAccount, setCurrentBankAccount] = useState<string>("Bank Statement");

  return (
    <AppContext.Provider value={{ currentPage, setCurrentPage, currentBankAccount, setCurrentBankAccount }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};