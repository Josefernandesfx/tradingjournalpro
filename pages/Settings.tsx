
import React, { useState, useEffect } from 'react';
import { AppSettings, Language, TradingRule, User } from '../types';
import { LANGUAGES } from '../constants';
import { useTranslation } from '../i18nContext';
import { db } from '../db';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (newSettings: Partial<AppSettings>) => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onLogout }) => {
  const { t } = useTranslation();
  const user = db.getCurrentUser() as User;
  const [rules, setRules] = useState<TradingRule[]>([]);
  const [newRule, setNewRule] = useState('');

  useEffect(() => {
    if (user) {
      setRules(db.getRules(user.id));
    }
  }, [user]);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    const rule: TradingRule = {
      id: crypto.randomUUID(),
      userId: user.id,
      description: newRule
    };
    db.saveRule(rule);
    setRules(db.getRules(user.id));
    setNewRule('');
  };

  const handleDeleteRule = (id: string) => {
    db.deleteRule(id);
    setRules(db.getRules(user.id));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-4xl font-black">{t('settings')}</h2>
        <p className="text-slate-500 mt-2">Platform configuration and execution guidelines.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* General UI Settings */}
          <section className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md">
            <h3 className="text-xl font-bold mb-6 flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
               {t('appearance')}
            </h3>
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-slate-800/50">
              <div>
                <p className="font-bold text-slate-100">{t('darkMode')}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">High contrast terminal theme</p>
              </div>
              <button 
                onClick={() => onUpdate({ theme: settings.theme === 'light' ? 'dark' : 'light' })} 
                className={`relative w-14 h-7 rounded-full transition-all duration-500 shadow-inner ${settings.theme === 'dark' ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-500 transform ${settings.theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
          </section>

          {/* Language selection */}
          <section className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md">
            <h3 className="text-xl font-bold mb-6 flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
               {t('language')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {LANGUAGES.map(lang => (
                <button 
                  key={lang.code} 
                  onClick={() => onUpdate({ language: lang.code as Language })} 
                  className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all duration-300 ${
                    settings.language === lang.code 
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                      : 'border-slate-800 bg-black/20 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Trading Rules Management */}
        <section className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md flex flex-col h-full">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
                 {t('tradingRules')}
              </h3>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{rules.length} Active</span>
           </div>

           <form onSubmit={handleAddRule} className="mb-6 flex space-x-2">
              <input 
                type="text" 
                placeholder={t('rulePlaceholder')} 
                value={newRule} 
                onChange={e => setNewRule(e.target.value)}
                className="flex-1 bg-black/30 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-emerald-500 transition-colors"
              />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-xl font-bold text-xs uppercase transition-all shadow-lg shadow-emerald-500/10">
                 {t('addRule')}
              </button>
           </form>

           <div className="space-y-3 flex-1 overflow-auto max-h-[400px] pr-2">
              {rules.length > 0 ? rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-slate-800/50 group hover:border-slate-700 transition-all">
                  <p className="text-sm font-medium text-slate-300 leading-relaxed">{rule.description}</p>
                  <button onClick={() => handleDeleteRule(rule.id)} className="text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all ml-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                   <p className="text-xs font-bold uppercase tracking-widest">No guidelines defined</p>
                </div>
              )}
           </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
