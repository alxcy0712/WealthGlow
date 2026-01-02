
import React, { useState, useMemo, useEffect } from 'react';
import { Asset, RiskLevel, SimulationYear, OptimizationResult, Language, Currency } from './types';
import { AssetManager } from './components/AssetManager';
import { SimulationChart } from './components/SimulationChart';
import { optimizePortfolio } from './services/gemini';
import { Settings, Sparkles, TrendingUp, AlertTriangle, ArrowRight, Wallet, Languages, PlayCircle, BarChart3, FileText, ChevronDown, Percent, BrainCircuit, Calculator, LayoutGrid, Sliders, Calendar, DollarSign, Coins } from 'lucide-react';
import { translations } from './i18n';
import { Toast, ToastType } from './components/Toast';
import { Modal } from './components/Modal';
import { SimpleMarkdown } from './components/SimpleMarkdown';
import { AISettingsModal } from './components/AISettingsModal';
import { YieldCalculator } from './components/YieldCalculator';

const DEFAULT_ASSETS_EN: Asset[] = [
  { id: '1', name: 'Treasury Bonds', location: 'Bank A', riskLevel: RiskLevel.R1, amount: 20000, expectedReturnRate: 3.5 },
  { id: '2', name: 'Global Tech ETF', location: 'Broker X', riskLevel: RiskLevel.R4, amount: 15000, expectedReturnRate: 11.0 },
  { id: '3', name: 'Dividend Stocks', location: 'Broker X', riskLevel: RiskLevel.R3, amount: 10000, expectedReturnRate: 7.0 },
];

