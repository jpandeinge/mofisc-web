// src/componnets/Settings/SettingsLayout.tsx

import { FiCode, FiCreditCard, FiUser } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import React, { ReactNode } from 'react';

interface SettingsLayoutProps {
  children: ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const location = useLocation();

  const tabs = [
    { name: 'General', path: '/settings/general', icon: FiUser },
    { name: 'Billing', path: '/settings/billing', icon: FiCreditCard },
    { name: 'Developer', path: '/settings/developer', icon: FiCode },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-primary shadow-sm rounded-lg overflow-hidden">
        <div className="border-b border-color">
          <nav className="-mb-px flex" aria-label="Tabs">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                to={tab.path}
                className={`${
                  location.pathname === tab.path
                    ? 'border-accent text-accent'
                    : 'border-transparent text-secondary hover:text-primary hover:border-color'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center transition-colors duration-150`}
              >
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
