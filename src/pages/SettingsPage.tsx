// src/pages/SettingsPage.tsx

import { Navigate, Route, Routes } from 'react-router-dom';

import BillingSettings from '../components/Settings/BillingSettings';
import DeveloperSettings from '../components/Settings/DeveloperSettings';
import GeneralSettings from '../components/Settings/GeneralSettings';
import React from 'react';
import SettingsLayout from '../components/Settings/SettingsLayout';
import FeatureGate from '../components/Shared/FeatureGate';

const SettingsPage: React.FC = () => {
  return (
    <SettingsLayout>
      <Routes>
        <Route index element={<Navigate to="general" replace />} />
        <Route path="general" element={<GeneralSettings />} />
        <Route path="billing" element={<BillingSettings />} />
        <Route path="developer" element={<FeatureGate feature="apiAccess"><DeveloperSettings /></FeatureGate>} />
      </Routes>
    </SettingsLayout>
  );
};

export default SettingsPage;
