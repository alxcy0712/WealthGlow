
import React, { useMemo, useState, useEffect } from 'react';
import { Asset, RiskLevel, Language, Currency } from '../types';
import { translations } from '../i18n';
import { Shield, ChevronRight, Info, TrendingUp, X, HelpCircle, ArrowRight, PieChart, BarChart, ChevronLeft } from 'lucide-react';

interface RiskPyramidProps {
  assets: Asset[];
  totalPrincipal: number;
  language: Language;
  currency: Currency;
}

const RISK_LEVEL_CONFIGS = [
  { level: RiskLevel.R5, color: 'from-rose-600 to-red-500', bg: 'bg-rose-50', text: 'text-rose-600' },
  { level: RiskLevel.R4, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  { level: RiskLevel.R3, color: 'from-indigo-600 to-blue-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  { level: RiskLevel.R2, color: 'from-cyan-500 to-teal-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  { level: RiskLevel.R1, color: 'from-emerald-600 to-green-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
];

export const RiskPyramid: React.FC<RiskPyramidProps> = ({ assets, totalPrincipal, language, currency }) => {
  const t = translations[language];
  const [activeLevel, setActiveLevel] = useState<RiskLevel | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => window.innerWidth < 1024;
    setIsMobile(checkMobile());
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalAssetsValue = useMemo(() => assets.reduce((sum, a) => sum + a.amount, 0), [assets]);

  const stats = useMemo(() => {
    const fixedHeight = isMobile ? 55 : 65; 
    
    const levelTotals = RISK_LEVEL_CONFIGS.map(cfg => {
      const amount = assets
        .filter(a => String(a.riskLevel) === String(cfg.level))
        .reduce((sum, a) => sum + a.amount, 0);
      return { level: cfg.level, amount };
    });
    const maxAmount = Math.max(...levelTotals.map(l => l.amount), 1);

    return RISK_LEVEL_CONFIGS.map((cfg) => {
      const levelAssets = assets.filter(a => String(a.riskLevel) === String(cfg.level));
      const total = levelAssets.reduce((sum, a) => sum + a.amount, 0);
      const percentage = totalAssetsValue > 0 ? (total / totalAssetsValue) * 100 : 0;
      
      const minWidth = 35;
      const maxWidth = 100;
      const scaleFactor = total > 0 ? Math.sqrt(total / maxAmount) : 0;
      const visualWidth = total > 0 ? minWidth + (scaleFactor * (maxWidth - minWidth)) : 0;

      return {
        ...cfg,
        total,
        percentage,
        visualHeight: fixedHeight,
        visualWidth, 
        items: levelAssets,
        desc: (t as any)[`risk${cfg.level}Desc`] || cfg.level
      };
    });
  }, [assets, totalAssetsValue, t, language, isMobile]);

  const activeData = stats.find(s => s.level === activeLevel);

  const formatCurrency = (val: number) => new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', { 
    style: 'currency', currency: currency, maximumFractionDigits: 0 
  }).format(val);

  const renderDetails = () => (
    <div className="flex flex-col h-full animate-fade-in overflow-hidden">
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-4">
           {isMobile && (
             <button onClick={() => setActiveLevel(null)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-400">
               <ChevronLeft className="w-5 h-5" />
             </button>
           )}
           <div className={`p-3 rounded-2xl bg-white shadow-md border border-slate-100 flex-shrink-0 ${activeData?.text}`}>
              <Shield className="w-6 h-6" />
           </div>
           <div className="min-w-0">
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{activeData?.level}</h4>
              <p className="text-[12px] text-slate-500 font-bold truncate">{activeData?.desc}</p>
           </div>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
           <div className="text-base font-black text-slate-800">{formatCurrency(activeData?.total || 0)}</div>
           <div className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">{activeData?.percentage.toFixed(1)}% {t.riskComposition}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-4">
        {activeData?.items.map((asset) => (
           <div key={asset.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group">
              <div className="min-w-0 pr-4">
                 <div className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">{asset.name}</div>
                 <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{asset.location}</div>
              </div>
              <div className="text-right flex-shrink-0">
                 <div className="text-sm font-black text-slate-700">{formatCurrency(asset.amount)}</div>
                 <div className="text-[10px] font-bold text-emerald-500 flex items-center justify-end gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {asset.expectedReturnRate}%
                 </div>
              </div>
           </div>
        ))}
      </div>
    </div>
  );

  return (
    <div 
      className={`flex flex-col lg:flex-row gap-8 items-stretch py-2 relative overflow-hidden ${!isMobile ? 'lg:h-[600px]' : 'min-h-[500px]'}`} 
      onClick={() => !isMobile && setActiveLevel(null)}
    >
      {/* 左侧：金字塔图形区 - 桌面端固定 */}
      <div className={`w-full ${isMobile ? 'h-full' : 'lg:w-[55%] h-full'} flex flex-col items-center relative flex-shrink-0 overflow-hidden`}>
        <div className="w-full flex justify-center pb-6 flex-shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <BarChart className="w-3 h-3 text-indigo-500" /> 
                {language === 'zh' ? '资产配置比例 (对数缩放)' : 'Allocation (Scaled View)'}
            </div>
        </div>
        
        <div className="flex-1 w-full flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
          {stats.map((item) => {
            const hasData = item.total > 0;
            return (
              <div 
                key={item.level}
                className="relative flex justify-center w-full group/layer flex-shrink-0"
                style={{ height: `${item.visualHeight}px` }}
              >
                <div className="absolute inset-y-0 w-full max-w-[95%] bg-slate-50/50 rounded-2xl -z-10 border border-slate-100 transition-all group-hover/layer:bg-slate-100/80"></div>

                {hasData && (
                  <div 
                    className={`flex flex-col items-center justify-center transition-all duration-500 relative
                      bg-gradient-to-br shadow-md border border-white/30 rounded-2xl overflow-hidden cursor-pointer
                      ${item.color} 
                      ${activeLevel === item.level ? 'scale-[1.05] z-20 shadow-2xl brightness-110 ring-4 ring-indigo-500/20' : 'opacity-90 z-10 hover:opacity-100 hover:scale-[1.03] hover:shadow-xl'}
                    `}
                    style={{ 
                      width: `${item.visualWidth}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLevel(activeLevel === item.level ? null : item.level as RiskLevel);
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/layer:opacity-100 transition-opacity pointer-events-none"></div>

                    <div className="flex flex-col items-center text-white text-center px-4 pointer-events-none overflow-hidden">
                       <span className="text-[10px] font-black tracking-tight opacity-80 leading-none mb-1 uppercase">{item.level}</span>
                       <span className="text-[12px] sm:text-[13px] font-black truncate w-full drop-shadow-md mb-1">{item.desc}</span>
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-black/20 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-sm">
                            {item.percentage.toFixed(1)}%
                          </span>
                       </div>
                    </div>
                  </div>
                )}
                
                {!hasData && (
                   <div className="flex items-center justify-center text-slate-200 text-[10px] font-bold opacity-40">
                      {item.level} - {item.desc}
                   </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="w-full text-center mt-6 flex-shrink-0">
           <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
             {language === 'zh' ? '* 宽度已进行非线性缩放，以确保小额资产层级清晰可见' : '* Width is non-linearly scaled to ensure visibility of small allocations'}
           </p>
        </div>

        <div className="absolute bottom-2 right-2 hidden sm:block">
           <div className="group relative">
              <div className="p-2 bg-white hover:bg-indigo-600 text-slate-400 hover:text-white rounded-full cursor-help transition-all shadow-sm border border-slate-200">
                 <HelpCircle className="w-5 h-5" />
              </div>
              <div className="absolute bottom-full right-0 mb-4 w-[280px] opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                 <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-2xl text-[11px] leading-relaxed border border-white/10 backdrop-blur-md text-left">
                    <div className="flex items-center gap-2 mb-3 font-bold text-indigo-400 border-b border-white/10 pb-2">
                       <Shield className="w-4 h-4" />
                       {language === 'zh' ? '金字塔配置逻辑' : 'Pyramid Logic'}
                    </div>
                    {language === 'zh' ? (
                      <ul className="space-y-2">
                         <li><strong className="text-emerald-400">R1-R2:</strong> 底部是根基，存放保命钱。</li>
                         <li><strong className="text-indigo-400">R3:</strong> 中部是主力，稳健增值。</li>
                         <li><strong className="text-rose-400">R4-R5:</strong> 顶部是杠杆，追求超额收益。</li>
                      </ul>
                    ) : (
                      <ul className="space-y-2">
                         <li><strong className="text-emerald-400">R1-R2:</strong> Foundation for safety.</li>
                         <li><strong className="text-indigo-400">R3:</strong> Core for balanced growth.</li>
                         <li><strong className="text-rose-400">R4-R5:</strong> Apex for aggressive gains.</li>
                      </ul>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* 手机端浮层 */}
        {isMobile && activeLevel && (
           <div className="absolute inset-0 bg-white z-[60] flex flex-col p-4 sm:p-6 rounded-2xl animate-fade-in shadow-2xl">
              {renderDetails()}
           </div>
        )}
      </div>

      {/* 右侧：桌面端详情面板 - 独立滚动 */}
      {!isMobile && (
        <div className="lg:w-[45%] h-full flex flex-col bg-slate-50/50 rounded-3xl border border-slate-100 p-6 overflow-hidden shadow-inner flex-shrink-0">
          {activeData && activeData.total > 0 ? (
             renderDetails()
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-6">
               <div className="w-20 h-20 bg-white rounded-[2.5rem] shadow-lg border border-slate-100 flex items-center justify-center text-slate-300">
                  <PieChart className="w-10 h-10" />
               </div>
               <div>
                  <h4 className="text-base font-black text-slate-800 tracking-tight">{language === 'zh' ? '选择一个等级' : 'Select a Level'}</h4>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed font-medium">
                     {language === 'zh' ? '点击左侧金字塔中具有颜色高亮的层级，查看详细的资产分布。' : 'Click the colored layers in the pyramid to view asset distribution details.'}
                  </p>
               </div>
               <div className="pt-6 w-full space-y-2">
                  <div className="px-4 py-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{language === 'zh' ? '本金总额' : 'Principal'}</span>
                     <span className="text-sm font-black text-indigo-600">{formatCurrency(totalPrincipal)}</span>
                  </div>
                  <div className="px-4 py-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{language === 'zh' ? '已记录资产' : 'Total Recorded'}</span>
                     <span className="text-sm font-black text-slate-700">{formatCurrency(totalAssetsValue)}</span>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
