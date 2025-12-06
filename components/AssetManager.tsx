
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, PieChart, ChevronDown, ChevronUp, Pencil, Check, X, Lock, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Asset, RiskLevel, Language, Currency } from '../types';
import { translations } from '../i18n';

interface AssetManagerProps {
  assets: Asset[];
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset: (asset: Asset) => void;
  onRemoveAsset: (id: string) => void;
  simulationPrincipal: number;
  totalRecorded: number;
  language: Language;
  currency: Currency;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type SortKey = 'name' | 'riskLevel' | 'amount' | 'expectedReturnRate';
type SortDirection = 'asc' | 'desc';

interface EditingRowState {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  amount: string;
  expectedReturnRate: string;
}

export const AssetManager: React.FC<AssetManagerProps> = ({ 
  assets, 
  onAddAsset, 
  onUpdateAsset, 
  onRemoveAsset, 
  simulationPrincipal,
  totalRecorded,
  language,
  currency,
  onShowToast
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Local state for editing a single row
  const [editingRow, setEditingRow] = useState<EditingRowState | null>(null);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: SortDirection }>({
    key: null,
    direction: 'asc',
  });

  // New Asset State
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetRisk, setNewAssetRisk] = useState<RiskLevel>(RiskLevel.R3);
  const [newAssetAmount, setNewAssetAmount] = useState<string>('10000');
  const [newAssetReturn, setNewAssetReturn] = useState<string>('6.0');

  const t = translations[language];

  // Auto-update expected return based on risk level
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

