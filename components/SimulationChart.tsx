
import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { SimulationYear, Language, Currency } from '../types';
import { translations } from '../i18n';
import { Eye, EyeOff, Layers, Activity } from 'lucide-react';

interface SimulationChartProps {
  data: SimulationYear[];
  language: Language;
  currency: Currency;
}

export const SimulationChart: React.FC<SimulationChartProps> = ({ data, language, currency }) => {
  const t = translations[language];
  const [isMobile, setIsMobile] = useState(false);
  
  // Visibility States
  const [showValue, setShowValue] = useState(true);
  const [showWithdrawal, setShowWithdrawal] = useState(true);
  const [showAnnualWithdrawal, setShowAnnualWithdrawal] = useState(false); // Default off to keep it clean
  
  // Dual Axis State
  const [useDualAxis, setUseDualAxis] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTick = (value: number) => {
    return new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
      notation: "compact",
      compactDisplay: "short",
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 1
    }).format(value);
  };

  // Color Logic
  const colors = language === 'en' 
    ? {
        valueStroke: '#10b981', // Emerald 500
        valueFill: '#34d399',   // Emerald 400
        withdrawStroke: '#ef4444', // Red 500
        withdrawFill: '#f87171',   // Red 400
        annualFill: '#fbbf24',    // Amber 400
      }
    : {
        valueStroke: '#ef4444', // Red 500
        valueFill: '#f87171',   // Red 400
        withdrawStroke: '#10b981', // Emerald 500
        withdrawFill: '#34d399',   // Emerald 400
        annualFill: '#fbbf24',    // Amber 400
      };

  return (
    <div className="w-full h-[480px] bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h3 className="text-lg font-semibold text-slate-800">{t.chartTitle}</h3>
        
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
          {/* Controls */}
          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors select-none">
            <input 
              type="checkbox" 
              checked={useDualAxis} 
              onChange={(e) => setUseDualAxis(e.target.checked)} 
              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300"
            />
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            {t.dualAxis}
          </label>

          <button 
            onClick={() => setShowValue(!showValue)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${showValue ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
          >
            {showValue ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {t.chartPortfolioValue}
          </button>

          <button 
            onClick={() => setShowWithdrawal(!showWithdrawal)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${showWithdrawal ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
          >
            {showWithdrawal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {t.chartWithdrawal}
          </button>

          <button 
            onClick={() => setShowAnnualWithdrawal(!showAnnualWithdrawal)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${showAnnualWithdrawal ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
          >
            {showAnnualWithdrawal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {t.chartAnnualWithdrawal}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{
              top: 10,
              right: isMobile ? 0 : 10,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            
            <XAxis 
              dataKey="year" 
              tick={{ fill: '#64748b', fontSize: isMobile ? 10 : 12 }} 
              axisLine={false}
              tickLine={false}
            />
            
            {/* Left Axis (Primary) */}
            <YAxis 
              yAxisId="left"
              tickFormatter={formatTick} 
              tick={{ fill: '#64748b', fontSize: isMobile ? 10 : 12 }} 
              axisLine={false}
              tickLine={false}
              width={isMobile ? 35 : 45}
            />

            {/* Right Axis (Secondary - Conditional) */}
            {useDualAxis && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={formatTick} 
                tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} 
                axisLine={false}
                tickLine={false}
                width={isMobile ? 35 : 45}
              />
            )}

            <Tooltip 
              formatter={(value: number, name: string) => {
                const label = name === t.chartPortfolioValue ? t.remainingAssets : name;
                return [formatCurrency(value), label];
              }}
              labelFormatter={(label) => `${t.yearLabel} ${label}`}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
              itemStyle={{ fontSize: '12px', fontWeight: 500, padding: '2px 0' }}
            />
            
            <Legend wrapperStyle={{ fontSize: isMobile ? '12px' : '12px', paddingTop: '10px' }}/>
            
            {showValue && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="totalValue"
                name={t.chartPortfolioValue}
                stroke={colors.valueStroke}
                fill={colors.valueFill}
                fillOpacity={0.15}
                strokeWidth={2}
                animationDuration={1000}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            )}
            
            {showWithdrawal && (
              <Area
                yAxisId={useDualAxis ? "right" : "left"}
                type="monotone"
                dataKey="totalWithdrawn"
                name={t.chartWithdrawal}
                stroke={colors.withdrawStroke}
                fill={colors.withdrawFill}
                fillOpacity={0.15}
                strokeWidth={2}
                animationDuration={1000}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            )}

            {showAnnualWithdrawal && (
              <Bar
                yAxisId={useDualAxis ? "right" : "left"}
                dataKey="annualWithdrawal"
                name={t.chartAnnualWithdrawal}
                fill={colors.annualFill}
                radius={[4, 4, 0, 0]}
                barSize={isMobile ? 8 : 12}
                animationDuration={1000}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
