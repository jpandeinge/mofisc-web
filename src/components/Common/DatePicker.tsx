import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, isAfter, setMonth, setYear, getMonth, getYear } from 'date-fns';
import { createPortal } from 'react-dom';

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
  label,
  className = '',
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsideMonthDropdown = monthDropdownRef.current && !monthDropdownRef.current.contains(target);
      const isOutsideYearDropdown = yearDropdownRef.current && !yearDropdownRef.current.contains(target);

      if (isOutsideContainer && isOutsideDropdown && isOutsideMonthDropdown && isOutsideYearDropdown) {
        setIsOpen(false);
        setMonthDropdownOpen(false);
        setYearDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);

      // Calculate dropdown position
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX
        });
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);


  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    onChange(date);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  // Helper function to render a single month calendar
  const renderMonthCalendar = (monthDate: Date, monthIndex: number) => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate)
    });

    const firstDayOfMonth = startOfMonth(monthDate);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

    return (
      <div key={monthIndex} className="flex-1 min-w-0 bg-[#FFFFFF]/20 rounded-lg p-2">
        {/* Month header */}
        <div className="text-center mb-2">
          <h4 className="text-sm font-semibold text-[#174EA6]">
            {format(monthDate, 'MMMM yyyy')}
          </h4>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-[#4285F4] py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the month starts */}
          {emptyDays.map(day => (
            <div key={`empty-${day}`} className="w-7 h-7" />
          ))}

          {/* Days of the month */}
          {daysInMonth.map(date => {
            const isSelected = value && isSameDay(date, value);
            const isCurrentDay = isToday(date);
            const isDisabled = isDateDisabled(date);

            return (
              <motion.button
                key={date.getTime()}
                onClick={() => handleDateSelect(date)}
                disabled={isDisabled}
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                className={`
                  w-7 h-7 text-xs rounded-md transition-all duration-200 flex items-center justify-center font-medium
                  ${isSelected
                    ? 'bg-[#4285F4] text-white shadow-lg'
                    : isCurrentDay
                    ? 'bg-[#4285F4]/20 text-[#4285F4] border border-[#4285F4]/50'
                    : 'text-[#174EA6] hover:bg-[#5F6368]/30 hover:text-white'
                  }
                  ${isDisabled
                    ? 'text-[#5F6368]/50 cursor-not-allowed'
                    : 'cursor-pointer'
                  }
                `}
              >
                {format(date, 'd')}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-[#174EA6] mb-1">
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          relative w-full ${sizeClasses[size]}
          bg-[#FFFFFF]/50 border border-[#5F6368]/20 rounded-lg
          focus:outline-none focus:border-[#4285F4]/50 transition-colors backdrop-blur-sm
          text-[#174EA6] cursor-pointer hover:border-[#5F6368]/40
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isOpen ? 'border-[#4285F4]/50' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#5F6368]" />
            <span className={value ? 'text-[#174EA6]' : 'text-[#5F6368]'}>
              {value ? format(value, 'MMM dd, yyyy') : placeholder}
            </span>
          </div>
          {value && !disabled && (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-[#5F6368]/20 rounded transition-colors"
            >
              <X className="w-3 h-3 text-[#5F6368]" />
            </button>
          )}
        </div>
      </div>

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[9999] bg-[#F1F3F4] border border-[#5F6368]/20 rounded-xl shadow-2xl p-3 w-[300px] max-h-[400px] overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left
            }}
          >
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 hover:bg-[#5F6368]/20 rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#174EA6]" />
              </button>

              <div className="flex items-center space-x-1.5">
                {/* Custom Month Selector */}
                <div className="relative" ref={monthDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMonthDropdownOpen(!monthDropdownOpen);
                      setYearDropdownOpen(false);
                    }}
                    className="bg-[#FFFFFF] border border-[#5F6368]/30 rounded-md px-2 py-1 text-xs text-[#174EA6]
                             focus:outline-none focus:border-[#4285F4]/50 hover:border-[#5F6368]/50 transition-all
                             cursor-pointer w-[80px] flex items-center justify-between"
                  >
                    <span>{format(setMonth(new Date(), getMonth(currentMonth)), 'MMM')}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${monthDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {monthDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full left-0 mt-1 w-[80px] bg-[#F1F3F4] border border-[#5F6368]/30 rounded-md shadow-lg z-[10000] max-h-[150px] overflow-y-auto"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentMonth(setMonth(currentMonth, i));
                              setMonthDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2 py-1 text-xs hover:bg-[#5F6368]/20 transition-colors ${
                              getMonth(currentMonth) === i ? 'bg-[#4285F4]/20 text-[#4285F4]' : 'text-[#174EA6]'
                            }`}
                          >
                            {format(setMonth(new Date(), i), 'MMM')}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Custom Year Selector */}
                <div className="relative" ref={yearDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setYearDropdownOpen(!yearDropdownOpen);
                      setMonthDropdownOpen(false);
                    }}
                    className="bg-[#FFFFFF] border border-[#5F6368]/30 rounded-md px-2 py-1 text-xs text-[#174EA6]
                             focus:outline-none focus:border-[#4285F4]/50 hover:border-[#5F6368]/50 transition-all
                             cursor-pointer w-[70px] flex items-center justify-between"
                  >
                    <span>{getYear(currentMonth)}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${yearDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {yearDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full left-0 mt-1 w-[70px] bg-[#F1F3F4] border border-[#5F6368]/30 rounded-md shadow-lg z-[10000] max-h-[150px] overflow-y-auto"
                      >
                        {(() => {
                          const currentYear = getYear(new Date());
                          const minYear = minDate ? getYear(minDate) : currentYear - 20;
                          const maxYear = maxDate ? getYear(maxDate) : currentYear + 30;
                          const yearRange = maxYear - minYear + 1;

                          return Array.from({ length: yearRange }, (_, i) => {
                            const year = minYear + i;
                            return (
                              <button
                                key={year}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentMonth(setYear(currentMonth, year));
                                  setYearDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1 text-xs hover:bg-[#5F6368]/20 transition-colors ${
                                  getYear(currentMonth) === year ? 'bg-[#4285F4]/20 text-[#4285F4]' : 'text-[#174EA6]'
                                }`}
                              >
                                {year}
                              </button>
                            );
                          });
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={() => navigateMonth('next')}
                className="p-1.5 hover:bg-[#5F6368]/20 rounded-md transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#174EA6]" />
              </button>
            </div>

            {/* Single month calendar view */}
            <div className="flex justify-center">
              {renderMonthCalendar(currentMonth, 0)}
            </div>

            {/* Quick actions */}
            <div className="flex space-x-1.5 mt-3 pt-2 border-t border-[#5F6368]/20">
              <button
                onClick={() => handleDateSelect(new Date())}
                className="flex-1 text-xs px-2 py-1 bg-[#5F6368]/20 hover:bg-[#5F6368]/30
                         text-[#174EA6] rounded transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleClear}
                className="flex-1 text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30
                         text-red-400 rounded transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default DatePicker;