// src/components/Layout/Sidebar.tsx

import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { FiLogOut, FiCreditCard, FiFileText, FiHome, FiBarChart2, FiPieChart, FiSettings, FiActivity, FiChevronDown, FiLoader } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useStatementContext } from '../../context/StatementContext';
import { useUserMetrics } from '../../context/UserMetricsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { IconType } from 'react-icons';
import UploadButton from '../Common/UploadButton';
import { Button } from '../UI/button';
import { cn } from '../../lib/utils';
import BankFilter from './BankFilter';
import { useLogout } from '../../hooks/useLogout';

interface MenuItem {
  name: string;
  icon: IconType;
  path: string;
}

const MENU_ITEMS: MenuItem[] = [
  { name: 'Overview', icon: FiHome, path: '/app' },
  { name: 'Insights', icon: FiBarChart2, path: '/insights' },
  { name: 'Planning', icon: FiPieChart, path: '/planning' },
  { name: 'Activity', icon: FiActivity, path: '/activity' },
];

const SETTINGS_ITEMS: MenuItem[] = [
  { name: 'Profile', path: '/settings/general', icon: FiSettings },
  { name: 'Billing', path: '/settings/billing', icon: FiCreditCard },
];

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 }
};

const sidebarVariants = {
  expanded: { width: 280 },
  collapsed: { width: 80 },
  mobileCollapsed: { width: 72 },
};

const isMobileViewport = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(max-width: 767px)').matches;

