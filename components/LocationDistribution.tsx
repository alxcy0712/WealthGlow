
import React, { useMemo, useState, useEffect } from 'react';
import { Asset, Language, Currency } from '../types';
import { translations } from '../i18n';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';
import { Building2, TrendingUp, ArrowLeft, BarChart3 } from 'lucide-react';

interface LocationDistributionProps {
  assets: Asset[];
  language: Language;
  currency: Currency;
  onClose?: () => void;
}

const COLORS = [
  '#6366f1', '#a855f7', '#ec4899', '#f43f5e', 
  '#f97316', '#eab308', '#22c55e', '#06b6d4', 
  '#3b82f6', '#14b8a6'
];

export const LocationDistribution: React.FC<LocationDistributionProps> = ({ assets, language, currency, onClose }) => {
  const t = translations[language];
  const [activeLoc, setActiveLoc] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkMobile = () => window.innerWidth < 768;
    const checkDark = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    setIsMobile(checkMobile());
    checkDark();
    
    window.addEventListener('resize', () => setIsMobile(checkMobile()));
    
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    const locationMap: Record<string, { name: string; value: number; assets: Asset[] }> = {};
    
    assets.forEach(asset => {
      const loc = asset.location || '-';
      if (!locationMap[loc]) {
        locationMap[loc] = { name: loc, value: 0, assets: [] };
      }
      locationMap[loc].value += asset.amount;
      locationMap[loc].assets.push(asset);
    });

    return Object.values(locationMap).sort((a, b) => b.value - a.value);
  }, [assets]);

  const activeData = useMemo(() => data.find(d => d.name === activeLoc), [data, activeLoc]);

  const formatCurrency = (val: number) => new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', { 
    style: 'currency', currency: currency, maximumFractionDigits: 0 
  }).format(val);

  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  const renderDetails = () => (
    <div className="flex flex-col h-full animate-fade-in overflow-hidden">
       <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 gap-2 pr-1 transition-colors">
          <div className="flex items-center gap-3 min-w-0 flex-1">
             {isMobile && (
                <button onClick={() => setActiveLoc(null)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                   <ArrowLeft className="w-5 h-5" />
                </button>
             )}
             <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex-shrink-0 transition-colors">
                <Building2 className="w-4 h-4" />
             </div>
             <div className="min-w-0 flex-1">
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-[13px] uppercase truncate transition-colors" title={activeLoc || ''}>
                  {activeLoc}
                </h4>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase truncate transition-colors">{t.locationAssets}</p>
             </div>
          </div>
          
          <div className="text-right flex-shrink-0 min-w-fit pr-1">
             <div className="text-[13px] font-black text-slate-800 dark:text-slate-100 tabular-nums whitespace-nowrap transition-colors">
               {formatCurrency(activeData?.value || 0)}
             </div>
             <div className="text-[9px] text-indigo-500 dark:text-indigo-400 font-black">
                {totalValue > 0 ? ((activeData!.value / totalValue) * 100).toFixed(1) : 0}%
             </div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 pb-4">
          {activeData?.assets.map(asset => (
             <div key={asset.id} className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500 transition-all gap-3">
                <div className="min-w-0 flex-1">
                   <div className="font-bold text-slate-800 dark:text-slate-200 text-[13px] truncate" title={asset.name}>{asset.name}</div>
                   <div className={`text-[9px] font-black uppercase mt-0.5 ${asset.riskLevel === 'R5' ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>{asset.riskLevel}</div>
                </div>
                <div className="text-right flex-shrink-0 min-w-fit">
                   <div className="text-[13px] font-black text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">{formatCurrency(asset.amount)}</div>
                   <div className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 flex items-center justify-end gap-1">
                      <TrendingUp className="w-2.5 h-2.5" />
                      {asset.expectedReturnRate}%
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  return (
    <div className={`flex flex-col md:flex-row gap-6 md:gap-5 items-stretch py-2 px-4 relative bg-white dark:bg-slate-900 transition-colors duration-300 ${!isMobile ? 'md:h-[600px]' : 'min-h-[450px]'}`}>
       <div className="w-full md:w-[55%] flex flex-col items-center h-full overflow-hidden flex-shrink-0">
          <div className="w-full flex justify-center pb-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100/50 dark:bg-slate-800/80 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                  <BarChart3 className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> 
                  {language === 'zh' ? '资金存放分布' : 'Location Distribution'}
              </div>
          </div>

          <div className="flex-1 w-full min-h-[300px] relative flex flex-col justify-center items-center overflow-hidden">
             <div className="w-full h-full absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                   <RePieChart>
                      <Pie
                         data={data}
                         cx="50%"
                         cy="50%"
                         innerRadius={isMobile ? 75 : 110}
                         outerRadius={isMobile ? 105 : 150}
                         paddingAngle={3}
                         dataKey="value"
                         onClick={(data) => setActiveLoc(data.name)}
                         cursor="pointer"
                         animationDuration={800}
                         stroke="none"
                      >
                         {data.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              className={`transition-all duration-300 outline-none ${activeLoc && activeLoc !== entry.name ? 'opacity-30' : 'opacity-100'}`}
                            />
                         ))}
                      </Pie>
                      <ReTooltip 
                         formatter={(val: number) => formatCurrency(val)}
                         contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                            color: isDarkMode ? '#f1f5f9' : '#1e293b',
                            padding: '10px 14px'
                         }}
                         itemStyle={{
                            color: isDarkMode ? '#f1f5f9' : '#1e293b',
                            fontSize: '13px',
                            fontWeight: 'bold'
                         }}
                         labelStyle={{
                            color: isDarkMode ? '#94a3b8' : '#64748b',
                            fontSize: '11px',
                            marginBottom: '4px',
                            fontWeight: 'bold'
                         }}
                      />
                   </RePieChart>
                </ResponsiveContainer>
             </div>
             
             <div className="relative z-10 pointer-events-none flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-2 transition-colors">{t.totalRecorded}</span>
                <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-none tabular-nums tracking-tight transition-colors">{formatCurrency(totalValue)}</span>
             </div>
          </div>

          <div className="w-full mt-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-2 border border-slate-100 dark:border-slate-800 shadow-inner flex-shrink-0 max-h-[140px] overflow-hidden flex flex-col transition-colors">
             <div className="grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar pr-1 py-1">
                {data.map((d, i) => (
                   <button 
                     key={d.name}
                     onClick={() => setActiveLoc(d.name)}
                     className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left group ${activeLoc === d.name ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100 dark:shadow-none' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors'}`}
                   >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 border border-white/20 transition-transform group-hover:scale-125 ${activeLoc === d.name ? 'bg-white' : ''}`} style={{ backgroundColor: activeLoc === d.name ? undefined : COLORS[i % COLORS.length] }}></div>
                      <div className="min-w-0 flex-1">
                         <div className={`text-[10px] font-black truncate transition-colors ${activeLoc === d.name ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{d.name}</div>
                         <div className={`text-[9px] font-bold opacity-70 transition-colors tabular-nums ${activeLoc === d.name ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>{formatCurrency(d.value)}</div>
                      </div>
                   </button>
                ))}
             </div>
          </div>

          {isMobile && activeLoc && (
             <div className="absolute inset-0 bg-white dark:bg-slate-900 z-[60] flex flex-col p-4 rounded-2xl animate-fade-in shadow-2xl transition-colors duration-300">
                {renderDetails()}
             </div>
          )}
       </div>

       {!isMobile && (
          <div className="md:flex-1 h-full bg-slate-50/50 dark:bg-slate-950/60 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 md:pl-4 md:pr-4 shadow-inner overflow-hidden flex-shrink-0 md:mr-1 transition-colors">
             {activeLoc ? (
                renderDetails()
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4">
                   <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 transition-colors">
                      <Building2 className="w-7 h-7" />
                   </div>
                   <div className="max-w-[140px]">
                      <h4 className="text-[14px] font-black text-slate-800 dark:text-slate-100 tracking-tight transition-colors">{language === 'zh' ? '查看存放详情' : 'Storage Details'}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 leading-relaxed font-bold uppercase tracking-wide transition-colors">
                         {language === 'zh' ? '点击左侧选择位置' : 'Select a location'}
                      </p>
                   </div>
                </div>
             )}
          </div>
       )}
    </div>
  );
};
