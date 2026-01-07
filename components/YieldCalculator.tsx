
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Language, Currency } from '../types';
import { translations } from '../i18n';
import { Calculator, Calendar, ArrowRightLeft, TrendingUp } from 'lucide-react';

interface YieldCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currency: Currency;
}

export const YieldCalculator: React.FC<YieldCalculatorProps> = ({ isOpen, onClose, language, currency }) => {
  const t = translations[language];
  const [initial, setInitial] = useState<string>('');
  const [final, setFinal] = useState<string>('');
  const [days, setDays] = useState<string>('');

  const calculate = () => {
    if (!initial || !final || !days) return { annualized: 0, total: 0 };
    const p = parseFloat(initial);
    const f = parseFloat(final);
    const d = parseFloat(days);
    if (isNaN(p) || isNaN(f) || isNaN(d) || p <= 0 || d <= 0) return { annualized: 0, total: 0 };
    const totalReturn = (f - p) / p;
    const years = d / 365;
    const annualized = (Math.pow(f / p, 1 / years) - 1) * 100;
    return { 
      annualized: isNaN(annualized) ? 0 : annualized, 
      total: totalReturn * 100 
    };
  };

  const { annualized, total } = calculate();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.yieldCalculator}>
      <div className="space-y-6 p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">{t.calcExplain}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.calcInitial}</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 text-sm">{currency === 'USD' ? '$' : '¥'}</span>
              <input 
                type="number" 
                value={initial} 
                placeholder="10000"
                onChange={(e) => setInitial(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.calcFinal}</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 text-sm">{currency === 'USD' ? '$' : '¥'}</span>
              <input 
                type="number" 
                value={final} 
                placeholder="11000"
                onChange={(e) => setFinal(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.calcDays}</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 w-4 h-4" />
              <input 
                type="number" 
                value={days} 
                placeholder="365"
                onChange={(e) => setDays(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 dark:bg-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden transition-colors">
          <TrendingUp className="absolute right-[-20px] bottom-[-20px] w-32 h-32 opacity-10" />
          <div className="relative z-10 grid grid-cols-2 gap-4 divide-x divide-white/20">
            <div className="text-center">
              <div className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">{t.calcResult}</div>
              <div className="text-2xl font-black">{annualized.toFixed(2)}%</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">{t.calcTotalReturn}</div>
              <div className="text-2xl font-black">{total.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl transition-colors"
        >
          {t.close}
        </button>
      </div>
    </Modal>
  );
};