const Sidebar: React.FC = () => {
  const { isSigningOut, logout } = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentPage, currentBankAccount, setCurrentBankAccount } = useAppContext();
  const { selectedBank, availableBanks, selectBank, isBanksLoading } = useStatementContext();
  const { refreshMetrics, state: metricsState } = useUserMetrics();

  // Handle bank selection - updates both transaction filter and metrics
  const handleBankSelect = useCallback((bankName: string | null) => {
    selectBank(bankName);
    // Refresh metrics from backend with bank filter
    refreshMetrics(bankName);
  }, [selectBank, refreshMetrics]);

  const [isMobile, setIsMobile] = useState(isMobileViewport);
  const [isCollapsed, setIsCollapsed] = useState(isMobileViewport);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
      if (event.matches) {
        setIsCollapsed(true);
        setIsDropdownOpen(false);
        setIsSettingsOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleViewportChange);
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  const toggleCollapse = useCallback(() => {
    if (!isCollapsed) {
      setIsDropdownOpen(false);
      setIsSettingsOpen(false);
    }
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  const handleNavigation = useCallback((item: MenuItem) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      if (location.pathname === item.path) return;
      setCurrentPage(item.name);
      navigate(item.path, { replace: false });
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
        setIsDropdownOpen(false);
        setIsSettingsOpen(false);
      }
    };
  }, [setCurrentPage, navigate, location.pathname]);

  const handleSignOut = useCallback(async () => {
    await logout();
  }, [logout]);

  const renderMenuItem = useCallback((item: MenuItem, isSubItem: boolean = false) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <motion.a
        key={item.path}
        href={item.path}
        onClick={handleNavigation(item)}
        whileHover={{ x: isCollapsed ? 0 : 4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group relative flex items-center rounded-xl transition-all duration-200 cursor-pointer",
          isSubItem ? "py-2 px-3 ml-2 gap-3" : isCollapsed ? "py-3 justify-center" : "py-3 px-4 gap-3",
          isActive
            ? "bg-gradient-to-r from-[#4285F4]/20 to-[#D2E3FC]/30 text-[#174EA6] font-semibold shadow-md"
            : "text-[#5F6368] hover:text-[#174EA6] hover:bg-[#D2E3FC]/30"
        )}
      >
        {/* Active indicator - only show when expanded and not a sub-item */}
        {isActive && !isCollapsed && !isSubItem && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#174EA6] to-[#4285F4] rounded-r-full shadow-md"
          />
        )}

        {/* Active indicator for collapsed state - show as background glow */}
        {isActive && isCollapsed && !isSubItem && (
          <div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#4285F4]/30 to-[#D2E3FC]/20 pointer-events-none"
          />
        )}

        <div className={cn(
          "flex items-center justify-center flex-shrink-0 transition-all duration-200 relative z-10",
          isCollapsed ? "" : "w-5",
          isActive ? "text-[#4285F4]" : "text-[#5F6368] group-hover:text-[#174EA6]"
        )}>
          <Icon
            size={isSubItem ? 18 : 20}
            className={cn(
              "transition-all duration-200",
              "group-hover:scale-110",
              isActive && "drop-shadow-[0_0_8px_rgba(66,133,244,0.4)]"
            )}
          />
        </div>

        {!isCollapsed && (
          <span
            className={cn(
              "font-medium text-sm transition-all relative z-10",
              isActive && "font-semibold"
            )}
          >
            {item.name}
          </span>
        )}

        {/* Hover glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
          "bg-gradient-to-r from-[#4285F4]/5 to-[#D2E3FC]/10",
          isActive && !isCollapsed && "opacity-100"
        )} />
      </motion.a>
    );
  }, [isCollapsed, location.pathname, handleNavigation]);

  // Memoize menu items
  const menuItems = useMemo(() =>
    MENU_ITEMS.map(item => renderMenuItem(item)),
    [renderMenuItem]
  );

  const settingsItems = useMemo(() =>
    SETTINGS_ITEMS.map(item => renderMenuItem(item, true)),
    [renderMenuItem]
  );

  return (
    <>
      <AnimatePresence>
        {isMobile && !isCollapsed && (
          <motion.button
            type="button"
            aria-label="Close navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCollapsed(true)}
            className="fixed inset-0 z-[60] bg-[#174EA6]/20 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>
      <motion.nav
      initial={false}
      animate={
        isCollapsed
          ? isMobile
            ? 'mobileCollapsed'
            : 'collapsed'
          : 'expanded'
      }
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      aria-label="Primary navigation"
      className={cn(
        "flex flex-col h-full overflow-hidden",
        isMobile
          ? "fixed inset-y-0 left-0 z-[70] shadow-2xl"
          : "relative"
      )}
    >
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-[#F1F3F4]/90 to-white/95 backdrop-blur-xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#4285F4]/3 via-transparent to-[#D2E3FC]/5" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#D2E3FC]/40 to-transparent" />

      {/* Content */}
      <div className="relative flex flex-col flex-grow p-4 space-y-4 overflow-y-auto overflow-x-hidden">
        {/* Logo Section */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-2 py-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#174EA6] to-[#4285F4] flex items-center justify-center shadow-md">
              <span className="font-bold text-white text-xl">M</span>
            </div>
            <span className="font-bold text-xl text-[#174EA6]">
              Mofisc
            </span>
          </motion.div>
        )}

        {isCollapsed && (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#174EA6] to-[#4285F4] flex items-center justify-center shadow-md">
              <span className="font-bold text-white text-xl">M</span>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="relative">
          <UploadButton isCollapsed={isCollapsed} />
        </div>

        {/* Library Section Header */}
        {!isCollapsed && (
          <div className="px-2 pt-2">
            <span className="text-xs font-semibold text-[#5F6368] uppercase tracking-wider">
              Library
            </span>
          </div>
        )}

        {/* Account Selector */}
        <div className="relative">
          <Button
            onClick={() => !isCollapsed && setIsDropdownOpen(!isDropdownOpen)}
            variant="outline"
            className={cn(
              "w-full justify-between h-auto py-3 px-4",
              "bg-[#D2E3FC]/20 border-[#D2E3FC]/40 hover:bg-[#D2E3FC]/30 hover:border-[#4285F4]/40",
              "backdrop-blur-sm transition-all duration-200",
              "text-[#174EA6] hover:text-[#174EA6]",
              isDropdownOpen && "bg-[#D2E3FC]/30 border-[#4285F4]/50 ring-2 ring-[#4285F4]/20"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {currentBankAccount === "Bank Statement" ?
                <FiFileText size={20} className="flex-shrink-0 text-[#4285F4]" /> :
                <FiCreditCard size={20} className="flex-shrink-0 text-emerald-500" />
              }
              {!isCollapsed && (
                <span className="truncate font-medium text-sm">
                  {currentBankAccount}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <FiChevronDown
                size={16}
                className={cn(
                  "transform transition-transform duration-200 flex-shrink-0",
                  isDropdownOpen && "rotate-180"
                )}
              />
            )}
          </Button>

          <AnimatePresence>
            {isDropdownOpen && !isCollapsed && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden border border-[#D2E3FC]/50 bg-white/95 backdrop-blur-xl shadow-xl"
              >
                {["Bank Statement", "Bank Account"].map((account) => (
                  <button
                    key={account}
                    onClick={() => {
                      setCurrentBankAccount(account);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-all duration-200 flex items-center gap-3",
                      currentBankAccount === account
                        ? 'bg-gradient-to-r from-[#4285F4]/20 to-[#D2E3FC]/30 text-[#174EA6] font-semibold'
                        : 'hover:bg-[#D2E3FC]/20 text-[#5F6368] hover:text-[#174EA6]'
                    )}
                  >
                    {account === "Bank Statement" ?
                      <FiFileText size={18} /> :
                      <FiCreditCard size={18} />
                    }
                    <span className="text-sm font-medium">{account}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bank Filter */}
        <BankFilter
          selectedBank={selectedBank}
          availableBanks={availableBanks}
          onSelectBank={handleBankSelect}
          isLoading={isBanksLoading || metricsState.isLoading}
          isCollapsed={isCollapsed}
        />

        {/* Divider */}
        <div className="relative h-px">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D2E3FC]/40 to-transparent" />
        </div>

        {/* Main Menu */}
        <div className="space-y-1">
          {menuItems}
        </div>

        {/* Divider */}
        <div className="relative h-px mt-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D2E3FC]/40 to-transparent" />
        </div>

        {/* Settings Section */}
        <div>
          <Button
            onClick={() => !isCollapsed && setIsSettingsOpen(!isSettingsOpen)}
            variant="ghost"
            className={cn(
              "w-full justify-between h-auto py-3 px-4 cursor-pointer",
              "hover:bg-[#D2E3FC]/30 text-[#5F6368] hover:text-[#174EA6]",
              (isSettingsOpen || location.pathname.startsWith('/settings')) &&
                "bg-gradient-to-r from-[#4285F4]/20 to-[#D2E3FC]/30 text-[#174EA6] font-semibold"
            )}
          >
            <div className="flex items-center gap-3">
              <FiSettings
                size={20}
                className={cn(
                  "transform transition-all duration-300",
                  isSettingsOpen && "rotate-90",
                  location.pathname.startsWith('/settings') && "text-[#4285F4]"
                )}
              />
              {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
            </div>
            {!isCollapsed && (
              <FiChevronDown
                size={16}
                className={cn(
                  "transform transition-transform duration-200",
                  isSettingsOpen && "rotate-180"
                )}
              />
            )}
          </Button>

          <AnimatePresence>
            {isSettingsOpen && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-1 pt-1"
              >
                {settingsItems}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative p-4 border-t border-[#D2E3FC]/30">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D2E3FC]/40 to-transparent" />

        {isCollapsed ? (
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSignOut}
              disabled={isSigningOut}
              aria-label={isSigningOut ? 'Signing out' : 'Sign out'}
              aria-busy={isSigningOut}
              variant="ghost"
              size="icon"
              className="w-full text-[#5F6368] hover:text-[#174EA6] hover:bg-[#D2E3FC]/30 transition-all group"
              title="Sign Out"
            >
              {isSigningOut ? (
                <FiLoader size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <FiLogOut size={20} className="group-hover:scale-110 transition-transform" aria-hidden="true" />
              )}
            </Button>

            <Button
              onClick={toggleCollapse}
              variant="ghost"
              size="icon"
              className="w-full text-[#5F6368] hover:text-[#174EA6] hover:bg-[#D2E3FC]/30 transition-all"
              title="Expand Sidebar"
            >
              <motion.div
                animate={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6L8 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Button
              onClick={handleSignOut}
              disabled={isSigningOut}
              aria-busy={isSigningOut}
              variant="ghost"
              className="flex items-center gap-3 px-4 py-2 text-[#5F6368] hover:text-[#174EA6] hover:bg-[#D2E3FC]/30 transition-all group"
            >
              {isSigningOut ? (
                <FiLoader size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <FiLogOut size={20} className="group-hover:scale-110 transition-transform" aria-hidden="true" />
              )}
              <span className="font-medium text-sm">{isSigningOut ? 'Signing Out…' : 'Sign Out'}</span>
            </Button>

            <Button
              onClick={toggleCollapse}
              variant="ghost"
              size="icon"
              className="text-[#5F6368] hover:text-[#174EA6] hover:bg-[#D2E3FC]/30 transition-all"
              title="Collapse Sidebar"
            >
              <motion.div
                animate={{ rotate: 0 }}
                transition={{ duration: 0.3 }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6L8 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            </Button>
          </div>
        )}
      </div>

      {/* Decorative gradient orbs */}
      <div className="absolute top-20 right-0 w-32 h-32 bg-[#4285F4]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 left-0 w-32 h-32 bg-[#D2E3FC]/10 rounded-full blur-3xl pointer-events-none" />
      </motion.nav>
    </>
  );
};

export default memo(Sidebar);
