import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, isAfter, isWithinInterval, setMonth, setYear, getMonth, getYear } from 'date-fns';
import { createPortal } from 'react-dom';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date range',
  minDate,
  maxDate,
  disabled = false,
  label,
  className = '',
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value.startDate || new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
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

  const isDateInRange = (date: Date): boolean => {
    if (!value.startDate || !value.endDate) return false;
    return isWithinInterval(date, { start: value.startDate, end: value.endDate });
  };

  const isDateInHoverRange = (date: Date): boolean => {
    if (!value.startDate || !hoveredDate || selectingStart) return false;

    const start = value.startDate;
    const end = hoveredDate;

    if (isBefore(end, start)) return false;

    return isWithinInterval(date, { start, end });
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (selectingStart || !value.startDate) {
      onChange({ startDate: date, endDate: null });
      setSelectingStart(false);
    } else {
      if (isBefore(date, value.startDate)) {
        onChange({ startDate: date, endDate: value.startDate });
      } else {
        onChange({ startDate: value.startDate, endDate: date });
      }
      setIsOpen(false);
      setSelectingStart(true);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ startDate: null, endDate: null });
    setSelectingStart(true);
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
            const isStartDate = value.startDate && isSameDay(date, value.startDate);
            const isEndDate = value.endDate && isSameDay(date, value.endDate);
            const isInRange = isDateInRange(date);
            const isInHoverRange = isDateInHoverRange(date);
            const isCurrentDay = isToday(date);
            const isDisabled = isDateDisabled(date);

            return (
              <motion.button
                key={date.getTime()}
                onClick={() => handleDateSelect(date)}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                disabled={isDisabled}
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                className={`
                  w-7 h-7 text-xs rounded-md transition-all duration-200 flex items-center justify-center relative font-medium
                  ${isStartDate || isEndDate
                    ? 'bg-[#4285F4] text-white shadow-lg z-10'
                    : isInRange || isInHoverRange
                    ? 'bg-[#4285F4]/20 text-[#4285F4] border border-[#4285F4]/30'
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

  const formatDisplayValue = () => {
    if (!value.startDate && !value.endDate) return placeholder;
    if (value.startDate && !value.endDate) {
      return `${format(value.startDate, 'MMM dd, yyyy')} - ...`;
    }
    if (value.startDate && value.endDate) {
      return `${format(value.startDate, 'MMM dd')} - ${format(value.endDate, 'MMM dd, yyyy')}`;
    }
    return placeholder;
  };

  const getQuickRanges = () => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    const last3Months = new Date();
    last3Months.setMonth(today.getMonth() - 3);

    return [
      { label: 'Last 7 days', range: { startDate: lastWeek, endDate: today } },
      { label: 'Last 30 days', range: { startDate: lastMonth, endDate: today } },
      { label: 'Last 3 months', range: { startDate: last3Months, endDate: today } }
    ];
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
            <span className={value.startDate || value.endDate ? 'text-[#174EA6]' : 'text-[#5F6368]'}>
              {formatDisplayValue()}
            </span>
          </div>
          {(value.startDate || value.endDate) && !disabled && (
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
            className="fixed z-[9999] bg-[#F1F3F4] border border-[#5F6368]/20 rounded-xl shadow-2xl p-3 w-[320px] max-h-[400px] overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left
            }}
          >
            {/* Current selection status */}
            <div className="mb-3 text-xs text-[#5F6368]">
              {selectingStart || !value.startDate ? 'Select start date' : 'Select end date'}
            </div>

            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 hover:bg-[#5F6368]/20 rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#174EA6]" />
              </button>

              <div className="flex items-center space-x-1.5">
                {/* Month Selector */}
                <div className="relative">
                  <button
                    onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                    className="bg-[#FFFFFF] border border-[#5F6368]/30 rounded-md px-2 py-1 text-xs text-[#174EA6]
                             focus:outline-none focus:border-[#4285F4]/50 focus:ring-1 focus:ring-[#4285F4]/20
                             hover:border-[#5F6368]/50 transition-all cursor-pointer w-[80px] flex items-center justify-between"
                  >
                    <span>{format(setMonth(new Date(), getMonth(currentMonth)), 'MMM')}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  <AnimatePresence>
                    {monthDropdownOpen && (
                      <motion.div
                        ref={monthDropdownRef}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full mt-1 left-0 bg-[#F1F3F4] border border-[#5F6368]/30 rounded-md w-[80px] max-h-[120px] overflow-y-auto z-[10000] shadow-lg"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setCurrentMonth(setMonth(currentMonth, i));
                              setMonthDropdownOpen(false);
                            }}
                            className="w-full text-left px-2 py-1 text-xs text-[#174EA6] hover:bg-[#5F6368]/30 transition-colors"
                          >
                            {format(setMonth(new Date(), i), 'MMM')}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Year Selector */}
                <div className="relative">
                  <button
                    onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                    className="bg-[#FFFFFF] border border-[#5F6368]/30 rounded-md px-2 py-1 text-xs text-[#174EA6]
                             focus:outline-none focus:border-[#4285F4]/50 focus:ring-1 focus:ring-[#4285F4]/20
                             hover:border-[#5F6368]/50 transition-all cursor-pointer w-[70px] flex items-center justify-between"
                  >
                    <span>{getYear(currentMonth)}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  <AnimatePresence>
                    {yearDropdownOpen && (
                      <motion.div
                        ref={yearDropdownRef}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full mt-1 left-0 bg-[#F1F3F4] border border-[#5F6368]/30 rounded-md w-[70px] max-h-[120px] overflow-y-auto z-[10000] shadow-lg"
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
                                onClick={() => {
                                  setCurrentMonth(setYear(currentMonth, year));
                                  setYearDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1 text-xs hover:bg-[#5F6368]/30 transition-colors ${
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

            {/* Quick ranges and actions */}
            <div className="mt-3 pt-2 border-t border-[#5F6368]/20">
              <div className="flex flex-wrap gap-1 mb-2">
                {getQuickRanges().map((quickRange, index) => (
                  <button
                    key={index}
                    onClick={() => onChange(quickRange.range)}
                    className="text-xs px-2 py-1 bg-[#5F6368]/20 hover:bg-[#5F6368]/30
                             text-[#174EA6] rounded transition-colors"
                  >
                    {quickRange.label}
                  </button>
                ))}
              </div>

              <div className="flex space-x-1.5">
                <button
                  onClick={handleClear}
                  className="flex-1 text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30
                           text-red-400 rounded transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-xs px-2 py-1 bg-[#4285F4]/20 hover:bg-[#4285F4]/30
                           text-[#4285F4] rounded transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default DateRangePicker;