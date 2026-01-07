
import React, { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, PieChart, ChevronDown, ChevronUp, Pencil, Check, X, Lock, ArrowUp, ArrowDown, ArrowUpDown, Settings2, ListTree, ChevronRight, Download, Upload, Copy, ClipboardPaste, FileJson, LayoutGrid, Building2 } from 'lucide-react';
import { Asset, RiskLevel, Language, Currency } from '../types';
import { translations } from '../i18n';
import { Modal } from './Modal';
import { RiskPyramid } from './RiskPyramid';
import { LocationDistribution } from './LocationDistribution';

interface AssetManagerProps {
  assets: Asset[];
  availableLocations: string[];
  onUpdateLocations: (locs: string[]) => void;
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset: (asset: Asset) => void;
  onBatchAddAssets: (assets: Asset[]) => void;
  onRemoveAsset: (id: string) => void;
  onClearAssets: () => void;
  simulationPrincipal: number;
  totalRecorded: number;
  cashAmount: number;
  language: Language;
  currency: Currency;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type SortKey = 'name' | 'location' | 'riskLevel' | 'amount' | 'expectedReturnRate';
type SortDirection = 'asc' | 'desc';

interface EditingRowState {
  id: string;
  name: string;
  location: string;
  riskLevel: RiskLevel;
  amount: string;
  expectedReturnRate: string;
}

export const AssetManager: React.FC<AssetManagerProps> = ({ 
  assets, 
  availableLocations,
  onUpdateLocations,
  onAddAsset, 
  onUpdateAsset, 
  onBatchAddAssets,
  onRemoveAsset, 
  onClearAssets,
  simulationPrincipal,
  totalRecorded,
  cashAmount,
  language,
  currency,
  onShowToast
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRiskPyramidOpen, setIsRiskPyramidOpen] = useState(false);
  const [isLocationDistOpen, setIsLocationDistOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [newLocInput, setNewLocInput] = useState('');
  const [pasteInput, setPasteInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLocationExpanded, setIsLocationExpanded] = useState(true);

  const [editingRow, setEditingRow] = useState<EditingRowState | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: SortDirection }>({
    key: null,
    direction: 'asc',
  });

  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetLocation, setNewAssetLocation] = useState(availableLocations[0] || '');
  const [newAssetRisk, setNewAssetRisk] = useState<RiskLevel>(RiskLevel.R3);
  const [newAssetAmount, setNewAssetAmount] = useState<string>('10000');
  const [newAssetReturn, setNewAssetReturn] = useState<string>('6.0');

  const t = translations[language];

  const handleRiskChange = (risk: RiskLevel) => {
    setNewAssetRisk(risk);
    let defaultReturn = '6.0';
    switch (risk) {
      case RiskLevel.R1: defaultReturn = '3.0'; break;
      case RiskLevel.R2: defaultReturn = '4.5'; break;
      case RiskLevel.R3: defaultReturn = '6.5'; break;
      case RiskLevel.R4: defaultReturn = '10.0'; break;
      case RiskLevel.R5: defaultReturn = '16.0'; break;
    }
    setNewAssetReturn(defaultReturn);
  };

  const handleAddLocation = () => {
    const trimmed = newLocInput.trim();
    if (trimmed) {
      const exists = availableLocations.some(l => l.toLowerCase() === trimmed.toLowerCase());
      if (!exists) {
        onUpdateLocations([...availableLocations, trimmed]);
        setNewLocInput('');
      } else {
        onShowToast(language === 'zh' ? '该位置已存在' : 'Location already exists', 'info');
      }
    }
  };

  const handleRemoveLocation = (locToRemove: string) => {
    const updatedLocs = availableLocations.filter(l => l !== locToRemove);
    assets.forEach(asset => {
      if (asset.location === locToRemove) {
        onUpdateAsset({ ...asset, location: '' });
      }
    });
    onUpdateLocations(updatedLocs);
    if (newAssetLocation === locToRemove) {
      setNewAssetLocation(updatedLocs[0] || '');
    }
    if (editingRow && editingRow.location === locToRemove) {
      setEditingRow({ ...editingRow, location: '' });
    }
  };

