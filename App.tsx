
import React, { useState, useMemo } from 'react';
import { Asset, RiskLevel, SimulationYear, OptimizationResult, Language, Currency } from './types';
import { AssetManager } from './components/AssetManager';
import { SimulationChart } from './components/SimulationChart';
import { optimizePortfolio } from './services/gemini';
import { Settings, Sparkles, TrendingUp, AlertTriangle, ArrowRight, Wallet, Languages, PlayCircle, BarChart3, FileText, ChevronDown, Percent } from 'lucide-react';
import { translations } from './i18n';
import { Toast, ToastType } from './components/Toast';
import { Modal } from './components/Modal';
import { SimpleMarkdown } from './components/SimpleMarkdown';

// Default Data Sets
const DEFAULT_ASSETS_EN: Asset[] = [
  { id: '1', name: 'Treasury Bonds', riskLevel: RiskLevel.R1, amount: 20000, expectedReturnRate: 3.5 },
  { id: '2', name: 'Global Tech ETF', riskLevel: RiskLevel.R4, amount: 15000, expectedReturnRate: 11.0 },
  { id: '3', name: 'Dividend Stocks', riskLevel: RiskLevel.R3, amount: 10000, expectedReturnRate: 7.0 },
];

const DEFAULT_ASSETS_ZH: Asset[] = [
  { id: '1', name: '储蓄国债', riskLevel: RiskLevel.R1, amount: 40000, expectedReturnRate: 3.0 },
  { id: '2', name: '沪深300 ETF', riskLevel: RiskLevel.R3, amount: 30000, expectedReturnRate: 8.5 },
  { id: '3', name: '科技龙头股', riskLevel: RiskLevel.R5, amount: 20000, expectedReturnRate: 15.0 },
];

