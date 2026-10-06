// src/components/Overview/CategoryFilter.tsx

import React, { useState, useRef, useEffect } from 'react';
import { FiFilter, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/CategoryFilter.css';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="filter-dropdown relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full sm:w-32 pl-2 pr-8 py-1.5 bg-[#FFFFFF] border border-[#5F6368]/20 rounded-lg text-2xs focus:outline-none hover:border-[#4285F4]/50 transition-all duration-200 text-[#174EA6] relative"
      >
        <span className="truncate">
          {selectedCategory || 'All Categories'}
        </span>
        <FiFilter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#5F6368]" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ zIndex: 9999 }}
            className="filter-dropdown-content absolute right-0 w-56 mt-2"
          >
            <div className="relative backdrop-blur-md bg-[#FFFFFF] rounded-lg border border-[#5F6368]/20 shadow-lg">
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                <div
                  className="py-1"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <button
                    className={`w-full text-left px-4 py-2 text-2xs transition-colors duration-200 flex items-center justify-between ${
                      !selectedCategory
                        ? 'text-[#4285F4] bg-[#4285F4]/10'
                        : 'text-[#174EA6] hover:bg-[#4285F4]/10'
                    }`}
                    onClick={() => {
                      onCategoryChange(null);
                      setIsOpen(false);
                    }}
                  >
                    <span>All Categories</span>
                    {!selectedCategory && <FiCheck className="w-4 h-4" />}
                  </button>

                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`w-full text-left px-4 py-2 text-2xs transition-colors duration-200 flex items-center justify-between ${
                        selectedCategory === category
                          ? 'text-[#4285F4] bg-[#4285F4]/10'
                          : 'text-[#174EA6] hover:bg-[#4285F4]/10'
                      }`}
                      onClick={() => {
                        onCategoryChange(category);
                        setIsOpen(false);
                      }}
                    >
                      <span>{category}</span>
                      {selectedCategory === category && <FiCheck className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryFilter;