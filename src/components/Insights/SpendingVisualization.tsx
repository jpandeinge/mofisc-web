// src/components/Insights/SpendingVisualization.tsx

import React, { useMemo, useState } from 'react';
import type { GeoJsonObject } from 'geojson';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isWithinInterval, parseISO } from 'date-fns';
import {
  ArrowDownRight,
  ArrowUpRight,
  MapPin,
  Layers,
  Store,
  ShoppingCart,
  ShoppingBag,
  Car,
  Plane,
  Fuel,
  Film,
  Music,
  Gamepad2,
  Utensils,
  Coffee,
  Zap,
  Droplet,
  Wifi,
  Phone,
  Home,
  Shield,
  Heart,
  GraduationCap,
  Book,
  Hotel,
  Globe,
  Church,
  PawPrint,
  Banknote,
  CreditCard,
  TrendingUp,
  Building,
  Pill,
  Scissors,
  DollarSign,
  Briefcase,
  Gift,
} from 'lucide-react';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { PeriodOption, getPeriodStart, periodOptions } from '../../utils/chartUtils';
import { colors, withOpacity } from '../../styles/colors';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import NAMIBIA_TOPO from '../../data/namibia-regions.json';

// Region centers for labels (matching real GeoJSON data)
const NAMIBIA_REGION_CENTERS: Array<{
  name: string;
  coordinates: [number, number];
}> = [
  { name: 'Zambezi Region', coordinates: [23.5, -17.8] },
  { name: 'Kavango-East Region', coordinates: [20.5, -17.9] },
  { name: 'Kavango-West Region', coordinates: [18.7, -17.8] },
  { name: 'Kunene Region', coordinates: [14.0, -19.5] },
  { name: 'Omusati Region', coordinates: [15.2, -17.9] },
  { name: 'Oshana Region', coordinates: [16.0, -17.9] },
  { name: 'Ohangwena Region', coordinates: [17.0, -17.7] },
  { name: 'Oshikoto Region', coordinates: [17.2, -18.8] },
  { name: 'Otjozondjupa Region', coordinates: [18.5, -20.0] },
  { name: 'Omaheke Region', coordinates: [19.0, -22.8] },
  { name: 'Erongo Region', coordinates: [15.5, -22.5] },
  { name: 'Khomas Region', coordinates: [17.0, -24.0] },
  { name: 'Hardap Region', coordinates: [17.5, -25.5] },
  { name: 'ǁKaras Region', coordinates: [17.5, -27.5] },
];

// All major Namibian towns and cities with accurate coordinates
const NAMIBIA_CITIES: Array<{
  name: string;
  coordinates: [number, number];
  region: string;
  isCapital?: boolean;
}> = [
  // Capital
  { name: 'Windhoek', coordinates: [17.0658, -22.5609], region: 'Khomas', isCapital: true },
  // Coastal towns
  { name: 'Swakopmund', coordinates: [14.5269, -22.6792], region: 'Erongo' },
  { name: 'Walvis Bay', coordinates: [14.5053, -22.9575], region: 'Erongo' },
  { name: 'Lüderitz', coordinates: [15.1597, -26.6484], region: 'ǁKaras' },
  // Northern towns (Ovamboland)
  { name: 'Oshakati', coordinates: [15.6963, -17.7947], region: 'Oshana' },
  { name: 'Ondangwa', coordinates: [15.95, -17.9167], region: 'Oshana' },
  { name: 'Oshikango', coordinates: [15.8833, -17.4], region: 'Ohangwena' },
  { name: 'Eenhana', coordinates: [16.3333, -17.4667], region: 'Ohangwena' },
  { name: 'Ongwediva', coordinates: [15.7667, -17.7833], region: 'Oshana' },
  { name: 'Outapi', coordinates: [14.9833, -17.5], region: 'Omusati' },
  { name: 'Okahao', coordinates: [15.0667, -17.8833], region: 'Omusati' },
  { name: 'Omuthiya', coordinates: [16.5667, -18.3667], region: 'Oshikoto' },
  { name: 'Tsumeb', coordinates: [17.7167, -19.2333], region: 'Oshikoto' },
  // Northwestern towns
  { name: 'Opuwo', coordinates: [13.84, -18.06], region: 'Kunene' },
  { name: 'Khorixas', coordinates: [14.9667, -20.3667], region: 'Kunene' },
  { name: 'Outjo', coordinates: [16.15, -20.1167], region: 'Kunene' },
  // Central towns
  { name: 'Otjiwarongo', coordinates: [16.6523, -20.4636], region: 'Otjozondjupa' },
  { name: 'Grootfontein', coordinates: [18.1167, -19.5667], region: 'Otjozondjupa' },
  { name: 'Okakarara', coordinates: [17.4333, -20.5833], region: 'Otjozondjupa' },
  // Eastern towns (Kavango & Zambezi)
  { name: 'Rundu', coordinates: [19.7646, -17.9289], region: 'Kavango East' },
  { name: 'Nkurenkuru', coordinates: [18.7667, -17.6333], region: 'Kavango West' },
  { name: 'Katima Mulilo', coordinates: [24.2667, -17.5], region: 'Zambezi' },
  // Southern towns
  { name: 'Rehoboth', coordinates: [17.0833, -23.3167], region: 'Hardap' },
  { name: 'Mariental', coordinates: [17.9667, -24.6333], region: 'Hardap' },
  { name: 'Keetmanshoop', coordinates: [18.1333, -26.5833], region: 'ǁKaras' },
  { name: 'Gobabis', coordinates: [18.9667, -22.45], region: 'Omaheke' },
];

