
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { User, AppSettings } from './types';
import { db } from './db';
import { ICONS } from './constants';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import Performance from './pages/Performance';
import Psychology from './pages/Psychology';
import Calendar from './pages/Calendar';
import AICoach from './pages/AICoach';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import { I18nProvider, useTranslation } from './i18nContext';
import BackgroundArt from './components/BackgroundArt';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(db.getCurrentUser());
  const { language, setLanguage, t } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('tjp_settings');
    return saved ? JSON.parse(saved) : { theme: 'dark', language: 'en' };
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('tjp_settings', JSON.stringify({ ...settings, language }));
  }, [settings, language]);

  const handleLogout = () => {
    db.setCurrentUser(null);
    setUser(null);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    if (newSettings.language) setLanguage(newSettings.language);
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  if (!user) {
    return (
      <I18nProvider>
        <Auth onLogin={setUser} />
      </I18nProvider>
    );
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout} settings={settings} t={t}>
        <BackgroundArt />
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/trades" element={<Trades user={user} />} />
          <Route path="/performance" element={<Performance user={user} />} />
          <Route path="/psychology" element={<Psychology user={user} />} />
          <Route path="/calendar" element={<Calendar user={user} />} />
          <Route path="/coach" element={<AICoach user={user} />} />
          <Route path="/achievements" element={<Achievements user={user} />} />
          <Route path="/settings" element={<Settings settings={settings} onUpdate={updateSettings} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

const App: React.FC = () => (
  <I18nProvider>
    <AppContent />
  </I18nProvider>
);

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  settings: AppSettings;
  t: any;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, settings, t }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { label: t('dashboard'), path: '/', icon: ICONS.Dashboard },
    { label: t('trades'), path: '/trades', icon: ICONS.Trades },
    { label: t('performance'), path: '/performance', icon: (props: any) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
    )},
    { label: t('psychology'), path: '/psychology', icon: ICONS.Psychology },
    { label: t('calendar'), path: '/calendar', icon: ICONS.Calendar },
    { label: t('coach'), path: '/coach', icon: ICONS.AICoach },
    { label: t('achievements'), path: '/achievements', icon: ICONS.Achievements },
    { label: t('settings'), path: '/settings', icon: ICONS.Settings },
  ];

  return (
    <div className="min-h-screen bg-[#04070F] text-slate-100 transition-colors duration-500 flex flex-col md:flex-row relative z-0">
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0B0B0B]/80 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-20">
        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">TJP</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0B0B0B]/90 backdrop-blur-xl border-r border-slate-800/40 transform transition-transform duration-300 md:translate-x-0 md:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 hidden md:block">
            <h1 className="text-2xl font-black bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              TRADING JOURNAL PRO
            </h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-blue-400' : ''}`} />
                  <span className="font-semibold text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 mt-auto border-t border-slate-800/40">
             <div className="flex items-center space-x-3 px-4 py-3 mb-4 rounded-xl bg-slate-900/50">
               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                 {user.name[0]}
               </div>
               <div className="overflow-hidden">
                 <p className="text-sm font-bold truncate">{user.name}</p>
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Level {user.level || 1}</p>
               </div>
             </div>
            <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-2 text-slate-500 hover:text-rose-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              <span className="text-sm font-bold uppercase tracking-wider">{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6 md:p-10 relative z-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
};

export default App;
