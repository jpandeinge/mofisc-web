// src/components/Common/EmptyState.tsx

import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Upload } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: React.ReactNode;
  icon?: React.ReactNode;
  sectionLabel?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  sectionLabel,
}) => {
  const headingId = useId();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby={headingId}
      className="flex min-h-[80vh] items-center justify-center px-6"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        className="w-full max-w-2xl text-center"
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--color-bg-tertiary)] text-[color:var(--text-primary)]"
        >
          {icon || <Upload className="h-5 w-5" />}
        </div>

        {sectionLabel && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
            {sectionLabel}
          </p>
        )}

        <h1
          id={headingId}
          className="mt-3 text-pretty text-3xl font-semibold tracking-tight text-[color:var(--text-primary)]"
        >
          {title}
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-6 text-[color:var(--text-secondary)]">
          {description}
        </p>
      </motion.div>
    </section>
  );
};

export default EmptyState;
