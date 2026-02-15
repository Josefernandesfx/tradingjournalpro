
import React, { useMemo } from 'react';
import { User, Trade } from '../types';
import { db } from '../db';
import { useTranslation } from '../i18nContext';
import PremiumTitle from '../components/PremiumTitle';

const RankIcon: React.FC<{ tierName: string; glowColor: string }> = ({ tierName, glowColor }) => {
  const getIcon = () => {
    switch (tierName) {
      case 'Bronze':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(180,83,9,0.3)]">
            <defs>
              <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
            </defs>
            <path d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z" fill="url(#bronzeGrad)" stroke="#b45309" strokeWidth="2" />
            <path d="M50 15 L75 30 L75 70 L50 85 L25 70 L25 30 Z" fill="rgba(0,0,0,0.2)" />
            <text x="50" y="60" textAnchor="middle" fill="#fde68a" fontSize="30" fontWeight="bold">B</text>
          </svg>
        );
      case 'Silver':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(148,163,184,0.4)]">
            <defs>
              <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            <path d="M50 5 L90 30 L80 85 L50 95 L20 85 L10 30 Z" fill="url(#silverGrad)" stroke="#64748b" strokeWidth="2" />
            <path d="M50 15 L78 34 L70 78 L50 85 L30 78 L22 34 Z" fill="rgba(255,255,255,0.1)" />
            <text x="50" y="62" textAnchor="middle" fill="#1e293b" fontSize="35" fontWeight="black">S</text>
          </svg>
        );
      case 'Gold':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_25px_rgba(234,179,8,0.5)]">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#goldGrad)" stroke="#854d0e" strokeWidth="3" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="5 5" />
            <text x="50" y="65" textAnchor="middle" fill="#451a03" fontSize="45" fontWeight="900">G</text>
          </svg>
        );
      case 'Platinum':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_30px_rgba(34,211,238,0.6)]">
            <defs>
              <linearGradient id="platGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ecfeff" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>
            </defs>
            <rect x="15" y="15" width="70" height="70" rx="15" fill="url(#platGrad)" stroke="#0e7490" strokeWidth="3" transform="rotate(45 50 50)" />
            <text x="50" y="65" textAnchor="middle" fill="white" fontSize="45" fontWeight="900" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>P</text>
          </svg>
        );
      case 'Diamond':
        return (
          <div className="relative w-full h-full">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_40px_rgba(59,130,246,0.8)]">
              <defs>
                <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#dbeafe" />
                  <stop offset="30%" stopColor="#60a5fa" />
                  <stop offset="70%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
              </defs>
              {/* Main Crystal Shape */}
              <path d="M50 5 L90 40 L50 95 L10 40 Z" fill="url(#diamondGrad)" stroke="#1d4ed8" strokeWidth="1.5" />
              {/* Facets */}
              <path d="M50 5 L90 40 L10 40 Z" fill="rgba(255,255,255,0.2)" />
              <path d="M50 5 L50 95" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <path d="M10 40 L90 40" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            </svg>
            <div className="absolute top-2 left-1/4 w-2 h-2 bg-white rounded-full animate-sparkle" />
            <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-sparkle" style={{ animationDelay: '0.5s' }} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center animate-float-rank">
      {getIcon()}
    </div>
  );
};