  const handleAdd = () => {
    if (!newAssetName.trim()) {
      onShowToast(t.errorNameRequired, 'error');
      return;
    }
    const amount = parseFloat(newAssetAmount);
    if (newAssetAmount === '' || isNaN(amount) || amount < 0) {
      onShowToast(t.errorInvalidAmount, 'error');
      return;
    }
    const returnRate = parseFloat(newAssetReturn);
    if (newAssetReturn === '' || isNaN(returnRate) || returnRate < 0) {
      onShowToast(t.errorInvalidReturn, 'error');
      return;
    }
    const newAsset: Asset = {
      id: Date.now().toString(),
      name: newAssetName,
      location: newAssetLocation,
      riskLevel: newAssetRisk,
      amount: amount,
      expectedReturnRate: returnRate,
    };
    onAddAsset(newAsset);
    setNewAssetName('');
    setNewAssetAmount('10000');
  };

  const exportData = () => {
    const dataStr = JSON.stringify(assets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wealthglow_assets_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyData = () => {
    const dataStr = JSON.stringify(assets, null, 2);
    navigator.clipboard.writeText(dataStr).then(() => {
      onShowToast(t.copySuccess, 'success');
    });
  };

  const processImport = (jsonStr: string) => {
    try {
      const json = JSON.parse(jsonStr);
      if (Array.isArray(json)) {
        const importedLocsRaw = json
          .map((a: any) => (a.location || '').trim())
          .filter(loc => loc && loc !== '-');
        
        const newUniqueLocs = [...availableLocations];
        importedLocsRaw.forEach(loc => {
          if (!newUniqueLocs.some(l => l.toLowerCase() === loc.toLowerCase())) {
            newUniqueLocs.push(loc);
          }
        });
        
        if (newUniqueLocs.length !== availableLocations.length) {
          onUpdateLocations(newUniqueLocs);
        }

        const validated = json.map((a: any, i: number) => ({
          ...a,
          id: `imported-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`
        }));
        onBatchAddAssets(validated);
        
        onShowToast(t.importSuccess, 'success');
        setIsImportModalOpen(false);
        setPasteInput('');
      } else {
        throw new Error('Not an array');
      }
    } catch (err) {
      onShowToast(t.importError, 'error');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      processImport(event.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const handlePasteImport = () => {
    if (!pasteInput.trim()) return;
    processImport(pasteInput);
  };

  const startEdit = (asset: Asset) => {
    setEditingRow({
      id: asset.id,
      name: asset.name,
      location: asset.location,
      riskLevel: asset.riskLevel,
      amount: asset.amount.toString(),
      expectedReturnRate: asset.expectedReturnRate.toString()
    });
  };

  const cancelEdit = () => setEditingRow(null);

  const saveEdit = () => {
    if (!editingRow) return;
    if (!editingRow.name.trim()) {
        onShowToast(t.errorNameRequired, 'error');
        return;
    }
    const amount = parseFloat(editingRow.amount);
    if (editingRow.amount === '' || isNaN(amount) || amount < 0) {
        onShowToast(t.errorInvalidAmount, 'error');
        return;
    }
    const expectedReturnRate = parseFloat(editingRow.expectedReturnRate);
    if (editingRow.expectedReturnRate === '' || isNaN(expectedReturnRate) || expectedReturnRate < 0) {
        onShowToast(t.errorInvalidReturn, 'error');
        return;
    }
    const updatedAsset: Asset = {
      id: editingRow.id,
      name: editingRow.name,
      location: editingRow.location,
      riskLevel: editingRow.riskLevel,
      amount: amount,
      expectedReturnRate: expectedReturnRate,
    };
    onUpdateAsset(updatedAsset);
    setEditingRow(null);
  };

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAssets = useMemo(() => {
    const sortableAssets = [...assets];
    if (sortConfig.key !== null) {
      sortableAssets.sort((a, b) => {
        let aValue: any = a[sortConfig.key!];
        let bValue: any = b[sortConfig.key!];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
           return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableAssets;
  }, [assets, sortConfig]);

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600 ml-1 inline-block" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400 ml-1 inline-block" /> 
      : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400 ml-1 inline-block" />;
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', { 
    style: 'currency', 
    currency: currency,
    notation: "compact",
    maximumFractionDigits: 1
  }).format(val);

  const utilization = simulationPrincipal > 0 ? (totalRecorded / simulationPrincipal) * 100 : 0;
  const cashAmountFromSim = Math.max(0, simulationPrincipal - totalRecorded);
  const cashPercentage = simulationPrincipal > 0 ? (cashAmountFromSim / simulationPrincipal * 100).toFixed(1) : '0.0';

  const getRiskColor = (level: RiskLevel) => {
    const lvl = String(level); 
    switch (lvl) {
      case 'R1': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'R2': return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800/50';
      case 'R3': return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50';
      case 'R4': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
      case 'R5': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-5 sm:p-8 transition-colors duration-300">
      
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title={t.importData}>
         <div className="space-y-6">
            <div className="space-y-3">
               <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                 <FileJson className="w-4 h-4 text-indigo-600" />
                 {t.importFile}
               </h4>
               <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all group"
               >
                 <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                    {language === 'zh' ? '点击此处或拖拽文件上传 JSON' : 'Click or drag JSON file to upload'}
                 </p>
               </div>
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>
            <div className="space-y-3">
               <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                 <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                 {t.importPaste}
               </h4>
               <textarea 
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                placeholder={t.importPlaceholder}
                className="w-full h-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all custom-scrollbar dark:text-slate-200"
               />
               <button 
                disabled={!pasteInput.trim()}
                onClick={handlePasteImport}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
               >
                 <Check className="w-4 h-4" />
                 {t.importAction}
               </button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title={t.manageLocations}>
        <div className="space-y-4 pb-4">
           <div className={`border rounded-2xl transition-all duration-300 overflow-hidden ${isLocationExpanded ? 'border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-800 shadow-sm' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'}`}>
              <button 
                onClick={() => setIsLocationExpanded(!isLocationExpanded)}
                className="w-full px-5 py-4 flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${isLocationExpanded ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    <ListTree className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`font-bold transition-colors ${isLocationExpanded ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>{t.settingsSectionLocations}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t.expandToManage}</p>
                  </div>
                </div>
                {isLocationExpanded ? (
                  <ChevronDown className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                )}
              </button>
              {isLocationExpanded && (
                <div className="px-5 pb-5 pt-1 animate-fade-in space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={newLocInput}
                      onChange={(e) => setNewLocInput(e.target.value)}
                      placeholder={t.settingsLocationPlaceholder}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-all dark:text-slate-200"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                    />
                    <button 
                      onClick={handleAddLocation}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100"
                    >
                      {t.add}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 py-1">
                    {availableLocations.map(loc => (
                      <button 
                        key={loc} 
                        onClick={() => handleRemoveLocation(loc)} 
                        className="w-fit px-5 py-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-sm active:scale-95 group relative overflow-hidden"
                      >
                        <span className="whitespace-nowrap relative z-10">{loc}</span>
                        <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
           </div>
        </div>
      </Modal>

      <Modal isOpen={isRiskPyramidOpen} onClose={() => setIsRiskPyramidOpen(false)} title={t.riskPyramid}>
        <RiskPyramid assets={assets} totalPrincipal={simulationPrincipal} language={language} currency={currency} />
      </Modal>

      <Modal isOpen={isLocationDistOpen} onClose={() => setIsLocationDistOpen(false)} title={t.locationDist}>
        <LocationDistribution assets={assets} language={language} currency={currency} onClose={() => setIsLocationDistOpen(false)} />
      </Modal>

      <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileImport} className="hidden" />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
          <PieChart className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t.assetsTitle}</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{language === 'zh' ? '资产配置与存放' : 'Portfolio Management'}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-3 mb-8 p-2 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsRiskPyramidOpen(true)}
            className="flex-1 sm:flex-none py-2.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
          >
            <LayoutGrid className="w-4 h-4" />
            {t.riskPyramid}
          </button>
          
          <button 
            onClick={() => setIsLocationDistOpen(true)}
            className="flex-1 sm:flex-none py-2.5 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white font-black rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
          >
            <Building2 className="w-4 h-4" />
            {t.locationDist}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1 gap-1 border border-slate-200/50 dark:border-slate-700 shadow-sm">
            <button onClick={exportData} title={t.exportData} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-slate-400 rounded-lg transition-all"><Download className="w-4 h-4" /></button>
            <button onClick={() => setIsImportModalOpen(true)} title={t.importData} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-slate-400 rounded-lg transition-all"><Upload className="w-4 h-4" /></button>
            <button onClick={copyData} title={t.copyData} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-slate-400 rounded-lg transition-all"><Copy className="w-4 h-4" /></button>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            {assets.length > 0 && (
               <div className="h-[38px] flex items-center">
                  {isConfirmingClear ? (
                    <div className="flex items-center gap-1 animate-fade-in">
                      <button onClick={() => { onClearAssets(); setIsConfirmingClear(false); }} className="text-[10px] font-black text-white bg-red-600 px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">{t.confirmClear}</button>
                      <button onClick={() => setIsConfirmingClear(false)} className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">{t.cancel}</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsConfirmingClear(true)} className="flex items-center justify-center gap-1.5 text-xs font-black text-red-500 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/50 px-3 py-2 rounded-xl transition-all shadow-sm"><Trash2 className="w-4 h-4" /> <span className="hidden xs:inline">{t.clearAll}</span></button>
                  )}
               </div>
            )}
            <button onClick={() => setIsSettingsModalOpen(true)} className="p-2.5 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"><Settings2 className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8">
          <div className="flex flex-col justify-center bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 opacity-80 cursor-not-allowed transition-colors">
            <span className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest">{t.initialPrincipal}</span>
            <div className="flex items-center gap-1 mt-0.5"><span className="text-indigo-900 dark:text-indigo-200 font-black text-base truncate">{formatCurrency(simulationPrincipal)}</span><Lock className="w-3 h-3 text-indigo-400 dark:text-indigo-600 flex-shrink-0" /></div>
          </div>
          <div className="flex flex-col justify-center bg-slate-50 dark:bg-slate-950/20 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.totalRecorded}</span>
             <span className="text-base font-black text-slate-700 dark:text-slate-200 mt-0.5 truncate">{formatCurrency(totalRecorded)}</span>
          </div>
          <div className="flex flex-col justify-center bg-blue-50 dark:bg-blue-950/20 px-4 py-3 rounded-2xl border border-blue-100 dark:border-blue-900/50 transition-colors">
             <span className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest">{t.utilization}</span>
             <span className="text-base font-black text-blue-700 dark:text-blue-300 mt-0.5">{utilization.toFixed(1)}%</span>
          </div>
      </div>

      <div className="mb-6">
        <button onClick={() => setIsAddOpen(!isAddOpen)} className={`flex items-center gap-2 text-sm font-black px-6 py-3 rounded-2xl transition-all w-full justify-center border-2 ${isAddOpen ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700' : 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 shadow-sm'}`}>
          {isAddOpen ? <ChevronUp className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {t.addAssetButton}
        </button>
      </div>

      {isAddOpen && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-8 bg-slate-50 dark:bg-slate-950/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 animate-fade-in shadow-inner">
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">{t.nameLabel}</label>
            <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/5 outline-none bg-white dark:bg-slate-800 font-bold dark:text-slate-200" value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">{t.locationLabel}</label>
            <div className="relative">
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/5 outline-none bg-white dark:bg-slate-800 appearance-none font-bold dark:text-slate-200" value={newAssetLocation} onChange={(e) => setNewAssetLocation(e.target.value)}>
                <option value="" className="dark:bg-slate-800">-</option>
                {availableLocations.map((l) => <option key={l} value={l} className="dark:bg-slate-800">{l}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500"><ChevronDown className="w-4 h-4" /></div>
            </div>
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">{t.riskLevel}</label>
            <div className="relative">
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/5 outline-none bg-white dark:bg-slate-800 appearance-none font-black dark:text-slate-200" value={newAssetRisk} onChange={(e) => handleRiskChange(e.target.value as RiskLevel)}>
                {Object.values(RiskLevel).map((r) => <option key={r} value={r} className="dark:bg-slate-800">{r}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500"><ChevronDown className="w-4 h-4" /></div>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">{t.amountLabel}</label>
            <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/5 outline-none bg-white dark:bg-slate-800 font-black dark:text-slate-200" value={newAssetAmount} onChange={(e) => setNewAssetAmount(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest whitespace-nowrap">{t.returnLabel}</label>
            <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/5 outline-none bg-white dark:bg-slate-800 font-black text-indigo-600 dark:text-indigo-400" value={newAssetReturn} onChange={(e) => setNewAssetReturn(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button onClick={handleAdd} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-100 dark:shadow-none"><Plus className="w-4 h-4" /> {t.add}</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 custom-scrollbar transition-colors">
        <table className="w-full text-sm text-left border-collapse min-w-[700px]">
          <thead className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
            <tr>
              <th className="px-4 py-4 cursor-pointer text-center" onClick={() => handleSort('name')}>{t.colName} {renderSortIcon('name')}</th>
              <th className="px-4 py-4 cursor-pointer text-center" onClick={() => handleSort('location')}>{t.colLocation} {renderSortIcon('location')}</th>
              <th className="px-4 py-4 cursor-pointer text-center" onClick={() => handleSort('amount')}>{t.colAlloc} {renderSortIcon('amount')}</th>
              <th className="px-4 py-4 cursor-pointer text-center" onClick={() => handleSort('riskLevel')}>{t.colRisk} {renderSortIcon('riskLevel')}</th>
              <th className="px-4 py-4 cursor-pointer text-center" onClick={() => handleSort('expectedReturnRate')}>{t.colReturn} {renderSortIcon('expectedReturnRate')}</th>
              <th className="px-4 py-4 text-center">{t.colAction}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedAssets.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-600 font-bold italic">{t.noAssets}</td></tr>
            ) : (
              sortedAssets.map((asset) => {
                const percentage = simulationPrincipal > 0 ? (asset.amount / simulationPrincipal * 100).toFixed(1) : '0.0';
                const isEditing = editingRow?.id === asset.id;
                return (
                <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 group transition-colors">
                  <td className="px-4 py-4 text-center">
                    {isEditing ? (
                      <input type="text" value={editingRow.name} onChange={(e) => setEditingRow({...editingRow, name: e.target.value})} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 font-bold text-center focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm" />
                    ) : (
                      <span className="font-bold text-slate-800 dark:text-slate-200 break-words">{asset.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {isEditing ? (
                      <div className="relative w-full">
                        <select value={editingRow.location} onChange={(e) => setEditingRow({...editingRow, location: e.target.value})} className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[11px] font-black text-center focus:ring-4 focus:ring-indigo-500/10 outline-none pr-8 shadow-sm dark:text-slate-200">
                          <option value="" className="dark:bg-slate-800">-</option>
                          {availableLocations.map(l => <option key={l} value={l} className="dark:bg-slate-800">{l}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400"><ChevronDown className="w-4 h-4" /></div>
                      </div>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] font-black bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 px-3 py-1 rounded-lg inline-block uppercase tracking-wider">{asset.location || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                     {isEditing ? (
                        <input type="number" value={editingRow.amount} onChange={(e) => setEditingRow({...editingRow, amount: e.target.value})} className="w-32 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 font-black text-center focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm" />
                     ) : (
                       <div className="flex flex-col items-center">
                          <span className="text-slate-700 dark:text-slate-300 font-black text-sm">{formatCurrency(asset.amount)}</span>
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-2 overflow-hidden shadow-inner">
                             <div className="bg-indigo-500 dark:bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                          </div>
                       </div>
                     )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {isEditing ? (
                      <div className="relative inline-block w-full">
                        <select value={editingRow.riskLevel} onChange={(e) => setEditingRow({...editingRow, riskLevel: e.target.value as RiskLevel})} className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[11px] font-black text-center focus:ring-4 focus:ring-indigo-500/10 outline-none pr-8 shadow-sm dark:text-slate-200">
                          {Object.values(RiskLevel).map(r => <option key={r} value={r} className="dark:bg-slate-800">{r}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400"><ChevronDown className="w-4 h-4" /></div>
                      </div>
                    ) : (
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border shadow-sm ${getRiskColor(asset.riskLevel)}`}>{asset.riskLevel}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {isEditing ? (
                      <input type="number" step="0.1" value={editingRow.expectedReturnRate} onChange={(e) => setEditingRow({...editingRow, expectedReturnRate: e.target.value})} className="w-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-indigo-600 dark:text-indigo-400 font-black text-center focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm" />
                    ) : (
                      <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/50">{asset.expectedReturnRate}%</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <>
                          <button onClick={saveEdit} className="text-emerald-600 dark:text-emerald-400 p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl"><Check className="w-5 h-5" /></button>
                          <button onClick={cancelEdit} className="text-red-500 dark:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"><X className="w-5 h-5" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(asset)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl"><Pencil className="w-5 h-5" /></button>
                          <button onClick={() => onRemoveAsset(asset.id)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )})
            )}
            <tr className="bg-slate-50 dark:bg-slate-950/40 border-t-2 border-slate-100 dark:border-slate-800 font-black italic text-slate-500 dark:text-slate-400 transition-colors">
               <td className="px-4 py-6 text-center">{t.cash}</td>
               <td className="px-4 py-6 text-center text-slate-300 dark:text-slate-700">-</td>
               <td className="px-4 py-6 text-center flex flex-col items-center">
                 <span className="text-slate-500 dark:text-slate-400 font-black">{formatCurrency(cashAmountFromSim)}</span>
                 <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1 rounded-full mt-2 overflow-hidden shadow-inner">
                    <div className="bg-slate-400 dark:bg-slate-600 h-full" style={{ width: `${cashPercentage}%` }}></div>
                 </div>
               </td>
               <td className="px-4 py-6 text-center"><span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 uppercase">{RiskLevel.R1}</span></td>
               <td className="px-4 py-6 text-center text-slate-300 dark:text-slate-700">0.0%</td>
               <td className="px-4 py-6 text-center"><Lock className="w-4 h-4 text-slate-200 dark:text-slate-800 inline-block" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