interface SpendingVisualizationProps {
  transactions: Transaction[];
}

type ViewMode = 'map' | 'categories' | 'merchants';

const SpendingVisualization: React.FC<SpendingVisualizationProps> = ({ transactions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('1m');
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const { categoryData, merchantData, totalSpent: _totalSpent, periodChange, dateRange } = useMemo(() => {
    if (transactions.length === 0) {
      return {
        categoryData: [],
        merchantData: [],
        totalSpent: 0,
        periodChange: 0,
        dateRange: { start: new Date(), end: new Date() },
      };
    }

    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    const startDate = parseISO(sortedTransactions[0].transaction_date);
    const endDate = parseISO(sortedTransactions[sortedTransactions.length - 1].transaction_date);
    const periodStart = getPeriodStart(selectedPeriod, endDate, startDate);

    // Filter transactions for period
    const filteredTransactions = sortedTransactions.filter(
      (t: Transaction) =>
        isWithinInterval(parseISO(t.transaction_date), { start: periodStart, end: endDate }) &&
        t.transaction_type.toLowerCase() === 'debit'
    );

    const totalSpent = filteredTransactions.reduce(
      (sum, t) => sum + Math.abs(t.transaction_amount),
      0
    );

    // Period comparison
    const periodDuration = endDate.getTime() - periodStart.getTime();
    const previousPeriodStart = new Date(periodStart.getTime() - periodDuration);
    const previousTransactions = sortedTransactions.filter(
      (t: Transaction) =>
        isWithinInterval(parseISO(t.transaction_date), {
          start: previousPeriodStart,
          end: periodStart,
        }) && t.transaction_type.toLowerCase() === 'debit'
    );
    const previousTotal = previousTransactions.reduce(
      (sum, t) => sum + Math.abs(t.transaction_amount),
      0
    );
    const periodChange = previousTotal ? ((totalSpent - previousTotal) / previousTotal) * 100 : 0;

    // Category breakdown
    const categoryMap = filteredTransactions.reduce((acc, t) => {
      const category = t.category || 'Other';
      if (!acc[category]) acc[category] = { amount: 0, count: 0 };
      acc[category].amount += Math.abs(t.transaction_amount);
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    const categoryData = Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: (data.amount / totalSpent) * 100,
        transactionCount: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Merchant breakdown
    const merchantMap = filteredTransactions.reduce((acc, t) => {
      const merchant = t.merchant_name || t.transaction_description.split(' ')[0] || 'Unknown';
      if (!acc[merchant]) acc[merchant] = { amount: 0, count: 0 };
      acc[merchant].amount += Math.abs(t.transaction_amount);
      acc[merchant].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    const merchantData = Object.entries(merchantMap)
      .map(([merchant, data]) => ({
        merchant,
        amount: data.amount,
        percentage: (data.amount / totalSpent) * 100,
        transactionCount: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      categoryData,
      merchantData,
      totalSpent,
      periodChange,
      dateRange: { start: periodStart, end: endDate },
    };
  }, [transactions, selectedPeriod]);

  // Category icon components
  const getCategoryIcon = (category: string, size: number = 20) => {
    const normalizedCategory = category.toLowerCase();
    const iconProps = { size, strokeWidth: 1.5 };

    // Financial & Banking
    if (normalizedCategory.includes('loan')) return <Banknote {...iconProps} />;
    if (normalizedCategory.includes('atm') || normalizedCategory.includes('withdrawal'))
      return <CreditCard {...iconProps} />;
    if (normalizedCategory.includes('transfer')) return <DollarSign {...iconProps} />;
    if (normalizedCategory.includes('bank') || normalizedCategory.includes('fee'))
      return <Building {...iconProps} />;
    if (normalizedCategory.includes('investment')) return <TrendingUp {...iconProps} />;
    if (normalizedCategory.includes('salary') || normalizedCategory.includes('income'))
      return <Briefcase {...iconProps} />;

    // Shopping & Retail
    if (normalizedCategory.includes('groceries') || normalizedCategory.includes('supermarket'))
      return <ShoppingCart {...iconProps} />;
    if (normalizedCategory.includes('shopping') || normalizedCategory.includes('retail'))
      return <ShoppingBag {...iconProps} />;
    if (normalizedCategory.includes('gift')) return <Gift {...iconProps} />;

    // Food & Dining
    if (
      normalizedCategory.includes('food') ||
      normalizedCategory.includes('dining') ||
      normalizedCategory.includes('restaurant')
    )
      return <Utensils {...iconProps} />;
    if (normalizedCategory.includes('coffee') || normalizedCategory.includes('cafe'))
      return <Coffee {...iconProps} />;

    // Transport
    if (normalizedCategory.includes('transport') || normalizedCategory.includes('taxi'))
      return <Car {...iconProps} />;
    if (
      normalizedCategory.includes('fuel') ||
      normalizedCategory.includes('petrol') ||
      normalizedCategory.includes('gas')
    )
      return <Fuel {...iconProps} />;
    if (normalizedCategory.includes('flight') || normalizedCategory.includes('airline'))
      return <Plane {...iconProps} />;

    // Bills & Utilities
    if (normalizedCategory.includes('bill') || normalizedCategory.includes('utilities'))
      return <Zap {...iconProps} />;
    if (normalizedCategory.includes('electricity')) return <Zap {...iconProps} />;
    if (normalizedCategory.includes('water')) return <Droplet {...iconProps} />;
    if (normalizedCategory.includes('internet') || normalizedCategory.includes('wifi'))
      return <Wifi {...iconProps} />;
    if (normalizedCategory.includes('phone') || normalizedCategory.includes('mobile'))
      return <Phone {...iconProps} />;
    if (normalizedCategory.includes('rent')) return <Home {...iconProps} />;
    if (normalizedCategory.includes('insurance')) return <Shield {...iconProps} />;

    // Entertainment
    if (
      normalizedCategory.includes('entertainment') ||
      normalizedCategory.includes('movie') ||
      normalizedCategory.includes('cinema')
    )
      return <Film {...iconProps} />;
    if (normalizedCategory.includes('music') || normalizedCategory.includes('spotify'))
      return <Music {...iconProps} />;
    if (normalizedCategory.includes('game') || normalizedCategory.includes('gaming'))
      return <Gamepad2 {...iconProps} />;

    // Health & Personal Care
    if (
      normalizedCategory.includes('health') ||
      normalizedCategory.includes('medical') ||
      normalizedCategory.includes('doctor')
    )
      return <Heart {...iconProps} />;
    if (normalizedCategory.includes('pharmacy') || normalizedCategory.includes('medicine'))
      return <Pill {...iconProps} />;
    if (normalizedCategory.includes('beauty') || normalizedCategory.includes('salon'))
      return <Scissors {...iconProps} />;

    // Education
    if (
      normalizedCategory.includes('education') ||
      normalizedCategory.includes('school') ||
      normalizedCategory.includes('course')
    )
      return <GraduationCap {...iconProps} />;
    if (normalizedCategory.includes('books')) return <Book {...iconProps} />;

    // Travel & Accommodation
    if (normalizedCategory.includes('hotel') || normalizedCategory.includes('accommodation'))
      return <Hotel {...iconProps} />;
    if (normalizedCategory.includes('travel') || normalizedCategory.includes('vacation'))
      return <Globe {...iconProps} />;

    // Charity & Faith
    if (normalizedCategory.includes('charity') || normalizedCategory.includes('donation'))
      return <Heart {...iconProps} />;
    if (normalizedCategory.includes('church') || normalizedCategory.includes('tithe'))
      return <Church {...iconProps} />;

    // Pets
    if (normalizedCategory.includes('pet') || normalizedCategory.includes('veterinary'))
      return <PawPrint {...iconProps} />;

    // Default
    return <Store {...iconProps} />;
  };

  return (
    <div
      className="relative overflow-hidden backdrop-blur-lg bg-gradient-to-br from-[#F1F3F4]/90 to-[#FFFFFF]/90 rounded-xl border border-[#5F6368]/20 p-4 w-full"
      style={{ height: '380px' }}
    >
      {/* Ambient effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#4285F4]/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#4285F4]/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div>
            <h2 className="text-base font-medium text-[#174EA6]">Spending Insights</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-[#5F6368]">
                {format(dateRange.start, 'dd MMM')} - {format(dateRange.end, 'dd MMM yyyy')}
              </p>
              <div
                className={`flex items-center gap-1 text-xs ${
                  periodChange >= 0 ? 'text-rose-500' : 'text-emerald-500'
                }`}
              >
                {periodChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(periodChange).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-1 bg-[#FFFFFF]/30 rounded-lg p-1">
            {[
              { id: 'categories' as ViewMode, icon: Layers, label: 'Categories' },
              { id: 'merchants' as ViewMode, icon: Store, label: 'Merchants' },
              { id: 'map' as ViewMode, icon: MapPin, label: 'Map' },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: viewMode === tab.id ? colors.primary.main : 'transparent',
                  color: viewMode === tab.id ? colors.text.inverse : colors.text.secondary,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon size={12} />
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-3 flex-shrink-0 overflow-x-auto">
          {periodOptions.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                selectedPeriod === period
                  ? 'bg-[#4285F4] text-white shadow-lg'
                  : 'bg-[#FFFFFF]/30 text-[#5F6368] hover:bg-[#FFFFFF]/50'
              }`}
            >
              {period === 'all' ? 'ALL' : period.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden min-h-0">
          <AnimatePresence mode="wait">
            {/* Categories View */}
            {viewMode === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-2 gap-2 h-full overflow-y-auto custom-scrollbar pr-2"
              >
                {categoryData.map((item, index) => (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative p-3 rounded-xl bg-gradient-to-br from-[#FFFFFF] to-[#F1F3F4] border border-[#5F6368]/10 hover:border-[#4285F4]/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: withOpacity(colors.primary.main, 0.1),
                          color: colors.primary.main,
                        }}
                      >
                        {getCategoryIcon(item.category, 20)}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#174EA6]">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-[10px] text-[#5F6368]">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-[#174EA6] mb-1 truncate">
                      {item.category}
                    </div>
                    <div className="text-[10px] text-[#5F6368]">
                      {item.transactionCount} transactions
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F1F3F4] rounded-b-xl overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                        className="h-full bg-[#4285F4]"
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Merchants View */}
            {viewMode === 'merchants' && (
              <motion.div
                key="merchants"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full overflow-y-auto custom-scrollbar pr-2 space-y-2"
              >
                {merchantData.map((item, index) => (
                  <motion.div
                    key={item.merchant}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-2.5 rounded-lg bg-[#FFFFFF]/50 hover:bg-[#FFFFFF] transition-all"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#4285F4]/15 text-[10px] font-bold text-[#4285F4]">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate text-[#174EA6]">
                            {item.merchant}
                          </span>
                          <span className="text-xs font-bold ml-2 text-rose-500">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#5F6368] mt-0.5">
                          <span>
                            {item.transactionCount} txn{item.transactionCount > 1 ? 's' : ''}
                          </span>
                          <span>•</span>
                          <span>{item.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-[#F1F3F4] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.03 }}
                        className="h-full bg-rose-500 rounded-full"
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Map View - Actual Namibia Map */}
            {viewMode === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full flex flex-col"
              >
                <div className="flex-1 relative bg-gradient-to-br from-[#E8F0FE] to-[#FFFFFF] rounded-xl overflow-hidden border border-[#4285F4]/20">
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                      scale: 1800,
                      center: [18.0, -22.0],
                    }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <Geographies geography={NAMIBIA_TOPO as GeoJsonObject}>
                      {({ geographies }: { geographies: any[] }) =>
                        geographies.map((geo: any, index: number) => {
                          // Generate slightly different colors for each region
                          const regionColors = [
                            withOpacity(colors.primary.main, 0.12),
                            withOpacity(colors.primary.main, 0.18),
                            withOpacity(colors.primary.main, 0.15),
                            withOpacity(colors.primary.light, 0.2),
                          ];
                          const fillColor = regionColors[index % regionColors.length];
                          const regionName = geo.properties.name;

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={fillColor}
                              stroke={colors.primary.dark}
                              strokeWidth={0.8}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              onMouseEnter={() => setHoveredRegion(regionName)}
                              onMouseLeave={() => setHoveredRegion(null)}
                              style={{
                                outline: 'none',
                                cursor: 'pointer',
                                fill: hoveredRegion === regionName
                                  ? withOpacity(colors.primary.light, 0.35) : fillColor,
                                strokeWidth: hoveredRegion === regionName ? 1.2 : 0.8,
                                stroke: hoveredRegion === regionName
                                  ? colors.primary.main : colors.primary.dark,
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>
                    {/* Region Labels */}
                    {NAMIBIA_REGION_CENTERS.map((region) => (
                      <Marker key={`region-${region.name}`} coordinates={region.coordinates}>
                        <text
                          textAnchor="middle"
                          style={{
                            fontFamily: 'system-ui',
                            fontSize: '3.5px',
                            fontWeight: '500',
                            fill: colors.primary.dark,
                            opacity: 0.7,
                            pointerEvents: 'none',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {region.name}
                        </text>
                      </Marker>
                    ))}
                    {/* Major Cities */}
                    {NAMIBIA_CITIES.map((city) => (
                      <Marker key={city.name} coordinates={city.coordinates}>
                        <g
                          onMouseEnter={() => setHoveredCity(city.name)}
                          onMouseLeave={() => setHoveredCity(null)}
                          style={{ cursor: 'pointer' }}
                        >
                          <circle
                            r={city.isCapital ? 5 : 3}
                            fill={city.isCapital ? colors.semantic.expense : colors.primary.main}
                            stroke={colors.background.secondary}
                            strokeWidth={1}
                            style={{
                              transition: 'all 0.2s',
                              opacity: hoveredCity === city.name ? 1 : 0.9,
                            }}
                          />
                          <text
                            textAnchor="middle"
                            y={city.isCapital ? -8 : -6}
                            style={{
                              fontFamily: 'system-ui',
                              fontSize: city.isCapital ? '5px' : '4px',
                              fontWeight: city.isCapital ? 'bold' : '600',
                              fill: colors.text.primary,
                              pointerEvents: 'none',
                            }}
                          >
                            {city.name}
                          </text>
                        </g>
                      </Marker>
                    ))}
                  </ComposableMap>

                  {/* Location Info Overlay */}
                  {(hoveredCity || hoveredRegion) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-2 left-2 right-2 p-2 rounded-lg bg-[#FFFFFF]/95 backdrop-blur-sm border border-[#4285F4]/30 shadow-lg"
                    >
                      {hoveredCity ? (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} style={{ color: colors.primary.main }} />
                          <div className="text-xs font-bold text-[#174EA6]">{hoveredCity}</div>
                          <div className="text-[10px] text-[#5F6368] ml-auto">
                            {NAMIBIA_CITIES.find((c) => c.name === hoveredCity)?.region}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Layers size={14} style={{ color: colors.primary.main }} />
                          <div className="text-xs font-bold text-[#174EA6]">{hoveredRegion} Region</div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Legend */}
                  <div className="absolute bottom-2 right-2 bg-[#FFFFFF]/95 backdrop-blur-sm rounded-lg p-2 border border-[#5F6368]/20">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors.semantic.expense }}
                        />
                        <span className="text-[9px] text-[#5F6368]">Capital</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colors.primary.main }}
                        />
                        <span className="text-[9px] text-[#5F6368]">City</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SpendingVisualization;