const DisciplineRanking: React.FC<{ user: User }> = ({ user }) => {
  const trades = useMemo(() => db.getTrades(user.id), [user.id]);
  const { t } = useTranslation();
  
  const rankInfo = useMemo(() => {
    let score = 100;
    const now = Date.now();
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const prev7Days = new Date(now - 14 * 24 * 60 * 60 * 1000);
    
    const recentTrades = trades.filter(t => new Date(t.date) >= last7Days);
    const pastTrades = trades.filter(t => new Date(t.date) >= prev7Days && new Date(t.date) < last7Days);
    
    const calculateScore = (dataset: Trade[]) => {
      if (dataset.length === 0) return 100;
      let s = 100;
      const violations = dataset.filter(t => !t.rulesFollowed).length;
      s -= (violations * 15);
      const riskEscalations = dataset.filter(t => (t.autoFlags || []).includes('Risk escalation')).length;
      s -= (riskEscalations * 10);
      return Math.max(0, Math.min(100, s));
    };

    const currentScore = calculateScore(recentTrades);
    const pastScore = calculateScore(pastTrades);
    const trend = currentScore >= pastScore ? 'up' : 'down';

    const tiers = [
      { name: 'Bronze', min: 0, color: 'text-amber-700', glow: 'rgba(180,83,9,0.2)', bg: 'bg-amber-700/5' },
      { name: 'Silver', min: 21, color: 'text-slate-400', glow: 'rgba(148,163,184,0.3)', bg: 'bg-slate-400/5' },
      { name: 'Gold', min: 41, color: 'text-yellow-500', glow: 'rgba(234,179,8,0.4)', bg: 'bg-yellow-500/5' },
      { name: 'Platinum', min: 61, color: 'text-cyan-400', glow: 'rgba(34,211,238,0.5)', bg: 'bg-cyan-400/5' },
      { name: 'Diamond', min: 81, color: 'text-blue-500', glow: 'rgba(59,130,246,0.6)', bg: 'bg-blue-500/5' },
    ];

    const currentTier = tiers.slice().reverse().find(t => currentScore >= t.min) || tiers[0];

    return { score: currentScore, trend, currentTier };
  }, [trades]);

  return (
    <div className="space-y-12 page-transition pb-20">
      <header>
        <PremiumTitle as="h1" className="text-5xl">
          {t('disciplineRanking')}
        </PremiumTitle>
        <p className="text-slate-500 mt-2 font-medium">{t('quantifyingAdherence')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-center space-y-6 flex flex-col items-center">
          <div className="relative group w-80 h-80 flex items-center justify-center">
             {/* Rank Aura */}
             <div 
               className="absolute inset-0 rounded-full blur-[60px] opacity-40 transition-all duration-1000"
               style={{ backgroundColor: rankInfo.currentTier.glow }}
             />
             
             {/* Tier Container */}
             <div className="relative z-10 w-64 h-64">
                <RankIcon tierName={rankInfo.currentTier.name} glowColor={rankInfo.currentTier.glow} />
             </div>

             {/* Level Up Flare (Static since we don't track session change here) */}
             <div className="absolute -inset-4 border border-white/5 rounded-full scale-110 pointer-events-none group-hover:scale-125 transition-transform duration-700" />
             
             {/* Trend Badge */}
             <div className="absolute top-0 right-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-2xl z-20">
                {rankInfo.trend === 'up' ? (
                  <div className="flex flex-col items-center">
                    <svg className="text-emerald-400 w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 15l7-7 7 7"/></svg>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">Gaining Edge</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg className="text-rose-400 w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7"/></svg>
                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1">Variance Alert</span>
                  </div>
                )}
             </div>
          </div>

          <div className="space-y-2">
            <span className={`text-sm font-black uppercase tracking-[0.4em] ${rankInfo.currentTier.color}`}>{t('tier')}</span>
            <h2 className="text-6xl font-black text-white tracking-tighter uppercase">{rankInfo.currentTier.name}</h2>
            <div className="inline-flex mt-4 px-8 py-3 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-xl">
              <span className="text-base font-black text-white tracking-tight">{t('integrityScore')}: {rankInfo.score}/100</span>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-slate-900/40 border border-slate-800/40 p-10 rounded-[48px] backdrop-blur-md relative overflow-hidden">
            <div className="shine-overlay" />
            <PremiumTitle as="h3" className="text-xl mb-8" variant="secondary">
              {t('sessionFactors')}
            </PremiumTitle>
            <div className="space-y-8 relative z-10">
              {[
                { label: t('ruleFidelity'), score: trades.length > 0 ? (trades.filter(t => t.rulesFollowed).length / trades.length * 100) : 100 },
                { label: t('riskProtection'), score: trades.length > 0 ? (100 - (trades.filter(t => (t.autoFlags || []).length > 0).length / trades.length * 100)) : 100 },
                { label: t('routineConsistency'), score: Math.min(100, (user.streakCount || 0) * 10) },
              ].map(item => (
                <div key={item.label} className="space-y-3">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <span>{item.label}</span>
                    <span className="text-white">{item.score.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className={`p-8 rounded-[40px] text-center border transition-colors duration-1000 ${rankInfo.currentTier.name === 'Diamond' ? 'bg-blue-600/10 border-blue-500/20' : 'bg-white/5 border-white/5'}`}>
            <p className="text-xs text-slate-300 font-bold leading-relaxed italic">
              "{t('rankNote')}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisciplineRanking;
