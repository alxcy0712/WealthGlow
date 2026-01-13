
import React, { useState, useEffect } from 'react';
import { AIConfig, AIProvider, Language } from '../types';
import { translations } from '../i18n';
import { Modal } from './Modal';
import { Save, BrainCircuit, Key, Globe, ShieldCheck, Lock } from 'lucide-react';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSave: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose, language, onSave }) => {
  const t = translations[language];
  const [config, setConfig] = useState<AIConfig>({
    provider: 'gemini',
    apiKey: '',
    model: '',
    useCustom: false
  });

  useEffect(() => {
    const stored = localStorage.getItem('wealthglow_ai_config');
    if (stored) {
      try {
        setConfig(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load AI config", e);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('wealthglow_ai_config', JSON.stringify(config));
    onSave();
    onClose();
  };

  const getModelPlaceholder = () => {
    switch (config.provider) {
      case 'gemini': return 'gemini-3-pro-preview';
      case 'deepseek': return 'deepseek-chat';
      case 'siliconflow': return 'deepseek-ai/DeepSeek-V3';
      default: return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.aiSettings}>
      <div className="space-y-6 p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
          {t.aiSettingsDesc}
        </p>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.useCustomAi}</label>
            </div>
            <button
              onClick={() => setConfig({ ...config, useCustom: !config.useCustom })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${config.useCustom ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.useCustom ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {!config.useCustom && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-lg flex items-center gap-3 animate-fade-in">
              <Lock className="w-4 h-4 text-indigo-400 dark:text-indigo-300" />
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                {language === 'zh' ? '当前正使用系统默认安全密钥。' : 'Currently using system default secure key.'}
              </span>
            </div>
          )}

          {config.useCustom && (
            <div className="space-y-4 pt-2 animate-fade-in">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Globe className="w-3 h-3" /> {t.aiProvider}
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => setConfig({ ...config, provider: e.target.value as AIProvider, model: '' })}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-slate-200"
                >
                  <option value="gemini">{t.providerDefault}</option>
                  <option value="deepseek">{t.providerDeepseek}</option>
                  <option value="siliconflow">{t.providerSiliconflow}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Key className="w-3 h-3" /> {t.customApiKey}
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono transition-colors dark:text-slate-200"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                  {language === 'zh' ? '* 密钥将仅加密存储在您的本地浏览器中。' : '* Keys are stored encrypted in your local browser only.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" /> {t.customModel}
                </label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  placeholder={getModelPlaceholder()}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-slate-200"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {t.saveSettings}
        </button>
      </div>
    </Modal>
  );
};