const App: React.FC = () => {
  // Config
  const [language, setLanguage] = useState<Language>('en');
  const currency: Currency = language === 'en' ? 'USD' : 'CNY';
  const t = translations[language];

  // Toast State
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  // State
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS_EN);
  
  // Independent simulation principal. Using string to allow flexible input (e.g. "0.")
  // Initialized to empty string to show placeholder
  const [simulationPrincipal, setSimulationPrincipal] = useState<string>('');
  
  const [years, setYears] = useState<number>(20);
  // Using string to allow flexible input
  const [annualWithdrawal, setAnnualWithdrawal] = useState<string>('');
  const [withdrawalFrequency, setWithdrawalFrequency] = useState<'yearly' | 'monthly'>('yearly');
  const [withdrawalIncreaseRate, setWithdrawalIncreaseRate] = useState<string>('');
  
  // AI State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  // Derived Values
  const totalRecorded = useMemo(() => assets.reduce((sum, a) => sum + a.amount, 0), [assets]);
  
  // Calculated Default Principal
  // If input is empty, default to 50k/100k OR total recorded assets, whichever is higher
  const defaultPrincipal = useMemo(() => {
    const base = language === 'en' ? 50000 : 100000;
    return Math.max(totalRecorded, base);
  }, [language, totalRecorded]);

  // Effective Principal used for calculations
  const principalNum = useMemo(() => {
    if (simulationPrincipal === '') return defaultPrincipal;
    const val = parseFloat(simulationPrincipal);
    return isNaN(val) ? 0 : val;
  }, [simulationPrincipal, defaultPrincipal]);

  const cashAmount = Math.max(0, principalNum - totalRecorded);

  // Calculated Default Withdrawal (Approx 4% of effective principal)
  const defaultWithdrawal = useMemo(() => {
    return (principalNum * 0.04).toFixed(0);
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

  // Handle Language Switch with Default Asset Swap
  const handleLanguageSwitch = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    
    // Switch to localized examples
    const newDefaults = newLang === 'zh' ? DEFAULT_ASSETS_ZH : DEFAULT_ASSETS_EN;
    setAssets(newDefaults);
    
    // Clear inputs to revert to placeholders/defaults
    setSimulationPrincipal('');
    setAnnualWithdrawal('');
    setWithdrawalIncreaseRate('');
    setWithdrawalFrequency('yearly'); 
  };

  // Simulation Logic
  const simulationData = useMemo<SimulationYear[]>(() => {
    // Construct full portfolio including the Cash row
    // We use actual amounts now, not ratios, since the "Cash" row fills the gap
    let currentAssets = assets.map(a => ({ 
      ...a, 
      currentValue: a.amount 
    }));

    // Add Cash Asset
    if (cashAmount >= 0) {
      currentAssets.push({
        id: 'sys_cash',
        name: t.cash,
        riskLevel: RiskLevel.R1,
        amount: cashAmount,
        expectedReturnRate: 0, // Cash has 0% return in this model
        currentValue: cashAmount
      });
    }

    let cumulativeWithdrawal = 0;
    const data: SimulationYear[] = [];

    // Year 0
    data.push({
      year: 0,
      totalValue: principalNum,
      totalWithdrawn: 0,
      annualWithdrawal: 0,
      breakdown: currentAssets.reduce((acc, curr) => ({ 
        ...acc, 
        [curr.name]: curr.currentValue 
      }), {})
    });

    for (let y = 1; y <= years; y++) {
      let yearTotal = 0;
      
      // Calculate withdrawal for this year.
      const withdrawalRequired = withdrawalNum * Math.pow(1 + rateNum / 100, y - 1);
      
      let withdrawalRemaining = withdrawalRequired;
      const breakdown: { [name: string]: number } = {};

      // 1. Apply Growth
      currentAssets.forEach(asset => {
        asset.currentValue = asset.currentValue * (1 + asset.expectedReturnRate / 100);
      });

      // Calculate total BEFORE withdrawal to check sustainability
      const totalBeforeWithdrawal = currentAssets.reduce((sum, a) => sum + a.currentValue, 0);

      // 2. Apply Withdrawal (Pro-rated across assets)
      let actualWithdrawalThisYear = 0;
      if (totalBeforeWithdrawal > 0) {
        // Calculate actual withdrawal amount based on available funds
        actualWithdrawalThisYear = Math.min(totalBeforeWithdrawal, withdrawalRemaining);
        
        currentAssets.forEach(asset => {
          const weight = asset.currentValue / totalBeforeWithdrawal;
          const deduction = withdrawalRemaining * weight;
          if (totalBeforeWithdrawal < withdrawalRemaining) {
             asset.currentValue = 0;
          } else {
             asset.currentValue -= deduction;
          }
        });
        
        cumulativeWithdrawal += actualWithdrawalThisYear;
      } else {
          cumulativeWithdrawal += 0;
          actualWithdrawalThisYear = 0;
      }

      // 3. Sum up
      yearTotal = currentAssets.reduce((sum, a) => sum + a.currentValue, 0);

      // Record Asset Breakdown
      currentAssets.forEach(asset => {
          breakdown[asset.name] = asset.currentValue;
      });

      data.push({
        year: y,
        totalValue: Math.max(0, yearTotal),
        totalWithdrawn: cumulativeWithdrawal,
        annualWithdrawal: actualWithdrawalThisYear,
        breakdown
      });
    }

    return data;
  }, [assets, years, withdrawalNum, rateNum, principalNum, totalRecorded, cashAmount, t]);

  // Derived CAGR
  const cagr = useMemo(() => {
    if (principalNum <= 0) return 0;
    const finalVal = simulationData[simulationData.length - 1].totalValue;
    // Simple CAGR based on start and end value
    // Note: This CAGR reflects the growth AFTER withdrawals, so it might be negative if withdrawals > growth
    // For pure investment performance, we would need to track growth without withdrawal, but for "Wealth Projection", this is correct net growth.
    const val = (Math.pow(finalVal / principalNum, 1 / years) - 1) * 100;
    return isNaN(val) ? 0 : val;
  }, [simulationData, principalNum, years]);

  // Handlers
  const handleAddAsset = (asset: Asset) => {
    const newAssets = [...assets, asset];
    setAssets(newAssets);
    
    // Auto-update principal ONLY if user has entered a value and it's too low.
    const newTotal = newAssets.reduce((sum, a) => sum + a.amount, 0);
    if (simulationPrincipal !== '' && newTotal > parseFloat(simulationPrincipal)) {
      setSimulationPrincipal(newTotal.toString());
    }
  };

  const handleUpdateAsset = (updatedAsset: Asset) => {
    const newAssets = assets.map(a => a.id === updatedAsset.id ? updatedAsset : a);
    setAssets(newAssets);

    const newTotal = newAssets.reduce((sum, a) => sum + a.amount, 0);
    if (simulationPrincipal !== '' && newTotal > parseFloat(simulationPrincipal)) {
      setSimulationPrincipal(newTotal.toString());
    }
  };

  const handleRemoveAsset = (id: string) => {
    const newAssets = assets.filter(a => a.id !== id);
    setAssets(newAssets);
  };

  const handlePrincipalBlur = () => {
    if (simulationPrincipal !== '' && principalNum < totalRecorded) {
      showToast(t.errorPrincipalTooLow, 'error');
      setSimulationPrincipal(totalRecorded.toString());
    }
  };

  const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || parseFloat(val) >= 0) {
      setSimulationPrincipal(val);
    }
  };

  const handleWithdrawalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || parseFloat(val) >= 0) {
      setAnnualWithdrawal(val);
    }
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || parseFloat(val) >= 0) {
      setWithdrawalIncreaseRate(val);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setError(null);
    setOptimizationResult(null);
    try {
      const assetsForOptimization = [
        ...assets,
        {
          id: 'cash-context',
          name: t.cash,
          riskLevel: RiskLevel.R1,
          amount: cashAmount,
          expectedReturnRate: 0
        }
      ];
      const result = await optimizePortfolio(assetsForOptimization, years, withdrawalNum, rateNum, language);
      setOptimizationResult(result);
      setIsAnalysisModalOpen(true);
      showToast('Optimization analysis complete', 'success');
    } catch (err) {
      setError(t.errorOptimize);
      showToast(t.errorOptimize, 'error');
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
      if (newTotal > principalNum) {
         setSimulationPrincipal(newTotal.toString());
      }
      
      setIsAnalysisModalOpen(false);
      showToast('New portfolio applied successfully', 'success');
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', { 
    style: 'currency', 
    currency: currency, 
    maximumFractionDigits: 0 
  }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans relative">
      
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Analysis Modal */}
      <Modal 
        isOpen={isAnalysisModalOpen} 
        onClose={() => setIsAnalysisModalOpen(false)}
        title={t.modalAnalysisTitle}
      >
        {optimizationResult ? (
          <div className="space-y-6">
            <div className="prose-indigo prose-sm">
              <SimpleMarkdown content={optimizationResult.analysis} />
            </div>
            
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{t.suggestedChanges}</h4>
                  <button 
                  onClick={applyOptimization}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
                  >
                    {t.apply} <ArrowRight className="w-3 h-3" />
                  </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {optimizationResult.suggestedPortfolio.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 text-sm shadow-sm hover:border-indigo-200 transition-colors">
                      <div className="font-medium text-slate-900 truncate" title={item.name}>{item.name}</div>
                      <div className="flex justify-between mt-2 text-slate-500 text-xs">
                          <span className={`px-1.5 py-0.5 rounded ${
                            item.riskLevel === 'R5' ? 'bg-red-100 text-red-700' : 
                            item.riskLevel === 'R4' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100'
                          }`}>{item.riskLevel}</span>
                          <span className="font-medium text-indigo-600">+{item.expectedReturnRate}%</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 font-bold text-slate-800">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-slate-400">No analysis available.</div>
        )}
      </Modal>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-lg shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-700">
              {t.appTitle}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <button 
              onClick={handleLanguageSwitch}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full"
             >
               <Languages className="w-4 h-4" />
               {language === 'en' ? 'English' : '中文'}
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* ================= 1. SIMULATION CONFIG ================= */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" /> {t.simulationConfig}
              </h2>
              <div className="bg-indigo-50 text-indigo-600 text-xs px-2 py-1 rounded-md font-medium">
                {t.inputParameters}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Col 1: Initial Principal */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.initialPrincipal}</label>
                <div className="relative group">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                    {currency === 'USD' ? '$' : '¥'}
                  </span>
                  <input 
                    type="number"
                    min="0"
                    placeholder={defaultPrincipal.toString()}
                    value={simulationPrincipal}
                    onChange={handlePrincipalChange}
                    onBlur={handlePrincipalBlur}
                    className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-slate-50/50 hover:bg-white transition-all font-bold text-slate-800 shadow-sm placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Col 2: Withdrawal Settings */}
              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 gap-4">
                 <div className="space-y-1.5 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700">{t.withdrawalLabel}</label>
                    <div className="flex items-center w-full border border-slate-300 rounded-xl bg-slate-50/50 hover:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm overflow-hidden">
                      <div className="pl-3 text-slate-400 text-sm pointer-events-none">
                        {currency === 'USD' ? '$' : '¥'}
                      </div>
                      <input 
                        type="number"
                        min="0"
                        placeholder={defaultWithdrawal}
                        value={annualWithdrawal}
                        onChange={handleWithdrawalChange}
                        className="flex-1 w-full min-w-0 px-2 py-2.5 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
                      />
                      <div className="w-px h-5 bg-slate-200 mx-1"></div>
                      <div className="relative flex items-center pr-2">
                         <select 
                           value={withdrawalFrequency}
                           onChange={(e) => setWithdrawalFrequency(e.target.value as any)}
                           className="bg-transparent border-none outline-none text-slate-600 text-sm font-medium cursor-pointer appearance-none py-2 pr-5 pl-2 hover:text-indigo-600 transition-colors"
                         >
                           <option value="yearly">{t.yearly}</option>
                           <option value="monthly">{t.monthly}</option>
                         </select>
                         <div className="pointer-events-none absolute right-0 flex items-center text-slate-400">
                            <ChevronDown className="w-4 h-4" />
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                     <label className="block text-sm font-medium text-slate-700 truncate" title={t.withdrawalIncreaseRate}>
                      {t.withdrawalIncreaseRate}
                    </label>
                    <div className="relative group">
                       <input 
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0"
                        value={withdrawalIncreaseRate}
                        onChange={handleRateChange}
                        className="w-full pl-3 pr-8 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-slate-50/50 hover:bg-white transition-all shadow-sm placeholder:text-slate-400"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 text-sm pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                        %
                      </span>
                    </div>
                  </div>
              </div>

              {/* Col 3: Slider */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-center">
                  <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-2">
                    <span className="flex items-center gap-2"><PlayCircle className="w-4 h-4 text-slate-400"/> {t.timeHorizon}</span>
                    <span className="text-xl font-bold text-indigo-600 leading-none">
                      {years} <span className="text-sm font-normal text-slate-500">{t.years}</span>
                    </span>
                  </label>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    value={years} 
                    onChange={(e) => setYears(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                    <span>5 {t.yearSuffix}</span>
                    <span>50 {t.yearSuffix}</span>
                  </div>
              </div>

            </div>
        </section>

        {/* ================= 2. ASSETS MANAGER ================= */}
        <AssetManager 
          assets={assets} 
          onAddAsset={handleAddAsset}
          onUpdateAsset={handleUpdateAsset}
          onRemoveAsset={handleRemoveAsset}
          simulationPrincipal={principalNum}
          totalRecorded={totalRecorded}
          cashAmount={cashAmount}
          language={language}
          currency={currency}
          onShowToast={showToast}
        />

        {/* ================= 3. STATS CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Final Value */}
              <div className={`rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/10 flex flex-col justify-between relative overflow-hidden ${
                language === 'zh' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
              }`}>
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wallet className="w-24 h-24" />
                 </div>
                 <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-3 opacity-90">
                     <span className="text-sm font-medium tracking-wide uppercase">{t.finalValue}</span>
                   </div>
                   <div className="text-3xl font-bold tracking-tight">
                     {formatCurrency(simulationData[simulationData.length - 1].totalValue)}
                   </div>
                 </div>
                 <div className="relative z-10 mt-6 flex items-center gap-2">
                   <div className="text-xs bg-white/20 px-2.5 py-1 rounded-full text-white font-medium backdrop-blur-sm">
                     {t.afterYears.replace('{0}', years.toString())}
                   </div>
                 </div>
              </div>
              
              {/* Card 2: Total Withdrawn */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BarChart3 className="w-24 h-24 text-slate-800" />
                 </div>
                 <div>
                    <div className="text-sm text-slate-500 mb-3 font-medium tracking-wide uppercase">{t.totalWithdrawn}</div>
                    <div className={`text-3xl font-bold tracking-tight ${language === 'zh' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(simulationData[simulationData.length - 1].totalWithdrawn)}
                    </div>
                 </div>
                 <div className="mt-6">
                   <div className="mt-2 text-xs text-slate-400 font-medium">
                     {t.passiveIncome}
                   </div>
                 </div>
              </div>

              {/* Card 3: Annualized Return (CAGR) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Percent className="w-24 h-24 text-indigo-800" />
                 </div>
                 <div>
                    <div className="text-sm text-slate-500 mb-3 font-medium tracking-wide uppercase">{t.netGrowth}</div>
                    <div className={`text-3xl font-bold tracking-tight ${cagr >= 0 ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {cagr.toFixed(2)}%
                    </div>
                 </div>
                 <div className="mt-6">
                   <div className="mt-2 text-xs text-slate-400 font-medium flex items-center gap-1">
                     <TrendingUp className="w-3 h-3" />
                     Realized CAGR (Net)
                   </div>
                 </div>
              </div>
        </div>

        {/* ================= 4. MAIN CHART ================= */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <SimulationChart 
                data={simulationData} 
                language={language}
                currency={currency}
            />
            <div className="px-6 pb-4 pt-4 border-t border-slate-50 mt-2">
                <p className="text-xs text-slate-400 italic text-center leading-relaxed">
                {t.disclaimer}
                </p>
            </div>
        </div>

        {/* Error Messages */}
        {error && (
            <div className="animate-fade-in space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            </div>
        )}

      </main>

      {/* ================= FLOATING ACTION WIDGET ================= */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end space-y-3 group">
        {!isAnalysisModalOpen && optimizationResult && (
          <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 transform translate-y-4 opacity-0 invisible group-hover:translate-y-0 group-hover:opacity-100 group-hover:visible transition-all duration-300 w-48 text-right">
             <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide flex items-center justify-end gap-1">
               <FileText className="w-3 h-3" /> Last Analysis
             </div>
             <button 
               onClick={() => setIsAnalysisModalOpen(true)}
               className="w-full text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
             >
               {t.viewAnalysis} <ArrowRight className="w-3 h-3" />
             </button>
          </div>
        )}

        <button 
          onClick={handleOptimize}
          disabled={isOptimizing}
          className={`bg-slate-900 hover:bg-indigo-600 text-white shadow-2xl transition-all duration-300 ease-out flex items-center gap-0 overflow-hidden h-14 pl-4 rounded-full ${isOptimizing ? 'w-48' : 'w-14 group-hover:w-56'}`}
          title={t.optimize}
        >
           {isOptimizing ? (
              <>
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0"></div>
                 <span className="whitespace-nowrap ml-3 font-medium">{t.processing}</span>
              </>
           ) : (
              <>
                 <Sparkles className="w-6 h-6 flex-shrink-0 transition-transform duration-700 ease-in-out group-hover:rotate-[360deg]" />
                 <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 ml-0 group-hover:ml-3 transition-all duration-300 font-medium">
                   {t.optimize}
                 </span>
              </>
           )}
        </button>
      </div>
    </div>
  );
};

export default App;
