// src/components/Layout/PageWrapper.tsx

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLoading } from '../../context/LoadingContext';
import LoadingState from '../Common/LoadingState';

interface PageWrapperProps {
  children: React.ReactNode;
}

// Cache component renders to prevent unnecessary re-renders
const renderedComponents = new Map<string, React.ReactNode>();

export const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  const { isPersistentLoading, processingVariant, setPageTransitioning } = useLoading();

  // Generate a unique key for this component instance
  const componentKey = useMemo(() => {
    if (React.isValidElement(children)) {
      // Check if type is a function (component) with a name property
      const type = children.type;
      if (typeof type === 'function' && 'name' in type) {
        return type.name || 'unknown';
      }
      // For string types (like 'div') or components without names
      return typeof type === 'string' ? type : 'unknown';
    }
    return 'unknown';
  }, [children]);

  // Store rendered component in cache
  useEffect(() => {
    if (!isPersistentLoading) {
      renderedComponents.set(componentKey, children);
    }

    // Notify loading context when page is ready
    setPageTransitioning(false);

    return () => {
      setPageTransitioning(true);
    };
  }, [children, componentKey, isPersistentLoading, setPageTransitioning]);

  if (isPersistentLoading) {
    return <LoadingState variant={processingVariant} />;
  }

  // Use motion for smooth transitions
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
};