  const handleNewAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || parseFloat(val) >= 0) {
      setNewAssetAmount(val);
    }
  };

  const handleNewReturnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || parseFloat(val) >= 0) {
      setNewAssetReturn(val);
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
      riskLevel: newAssetRisk,
      amount: amount,
      expectedReturnRate: returnRate,
    };
    onAddAsset(newAsset);
    setNewAssetName('');
    setNewAssetAmount('10000');
  };

  const startEdit = (asset: Asset) => {
    setEditingRow({
      id: asset.id,
      name: asset.name,
      riskLevel: asset.riskLevel,
      amount: asset.amount.toString(),
      expectedReturnRate: asset.expectedReturnRate.toString()
    });
  };

  const cancelEdit = () => {
    setEditingRow(null);
  };

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
        
        // String localeCompare for names
        if (typeof aValue === 'string' && typeof bValue === 'string') {
           return sortConfig.direction === 'asc' 
             ? aValue.localeCompare(bValue) 
             : bValue.localeCompare(aValue);
        }

        // Numeric comparison
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableAssets;
  }, [assets, sortConfig]);

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline-block" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600 ml-1 inline-block" /> 
      : <ArrowDown className="w-3 h-3 text-indigo-600 ml-1 inline-block" />;
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', { 
    style: 'currency', 
    currency: currency,
    notation: "compact",
    maximumFractionDigits: 1
  }).format(val);

  // Calculate utilization
  const utilization = simulationPrincipal > 0 ? (totalRecorded / simulationPrincipal) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      {/* Title Section */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-indigo-500" />
          {t.assetsTitle}
        </h2>
      </div>
      
      {/* Stats Section - Grid Layout 3 Cols */}
      <div className="grid grid-cols-3 gap-3 w-full mb-6">
          {/* Read-only Initial Principal (First) */}
          <div className="flex flex-col justify-center bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 opacity-80 cursor-not-allowed w-full overflow-hidden" title="Edit this in Simulation Config">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide truncate w-full">{t.initialPrincipal}</span>
            <div className="flex items-center gap-1 mt-0.5">
               <span className="text-indigo-900 font-bold text-sm truncate">
                  {formatCurrency(simulationPrincipal)}
               </span>
               <Lock className="w-3 h-3 text-indigo-400 flex-shrink-0" />
            </div>
          </div>

          {/* Read-only Total Recorded (Second) */}
          <div className="flex flex-col justify-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 w-full overflow-hidden">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate w-full">{t.totalRecorded}</span>
             <span 
               className="text-sm font-bold text-slate-700 cursor-help border-b border-dotted border-slate-400 w-fit mt-0.5 truncate max-w-full"
               title={`${currency} ${totalRecorded.toLocaleString()}`}
             >
               {formatCurrency(totalRecorded)}
             </span>
          </div>

          {/* Utilization Ratio (Third) */}
          <div className="flex flex-col justify-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 w-full overflow-hidden">
             <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide truncate w-full">{t.utilization}</span>
             <span className="text-sm font-bold text-blue-700 mt-0.5">
               {utilization.toFixed(1)}%
             </span>
          </div>
      </div>

      {/* Toggle Add New Asset Form */}
      <div className="mb-4">
        <button 
          onClick={() => setIsAddOpen(!isAddOpen)}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all w-full justify-center border ${
            isAddOpen 
              ? 'bg-slate-50 text-slate-600 border-slate-200' 
              : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50 shadow-sm'
          }`}
        >
          {isAddOpen ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {t.addAssetButton}
        </button>
      </div>

      {/* Add New Asset Form (Collapsible) */}
      {isAddOpen && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-fade-in">
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.nameLabel}</label>
            <input
              type="text"
              placeholder={language === 'zh' ? "例如：标普500 ETF" : "e.g. S&P 500 ETF"}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white placeholder:text-slate-300"
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.riskLabel}</label>
            <div className="relative">
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white appearance-none cursor-pointer"
                value={newAssetRisk}
                onChange={(e) => handleRiskChange(e.target.value as RiskLevel)}
              >
                {Object.values(RiskLevel).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.amountLabel} ({currency === 'USD' ? '$' : '¥'})</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white placeholder:text-slate-300"
              value={newAssetAmount}
              onChange={handleNewAmountChange}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.returnLabel}</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white placeholder:text-slate-300"
              value={newAssetReturn}
              onChange={handleNewReturnChange}
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={handleAdd}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> {t.add}
            </button>
          </div>
        </div>
      )}

      {/* Asset List */}
      <div className="overflow-x-auto -mx-6 px-6 pb-2 scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-sm text-left border-collapse min-w-[600px]">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200 select-none">
            <tr>
              <th 
                className="px-2 py-3 font-semibold w-[28%] cursor-pointer hover:bg-slate-100 transition-colors text-center"
                onClick={() => handleSort('name')}
              >
                {t.colName} {renderSortIcon('name')}
              </th>
              <th 
                className="px-2 py-3 font-semibold w-[15%] cursor-pointer hover:bg-slate-100 transition-colors text-center"
                onClick={() => handleSort('riskLevel')}
              >
                {t.colRisk} {renderSortIcon('riskLevel')}
              </th>
              <th 
                className="px-2 py-3 font-semibold w-[27%] cursor-pointer hover:bg-slate-100 transition-colors text-center"
                onClick={() => handleSort('amount')}
              >
                {t.colAlloc} {renderSortIcon('amount')}
              </th>
              <th 
                className="px-2 py-3 font-semibold w-[15%] cursor-pointer hover:bg-slate-100 transition-colors text-center"
                onClick={() => handleSort('expectedReturnRate')}
              >
                {t.colReturn} {renderSortIcon('expectedReturnRate')}
              </th>
              <th className="px-2 py-3 font-semibold text-center w-[15%]">{t.colAction}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedAssets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {t.noAssets}
                </td>
              </tr>
            ) : (
              sortedAssets.map((asset) => {
                const percentage = totalRecorded > 0 ? (asset.amount / totalRecorded * 100).toFixed(1) : '0.0';
                const isEditing = editingRow?.id === asset.id;
                
                return (
                <tr key={asset.id} className="hover:bg-slate-50/50 group transition-colors">
                  <td className="px-2 py-3 align-middle text-center">
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editingRow.name}
                        onChange={(e) => setEditingRow({...editingRow, name: e.target.value})}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs text-center"
                      />
                    ) : (
                      <span className="font-medium text-slate-800">{asset.name}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 align-middle text-center">
                    {isEditing ? (
                      <div className="relative">
                        <select
                          value={editingRow.riskLevel}
                          onChange={(e) => setEditingRow({...editingRow, riskLevel: e.target.value as RiskLevel})}
                          className={`w-full appearance-none bg-white border border-slate-300 rounded py-1 pl-2 pr-5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs font-medium cursor-pointer text-center`}
                        >
                          {Object.values(RiskLevel).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-slate-400">
                          <ChevronDown className="w-3 h-3" />
                        </div>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider justify-center
                        ${asset.riskLevel === 'R1' ? 'bg-green-100 text-green-700' :
                          asset.riskLevel === 'R2' ? 'bg-teal-100 text-teal-700' :
                          asset.riskLevel === 'R3' ? 'bg-blue-100 text-blue-700' :
                          asset.riskLevel === 'R4' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {asset.riskLevel}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 align-middle text-center">
                     {isEditing ? (
                       <div className="flex items-center justify-center">
                          <span className="text-slate-400 text-xs mr-1">{currency === 'USD' ? '$' : '¥'}</span>
                          <input 
                            type="number"
                            value={editingRow.amount}
                            placeholder="0"
                            onChange={(e) => setEditingRow({...editingRow, amount: e.target.value})}
                            className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs text-center"
                          />
                       </div>
                     ) : (
                       <div className="flex flex-col items-center">
                          <span className="text-slate-700 font-bold text-xs">
                            {formatCurrency(asset.amount)}
                          </span>
                          <div className="flex items-center gap-2 mt-1 justify-center w-full">
                             <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full" style={{ width: `${percentage}%` }}></div>
                             </div>
                             <span className="text-[10px] text-slate-400">{percentage}%</span>
                          </div>
                       </div>
                     )}
                  </td>
                  <td className="px-2 py-3 align-middle text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center">
                        <input 
                            type="number"
                            step="0.1"
                            value={editingRow.expectedReturnRate}
                            placeholder="0"
                            onChange={(e) => setEditingRow({...editingRow, expectedReturnRate: e.target.value})}
                            className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-indigo-600 font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center text-xs"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <span className="text-indigo-600 font-bold text-xs bg-indigo-50 px-1.5 py-0.5 rounded block w-fit">
                          {asset.expectedReturnRate}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center align-middle whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={saveEdit}
                          className="text-emerald-600 hover:text-emerald-700 transition-colors p-1.5 rounded-lg hover:bg-emerald-50"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-500 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                        <button
                          onClick={() => startEdit(asset)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-indigo-50 mr-1"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRemoveAsset(asset.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
