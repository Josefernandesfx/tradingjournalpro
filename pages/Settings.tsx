
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AppSettings, Language, TradingRule, User, RiskType, UserGoal, AnimationIntensity } from '../types';
import { useTranslation } from '../i18nContext';
import { db } from '../db';
import PremiumTitle from '../components/PremiumTitle';

interface SettingsProps {
  user: User;
  onUserUpdate: (user: User) => void;
  settings: AppSettings;
  onUpdate: (newSettings: Partial<AppSettings>) => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUserUpdate, settings, onUpdate, onLogout }) => {
  const { t } = useTranslation();
  const [rules, setRules] = useState<TradingRule[]>([]);
  const [newRule, setNewRule] = useState('');
  const [initialBalance, setInitialBalance] = useState(user.startingBalance?.toString() || '');

  // Profile Management State
  const [profileName, setProfileName] = useState(user.name);
  const [previewAvatar, setPreviewAvatar] = useState(user.avatarUrl || '');
  const [profileSaveStatus, setProfileSaveStatus] = useState<'idle' | 'success'>('idle');

  // Dropdown Panels State
  const [openSection, setOpenSection] = useState<'gamification' | 'goals' | 'language' | 'visuals' | null>(null);

  // Language Dropdown state
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Risk States
  const [riskType, setRiskType] = useState<RiskType>(user.riskType || 'amount');
  const [riskValue, setRiskValue] = useState(user.defaultRiskValue?.toString() || '');
  const [maxTrades, setMaxTrades] = useState(user.maxTradesPerDay?.toString() || '5');
  const [lossLimitType, setLossLimitType] = useState<RiskType>(user.dailyLossLimitType || 'amount');
  const [lossLimitValue, setLossLimitValue] = useState(user.dailyLossLimitValue?.toString() || '');
  const [mandatorySL, setMandatorySL] = useState(user.mandatorySL || false);

  // Animation States for Buttons
  const [saveBalanceStatus, setSaveBalanceStatus] = useState<'idle' | 'success'>('idle');
  const [saveRiskStatus, setSaveRiskStatus] = useState<'idle' | 'success'>('idle');

  // Goal States
  const [goals, setGoals] = useState<UserGoal[]>(user.goals || []);
  const [goalName, setGoalName] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'auto';
    if (user) {
      setRules(db.getRules(user.id));
      setGoals(user.goals || []);
    }

    const handleScrollOrResize = () => {
      if (isLangOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      }
    };

    window.addEventListener('scroll', handleScrollOrResize);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [user, isLangOpen]);

  const toggleLangDropdown = () => {
    if (!isLangOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    }
    setIsLangOpen(!isLangOpen);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Max 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    onUserUpdate({
      ...user,
      name: profileName,
      avatarUrl: previewAvatar
    });
    setProfileSaveStatus('success');
    setTimeout(() => setProfileSaveStatus('idle'), 2000);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    const rule: TradingRule = { id: crypto.randomUUID(), userId: user.id, description: newRule };
    db.saveRule(rule);
    setRules(db.getRules(user.id));
    setNewRule('');
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) return;
    const newGoal: UserGoal = {
      id: crypto.randomUUID(),
      name: goalName,
      type: 'max_trades',
      period: 'daily',
      targetValue: 3,
      active: true
    };
    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    onUserUpdate({ ...user, goals: updatedGoals });
    setGoalName('');
  };

  const handleSaveBalance = () => {
    onUserUpdate({
      ...user,
      startingBalance: parseFloat(initialBalance) || user.startingBalance
    });
    setSaveBalanceStatus('success');
    setTimeout(() => setSaveBalanceStatus('idle'), 2000);
  };

  const handleSaveRisk = () => {
    onUserUpdate({
      ...user,
      riskType,
      defaultRiskValue: parseFloat(riskValue) || 0,
      maxTradesPerDay: parseInt(maxTrades) || 5,
      dailyLossLimitType: lossLimitType,
      dailyLossLimitValue: parseFloat(lossLimitValue) || 0,
      mandatorySL
    });
    setSaveRiskStatus('success');
    setTimeout(() => setSaveRiskStatus('idle'), 2000);
  };

  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' }
  ];

  const currentLangObj = availableLanguages.find(l => l.code === settings.language) || availableLanguages[0];

  const LanguagePortal = () => {
    if (!isLangOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        <div className="absolute inset-0 pointer-events-auto bg-black/20 backdrop-blur-[2px]" onClick={() => setIsLangOpen(false)} />
        <div 
          className="hidden md:block absolute bg-[#0B0B0B] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ 
            top: coords.top + 8 - window.scrollY, 
            left: coords.left - window.scrollX, 
            width: coords.width,
            maxHeight: '300px'
          }}
        >
          {availableLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                onUpdate({ language: lang.code as Language });
                setIsLangOpen(false);
              }}
              className={`w-full flex items-center space-x-4 px-6 py-4 hover:bg-white/5 transition-colors border-b border-slate-800 last:border-0 ${settings.language === lang.code ? 'bg-blue-600/10' : ''}`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className={`text-sm font-bold ${settings.language === lang.code ? 'text-blue-400' : 'text-slate-400'}`}>{lang.name}</span>
              {settings.language === lang.code && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 ml-auto"><path d="M20 6 9 17l-5-5"/></svg>
              )}
            </button>
          ))}
        </div>
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 pointer-events-auto animate-in slide-in-from-bottom duration-300">
           <div className="bg-[#0B0B0B] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-slate-800 flex justify-center">
                 <div className="w-12 h-1 bg-slate-700 rounded-full" />
              </div>
              <div className="overflow-y-auto">
                {availableLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onUpdate({ language: lang.code as Language });
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center space-x-4 px-8 py-6 hover:bg-white/5 transition-colors border-b border-slate-800 last:border-0 ${settings.language === lang.code ? 'bg-blue-600/10' : ''}`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className={`text-lg font-black ${settings.language === lang.code ? 'text-blue-400' : 'text-slate-200'}`}>{lang.name}</span>
                    {settings.language === lang.code && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 ml-auto"><path d="M20 6 9 17l-5-5"/></svg>
                    )}
                  </button>
                ))}
              </div>
           </div>
        </div>
      </div>,
      document.body
    );
  };

  const CollapsibleSection: React.FC<{ title: string; subtitle?: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode; icon?: React.ReactNode }> = ({ title, subtitle, isOpen, onToggle, children, icon }) => (
    <div className={`bg-slate-900/40 border transition-all duration-300 rounded-3xl backdrop-blur-md overflow-hidden ${isOpen ? 'border-blue-500/50 shadow-2xl scale-[1.01]' : 'border-slate-800/40'}`}>
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-2xl transition-colors ${isOpen ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 group-hover:text-white'}`}>
            {icon || <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>}
          </div>
          <div className="text-left">
            <PremiumTitle as="h3" variant={isOpen ? 'primary' : 'neutral'} className="text-lg" withParallax={false} withShine={isOpen}>
              {title}
            </PremiumTitle>
            {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{subtitle}</p>}
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {isOpen && (
        <div className="p-8 pt-2 border-t border-slate-800/40 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 pointer-events-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <PremiumTitle as="h2" className="text-4xl">
            {t('settings')}
          </PremiumTitle>
          <p className="text-slate-500 mt-2 font-medium">{t('settingsHeader')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          {/* Profile Section */}
          <section className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[40px] backdrop-blur-md">
            <h3 className="text-xl font-bold mb-8 flex items-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {t('profile')}
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl bg-slate-800 flex items-center justify-center">
                  {previewAvatar ? (
                    <img src={previewAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-slate-500 uppercase">{user.name[0]}</span>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('changePhoto')}</span>
                </label>
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('displayName')}</label>
                  <input 
                    type="text" 
                    value={profileName} 
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full bg-black/30 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500" 
                  />
                </div>
                <button 
                  onClick={handleSaveProfile}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-2 ${profileSaveStatus === 'success' ? 'bg-emerald-500 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {profileSaveStatus === 'success' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      <span>{t('profileUpdated')}</span>
                    </>
                  ) : (
                    <span>{t('saveProfile')}</span>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Collapsible Gamification Section */}
          <CollapsibleSection 
            title={t('gamification')} 
            subtitle={t('gamificationDesc')} 
            isOpen={openSection === 'gamification'} 
            onToggle={() => setOpenSection(openSection === 'gamification' ? null : 'gamification')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><rect width="12" height="10" x="6" y="4" rx="1"/></svg>}
          >
            <div className="space-y-3">
              {[
                { key: 'coachEnabled', label: t('motivationalCoach') },
                { key: 'streakEnabled', label: t('streakSystem') + ' 🔥' },
                { key: 'animationsEnabled', label: t('animations') + ' 🎉' },
                { key: 'soundEnabled', label: t('sounds') },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-slate-800">
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <button 
                    onClick={() => onUpdate({ [item.key]: !(settings as any)[item.key] })}
                    className={`w-12 h-6 rounded-full transition-all relative ${ (settings as any)[item.key] ? 'bg-blue-600' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${ (settings as any)[item.key] ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Visual Effects Section */}
          <CollapsibleSection 
            title="Visual Effects" 
            subtitle="Market Ambience & Motion"
            isOpen={openSection === 'visuals'} 
            onToggle={() => setOpenSection(openSection === 'visuals' ? null : 'visuals')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 8.5-4 4-3-3-4 4"/><path d="m3.7 15.5 2.5-2.5 3 3 4.5-4.5 2.6 2.6"/><circle cx="12" cy="12" r="10"/></svg>}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-slate-800">
                <div>
                  <p className="text-sm font-bold text-white">Market Animations</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Live price lines & candles</p>
                </div>
                <button 
                  onClick={() => onUpdate({ marketAnimationsEnabled: !settings.marketAnimationsEnabled })}
                  className={`w-12 h-6 rounded-full transition-all relative ${ settings.marketAnimationsEnabled ? 'bg-blue-600' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${ settings.marketAnimationsEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Animation Intensity</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as AnimationIntensity[]).map(level => (
                    <button 
                      key={level}
                      onClick={() => onUpdate({ animationIntensity: level })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${settings.animationIntensity === level ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-slate-800">
                <div>
                  <p className="text-sm font-bold text-white">Reduced Motion</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">For accessibility & performance</p>
                </div>
                <button 
                  onClick={() => onUpdate({ reducedMotion: !settings.reducedMotion })}
                  className={`w-12 h-6 rounded-full transition-all relative ${ settings.reducedMotion ? 'bg-blue-600' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${ settings.reducedMotion ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </CollapsibleSection>

          {/* Compact Dropdown Section for Goals/Rules */}
          <CollapsibleSection 
            title={t('personalizedGoals')} 
            subtitle="Targets & Milestones"
            isOpen={openSection === 'goals'} 
            onToggle={() => setOpenSection(openSection === 'goals' ? null : 'goals')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>}
          >
            <form onSubmit={handleAddGoal} className="flex space-x-2 mb-6">
              <input 
                type="text" 
                placeholder={t('addGoalPlaceholder')} 
                value={goalName} 
                onChange={e => setGoalName(e.target.value)}
                className="flex-1 bg-black/30 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-white"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-bold text-xs uppercase transition-all">{t('add')}</button>
            </form>
            <div className="space-y-2">
              {goals.map(goal => (
                <div key={goal.id} className="p-4 bg-black/20 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-300">{goal.name}</span>
                  <div className="flex space-x-2">
                    <span className="text-[10px] font-black uppercase text-blue-400">{goal.period}</span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <section className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md">
            <h3 className="text-xl font-bold mb-6 flex items-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              {t('language')}
            </h3>
            <div className="relative">
              <button 
                ref={buttonRef}
                onClick={toggleLangDropdown}
                className={`w-full flex items-center justify-between px-6 py-4 bg-black/30 border rounded-2xl transition-all group ${isLangOpen ? 'border-blue-500' : 'border-slate-800 hover:border-slate-600'}`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-xl">{currentLangObj.flag}</span>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{t('currentLanguage')}</p>
                    <p className="text-sm font-black text-white">{currentLangObj.name}</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-500 group-hover:text-blue-400 transition-transform duration-300 ${isLangOpen ? 'rotate-180 text-blue-400' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <LanguagePortal />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md">
            <h3 className="text-xl font-bold mb-6 flex items-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>
              {t('initialBalance')}
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('initialBalance')} ($)</label>
                <input 
                  type="number" 
                  value={initialBalance} 
                  onChange={e => setInitialBalance(e.target.value)} 
                  className="w-full bg-black/30 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-white" 
                  placeholder="10000" 
                />
              </div>
              <button 
                onClick={handleSaveBalance} 
                className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center space-x-2 ${saveBalanceStatus === 'success' ? 'bg-emerald-500 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {saveBalanceStatus === 'success' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    <span>{t('savedSuccess')}</span>
                  </>
                ) : (
                  <span>{t('saveBalance')}</span>
                )}
              </button>
            </div>
          </section>

          <section className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md">
            <h3 className="text-xl font-bold mb-6 flex items-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
              {t('riskMgmt')}
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('riskPerTrade')}</label>
                  <div className="flex bg-black/40 p-1 rounded-xl border border-slate-800">
                    <input type="number" value={riskValue} onChange={e => setRiskValue(e.target.value)} className="flex-1 bg-transparent border-none p-1 text-sm outline-none font-bold text-white" placeholder="100" />
                    <select value={riskType} onChange={e => setRiskType(e.target.value as RiskType)} className="bg-slate-800 rounded-lg text-[10px] px-2 font-black border-none outline-none text-white">
                      <option value="amount">$</option>
                      <option value="pct">%</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('maxTradesDay')}</label>
                  <input type="number" value={maxTrades} onChange={e => setMaxTrades(e.target.value)} className="w-full bg-black/30 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-white" placeholder="5" />
                </div>
              </div>
              <button 
                onClick={handleSaveRisk} 
                className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center space-x-2 ${saveRiskStatus === 'success' ? 'bg-emerald-500 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {saveRiskStatus === 'success' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    <span>{t('riskUpdated')}</span>
                  </>
                ) : (
                  <span>{t('saveRisk')}</span>
                )}
              </button>
            </div>
          </section>

          <section className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md flex flex-col h-full">
            <h3 className="text-xl font-bold mb-8 flex items-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
              {t('tradingRules')}
            </h3>
            <form onSubmit={handleAddRule} className="mb-6 flex space-x-2">
              <input type="text" placeholder={t('rulePlaceholder')} value={newRule} onChange={e => setNewRule(e.target.value)} className="flex-1 bg-black/30 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-emerald-500 text-white" />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-xl font-bold text-xs uppercase transition-all shadow-lg">{t('add')}</button>
            </form>
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-slate-800/50">
                  <p className="text-sm font-medium text-slate-300 leading-relaxed">{rule.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