const DEFAULT_ASSETS_ZH: Asset[] = [
  { id: '1', name: '储蓄国债', location: '招商银行', riskLevel: RiskLevel.R1, amount: 40000, expectedReturnRate: 3.0 },
  { id: '2', name: '沪深300 ETF', location: '支付宝', riskLevel: RiskLevel.R3, amount: 30000, expectedReturnRate: 8.5 },
  { id: '3', name: '科技龙头股', location: '微信', riskLevel: RiskLevel.R5, amount: 20000, expectedReturnRate: 15.0 },
];

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('zh');
  const currency: Currency = language === 'en' ? 'USD' : 'CNY';
  const t = translations[language];

  const [availableLocations, setAvailableLocations] = useState<string[]>(() => {
    const saved = localStorage.getItem('wealthglow_locations');
    if (saved) return JSON.parse(saved);
    return language === 'zh' 
      ? ['微信', '支付宝', '招商银行'] 
      : ['Bank of America', 'Chase', 'Vanguard', 'Fidelity', 'Coinbase'];
  });

  useEffect(() => {
    localStorage.setItem('wealthglow_locations', JSON.stringify(availableLocations));
  }, [availableLocations]);

  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS_ZH);
  const [simulationPrincipal, setSimulationPrincipal] = useState<string>('');
  const [years, setYears] = useState<number>(20);
  const [annualWithdrawal, setAnnualWithdrawal] = useState<string>('');
  const [withdrawalFrequency, setWithdrawalFrequency] = useState<'yearly' | 'monthly'>('monthly');
  const [withdrawalIncreaseRate, setWithdrawalIncreaseRate] = useState<string>('');
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isYieldCalcOpen, setIsYieldCalcOpen] = useState(false);

  const totalRecorded = useMemo(() => assets.reduce((sum, a) => sum + a.amount, 0), [assets]);
  
  const defaultPrincipal = useMemo(() => {
    const base = language === 'en' ? 50000 : 100000;
    return Math.max(totalRecorded, base);
  }, [language, totalRecorded]);

  const principalNum = useMemo(() => {
    if (simulationPrincipal === '') return defaultPrincipal;
    const val = parseFloat(simulationPrincipal);
    return isNaN(val) ? 0 : val;
  }, [simulationPrincipal, defaultPrincipal]);

  const cashAmount = Math.max(0, principalNum - totalRecorded);

  const defaultWithdrawal = useMemo(() => {
    // If monthly is default, show 1/12th of 4% rule as default
    return ((principalNum * 0.04) / 12).toFixed(0);
  }, [principalNum]);
  
  const withdrawalNum = useMemo(() => {
    let val = 0;
    if (annualWithdrawal === '') {
       val = parseFloat(defaultWithdrawal);
    } else {
       val = parseFloat(annualWithdrawal) || 0;
    }
    return withdrawalFrequency === 'monthly' ? val * 12 : val;
  }, [annualWithdrawal, defaultWithdrawal, withdrawalFrequency]);

  const rateNum = useMemo(() => {
    if (withdrawalIncreaseRate === '') return 0;
    return parseFloat(withdrawalIncreaseRate) || 0;
  }, [withdrawalIncreaseRate]);

  const handleLanguageSwitch = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    const newDefaults = newLang === 'zh' ? DEFAULT_ASSETS_ZH : DEFAULT_ASSETS_EN;
    setAssets(newDefaults);
    const newLocs = newLang === 'zh' 
      ? ['微信', '支付宝', '招商银行'] 
      : ['Bank of America', 'Chase', 'Vanguard', 'Fidelity', 'Coinbase'];
    setAvailableLocations(newLocs);
    setSimulationPrincipal('');
    setAnnualWithdrawal('');
    setWithdrawalIncreaseRate('');
    setWithdrawalFrequency('monthly'); 
  };

  const simulationData = useMemo<SimulationYear[]>(() => {
    let currentAssets = assets.map(a => ({ ...a, currentValue: a.amount }));
    if (cashAmount >= 0) {
      currentAssets.push({
        id: 'sys_cash',
        name: t.cash,
        location: '-',
        riskLevel: RiskLevel.R1,
        amount: cashAmount,
        expectedReturnRate: 0,
        currentValue: cashAmount
      });
    }

    let cumulativeWithdrawal = 0;
    const data: SimulationYear[] = [];
    data.push({
      year: 0,
      totalValue: principalNum,
      totalWithdrawn: 0,
      annualWithdrawal: 0,
      breakdown: currentAssets.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.currentValue }), {})
    });

    for (let y = 1; y <= years; y++) {
      currentAssets.forEach(asset => {
        asset.currentValue = asset.currentValue * (1 + asset.expectedReturnRate / 100);
      });
      const totalBeforeWithdrawal = currentAssets.reduce((sum, a) => sum + a.currentValue, 0);
      const withdrawalRequired = withdrawalNum * Math.pow(1 + rateNum / 100, y - 1);
      let actualWithdrawalThisYear = 0;
      if (totalBeforeWithdrawal > 0) {
        actualWithdrawalThisYear = Math.min(totalBeforeWithdrawal, withdrawalRequired);
        currentAssets.forEach(asset => {
          const weight = asset.currentValue / totalBeforeWithdrawal;
          asset.currentValue = Math.max(0, asset.currentValue - (actualWithdrawalThisYear * weight));
        });
        cumulativeWithdrawal += actualWithdrawalThisYear;
      }
      const yearTotal = currentAssets.reduce((sum, a) => sum + a.currentValue, 0);
      const breakdown = currentAssets.reduce((acc, a) => ({ ...acc, [a.name]: a.currentValue }), {});
      data.push({ year: y, totalValue: Math.max(0, yearTotal), totalWithdrawn: cumulativeWithdrawal, annualWithdrawal: actualWithdrawalThisYear, breakdown });
    }
    return data;
  }, [assets, years, withdrawalNum, rateNum, principalNum, cashAmount, t]);

  const cagr = useMemo(() => {
    if (principalNum <= 0) return 0;
    const finalVal = simulationData[simulationData.length - 1].totalValue;
    const val = (Math.pow(finalVal / principalNum, 1 / years) - 1) * 100;
    return isNaN(val) ? 0 : val;
  }, [simulationData, principalNum, years]);

  const handleAddAsset = (asset: Asset) => {
    const newAssets = [...assets, asset];
    setAssets(newAssets);
    
    // Sync location - Case-insensitive check to prevent duplicates
    if (asset.location && asset.location !== '-') {
      setAvailableLocations(prev => {
        if (!prev.some(l => l.toLowerCase() === asset.location.toLowerCase())) {
          return [...prev, asset.location];
        }
        return prev;
      });
    }

    const newTotal = newAssets.reduce((sum, a) => sum + a.amount, 0);
    if (simulationPrincipal !== '' && newTotal > parseFloat(simulationPrincipal)) {
      setSimulationPrincipal(newTotal.toString());
    }
  };

  const handleBatchAddAssets = (newAssetsBatch: Asset[]) => {
    const combined = [...assets, ...newAssetsBatch];
    setAssets(combined);

    const newLocsFromBatch = newAssetsBatch
      .map(a => a.location)
      .filter(loc => {
        if (!loc || loc === '-') return false;
        // Check uniqueness within the batch and existing locations
        return !availableLocations.some(l => l.toLowerCase() === loc.toLowerCase());
      });
    
    if (newLocsFromBatch.length > 0) {
      const uniqueNewLocs = Array.from(new Set(newLocsFromBatch));
      // One final check to ensure case-insensitive uniqueness against state
      setAvailableLocations(prev => {
        const result = [...prev];
        uniqueNewLocs.forEach(loc => {
          if (!result.some(l => l.toLowerCase() === loc.toLowerCase())) {
            result.push(loc);
          }
        });
        return result;
      });
    }

    const newTotal = combined.reduce((sum, a) => sum + a.amount, 0);
    if (simulationPrincipal !== '' && newTotal > parseFloat(simulationPrincipal)) {
      setSimulationPrincipal(newTotal.toString());
    }
  };

  const handleUpdateAsset = (updatedAsset: Asset) => {
    const newAssets = assets.map(a => a.id === updatedAsset.id ? updatedAsset : a);
    setAssets(newAssets);

    if (updatedAsset.location && updatedAsset.location !== '-') {
      setAvailableLocations(prev => {
        if (!prev.some(l => l.toLowerCase() === updatedAsset.location.toLowerCase())) {
          return [...prev, updatedAsset.location];
        }
        return prev;
      });
    }

    const newTotal = newAssets.reduce((sum, a) => sum + a.amount, 0);
    if (simulationPrincipal !== '' && newTotal > parseFloat(simulationPrincipal)) {
      setSimulationPrincipal(newTotal.toString());
    }
  };

  const handleRemoveAsset = (id: string) => setAssets(assets.filter(a => a.id !== id));
  const handleClearAssets = () => {
    setAssets([]);
    showToast(language === 'zh' ? '已清空所有资产' : 'All assets cleared', 'info');
  };

  const handlePrincipalBlur = () => {
    if (simulationPrincipal !== '' && principalNum < totalRecorded) {
      showToast(t.errorPrincipalTooLow, 'error');
      setSimulationPrincipal(totalRecorded.toString());
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setError(null);
    setOptimizationResult(null);
    try {
      const assetsForOptimization = [
        ...assets,
        { id: 'cash-context', name: t.cash, location: '-', riskLevel: RiskLevel.R1, amount: cashAmount, expectedReturnRate: 0 }
      ];
      const result = await optimizePortfolio(assetsForOptimization, years, withdrawalNum, rateNum, language);
      setOptimizationResult(result);
      setIsAnalysisModalOpen(true);
      showToast(language === 'zh' ? '分析报告已生成' : 'Optimization analysis complete', 'success');
    } catch (err: any) {
      setError(err.message || t.errorOptimize);
      showToast(err.message || t.errorOptimize, 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  const applyOptimization = () => {
    if (optimizationResult) {
      const newAssets = optimizationResult.suggestedPortfolio;
      setAssets(newAssets);
      setOptimizationResult(null); 
      const newTotal = newAssets.reduce((sum, a) => sum + a.amount, 0);
      if (newTotal > principalNum) setSimulationPrincipal(newTotal.toString());
      setIsAnalysisModalOpen(false);
      showToast(language === 'zh' ? '已成功应用优化方案' : 'New portfolio applied successfully', 'success');
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', { 
    style: 'currency', currency: currency, maximumFractionDigits: 0 
  }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-20 font-sans relative overflow-x-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Modal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} title={t.modalAnalysisTitle}>
        {optimizationResult ? (
          <div className="space-y-6">
            <div className="prose-indigo prose-sm"><SimpleMarkdown content={optimizationResult.analysis} /></div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{t.suggestedChanges}</h4>
                  <button onClick={applyOptimization} className="w-full sm:w-auto text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm">
                    {t.apply} <ArrowRight className="w-3 h-3" />
                  </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {optimizationResult.suggestedPortfolio.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 text-sm shadow-sm hover:border-indigo-200 transition-colors">
                      <div className="font-medium text-slate-900 truncate" title={item.name}>{item.name}</div>
                      <div className="flex justify-between mt-2 text-slate-500 text-xs">
                          <span className={`px-1.5 py-0.5 rounded ${item.riskLevel === 'R5' ? 'bg-red-100 text-red-700' : item.riskLevel === 'R4' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100'}`}>{item.riskLevel}</span>
                          <span className="font-medium text-indigo-600">+{item.expectedReturnRate}%</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 font-bold text-slate-800">{formatCurrency(item.amount)}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : <div className="p-10 text-center text-slate-400">No analysis available.</div>}
      </Modal>

      <AISettingsModal isOpen={isAiSettingsOpen} onClose={() => setIsAiSettingsOpen(false)} language={language} onSave={() => showToast(language === 'zh' ? '设置已保存' : 'Settings saved', 'success')} />
      <YieldCalculator isOpen={isYieldCalcOpen} onClose={() => setIsYieldCalcOpen(false)} language={language} currency={currency} />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-lg shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-700 truncate">{t.appTitle}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             <button onClick={() => setIsYieldCalcOpen(true)} className="group flex items-center h-10 px-3 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all duration-300 border border-transparent hover:border-slate-200">
               <Calculator className="w-5 h-5 flex-shrink-0" />
               <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-500 ease-out text-sm font-bold">{t.yieldCalculator}</span>
             </button>
             <button onClick={() => setIsAiSettingsOpen(true)} className="group flex items-center h-10 px-3 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all duration-300 border border-transparent hover:border-slate-200">
               <BrainCircuit className="w-5 h-5 flex-shrink-0" />
               <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-500 ease-out text-sm font-bold">{t.aiSettings}</span>
             </button>
             <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
             <button onClick={handleLanguageSwitch} className="group flex items-center h-10 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-indigo-600 transition-all duration-300 border border-transparent">
               <Languages className="w-4 h-4 flex-shrink-0" />
               <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-500 ease-out text-sm font-bold">{language === 'en' ? 'Switch to 中文' : '切换到 English'}</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Optimized Simulation Config Card - Balanced Proportions and Correct Labels */}
        <section className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">{t.simulationConfig}</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{language === 'zh' ? '调整核心预测参数' : 'Adjust projection variables'}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Row 1: Principal (4/8), Withdrawal (2/8), Increase Rate (2/8) -> 4:2:2 ratio on 8-col grid */}
              <div className="grid grid-cols-1 md:grid-cols-8 gap-3">
                <div className="md:col-span-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all shadow-inner">
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> {t.initialPrincipal}</label>
                  <div className="relative group">
                    <span className="absolute left-2.5 top-1.5 text-slate-500 text-xs font-bold">{currency === 'USD' ? '$' : '¥'}</span>
                    <input type="number" min="0" placeholder={defaultPrincipal.toString()} value={simulationPrincipal} onChange={(e) => setSimulationPrincipal(e.target.value)} onBlur={handlePrincipalBlur} className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-slate-900 shadow-sm" />
                  </div>
                </div>

                <div className="md:col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all shadow-inner">
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Coins className="w-3 h-3" /> {t.withdrawalLabel}</label>
                  <div className="flex items-center w-full bg-white border border-slate-200 rounded-lg focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all shadow-sm overflow-hidden">
                    <div className="pl-2.5 text-slate-500 text-[10px] font-bold pointer-events-none">{currency === 'USD' ? '$' : '¥'}</div>
                    <input type="number" min="0" placeholder={defaultWithdrawal} value={annualWithdrawal} onChange={(e) => setAnnualWithdrawal(e.target.value)} className="flex-1 w-full min-w-0 px-1.5 py-1.5 bg-transparent border-none outline-none text-xs text-slate-900 font-black" />
                    <div className="relative flex items-center pr-1.5">
                       <select value={withdrawalFrequency} onChange={(e) => setWithdrawalFrequency(e.target.value as any)} className="bg-transparent border-none outline-none text-slate-700 text-[9px] font-black cursor-pointer appearance-none py-1.5 pr-4 pl-1">
                         <option value="yearly">{t.yearly.replace('/', '').trim()}</option>
                         <option value="monthly">{t.monthly.replace('/', '').trim()}</option>
                       </select>
                       <div className="pointer-events-none absolute right-0.5 flex items-center text-slate-500"><ChevronDown className="w-2.5 h-2.5" /></div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all shadow-inner">
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> {language === 'zh' ? '支出增长率' : 'Withdrawal Growth Rate'}</label>
                  <div className="relative group">
                    <input type="number" min="0" step="0.1" placeholder="0" value={withdrawalIncreaseRate} onChange={(e) => setWithdrawalIncreaseRate(e.target.value)} className="w-full pl-2 pr-5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-slate-900 shadow-sm" />
                    <span className="absolute right-2 top-1.5 text-slate-500 text-[9px] font-black pointer-events-none">%</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Time Horizon (Alone, labels on left and right) */}
              <div className="w-full bg-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-100 flex items-center justify-between gap-4 relative overflow-hidden group min-h-[80px]">
                  <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <Calendar className="w-12 h-12" />
                  </div>
                  <div className="relative z-10 flex-shrink-0 flex flex-col justify-center">
                    <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-0.5">{t.timeHorizon}</label>
                    <div className="text-lg font-black tracking-tight leading-none">{years} <span className="text-[10px] font-bold opacity-60 uppercase">{t.years}</span></div>
                  </div>
                  <div className="relative z-10 flex-1 max-w-4xl px-2 flex items-center gap-3">
                    <span className="text-[10px] font-black text-white/40 uppercase whitespace-nowrap select-none">5{t.yearSuffix}</span>
                    <input type="range" min="5" max="50" value={years} onChange={(e) => setYears(parseInt(e.target.value))} className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
                    <span className="text-[10px] font-black text-white/40 uppercase whitespace-nowrap select-none">50{t.yearSuffix}</span>
                  </div>
              </div>
            </div>
        </section>

        <AssetManager assets={assets} availableLocations={availableLocations} onUpdateLocations={setAvailableLocations} onAddAsset={handleAddAsset} onUpdateAsset={handleUpdateAsset} onBatchAddAssets={handleBatchAddAssets} onRemoveAsset={handleRemoveAsset} onClearAssets={handleClearAssets} simulationPrincipal={principalNum} totalRecorded={totalRecorded} cashAmount={cashAmount} language={language} currency={currency} onShowToast={showToast} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className={`rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/10 flex flex-col justify-between relative overflow-hidden h-36 sm:h-auto ${language === 'zh' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Wallet className="w-20 h-20 sm:w-24 sm:h-24" /></div>
                 <div className="relative z-10"><div className="flex items-center gap-2 mb-2 sm:mb-3 opacity-90"><span className="text-[10px] sm:text-sm font-medium tracking-wide uppercase">{t.finalValue}</span></div><div className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{formatCurrency(simulationData[simulationData.length - 1].totalValue)}</div></div>
                 <div className="relative z-10 mt-auto pt-2 flex items-center gap-2"><div className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full text-white font-medium backdrop-blur-sm">{t.afterYears.replace('{0}', years.toString())}</div></div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden h-36 sm:h-auto">
                 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><BarChart3 className="w-20 h-20 sm:w-24 sm:h-24 text-slate-800" /></div>
                 <div><div className="text-[10px] sm:text-sm text-slate-500 mb-2 sm:mb-3 font-medium tracking-wide uppercase">{t.totalWithdrawn}</div><div className={`text-2xl sm:text-3xl font-bold tracking-tight truncate ${language === 'zh' ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(simulationData[simulationData.length - 1].totalWithdrawn)}</div></div>
                 <div className="mt-auto pt-2"><div className="text-[10px] text-slate-400 font-medium">{t.passiveIncome}</div></div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden h-36 sm:h-auto sm:col-span-2 lg:col-span-1">
                 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Percent className="w-20 h-20 sm:w-24 sm:h-24 text-indigo-800" /></div>
                 <div><div className="text-[10px] sm:text-sm text-slate-500 mb-2 sm:mb-3 font-medium tracking-wide uppercase">{t.netGrowth}</div><div className={`text-2xl sm:text-3xl font-bold tracking-tight truncate ${cagr >= 0 ? 'text-indigo-600' : 'text-slate-500'}`}>{cagr.toFixed(2)}%</div></div>
                 <div className="mt-auto pt-2"><div className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3" />{language === 'zh' ? '复合年化收益率' : 'Realized CAGR (Net)'}</div></div>
              </div>
        </div>
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <SimulationChart data={simulationData} language={language} currency={currency} />
            <div className="px-4 sm:px-6 pb-4 pt-4 border-t border-slate-50 mt-2"><p className="text-[10px] sm:text-xs text-slate-400 italic text-center leading-relaxed">{t.disclaimer}</p></div>
        </div>
        {error && <div className="animate-fade-in space-y-4"><div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /><p className="text-red-700 text-sm">{error}</p></div></div>}
      </main>

      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end space-y-3 group/fab">
        {!isAnalysisModalOpen && optimizationResult && (
          <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 transform translate-y-4 opacity-0 invisible group-hover/fab:translate-y-0 group-hover/fab:opacity-100 group-hover/fab:visible transition-all duration-300 w-48 text-right hidden sm:block">
             <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide flex items-center justify-end gap-1"><FileText className="w-3 h-3" /> {language === 'zh' ? '最近分析' : 'Last Analysis'}</div>
             <button onClick={() => setIsAnalysisModalOpen(true)} className="w-full text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2">{t.viewAnalysis} <ArrowRight className="w-3 h-3" /></button>
          </div>
        )}
        <button onClick={handleOptimize} disabled={isOptimizing} className={`bg-slate-900 hover:bg-indigo-600 text-white shadow-2xl transition-all duration-300 ease-out flex items-center gap-0 overflow-hidden h-12 sm:h-14 pl-3 sm:pl-4 rounded-full ${isOptimizing ? 'w-40 sm:w-48' : 'w-12 sm:w-14 group-hover/fab:w-48 sm:group-hover/fab:w-56'}`}>
           {isOptimizing ? <><div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0"></div><span className="whitespace-nowrap ml-2 sm:ml-3 text-sm sm:text-base font-medium">{t.processing}</span></> : <><Sparkles className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 transition-transform duration-700 ease-in-out group-hover/fab:rotate-[360deg]" /><span className="whitespace-nowrap opacity-0 group-hover/fab:opacity-100 ml-0 group-hover/fab:ml-3 transition-all duration-300 text-sm sm:text-base font-medium">{t.optimize}</span></>}
        </button>
      </div>
    </div>
  );
};

export default App;
