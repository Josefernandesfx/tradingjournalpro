
import React, { useMemo, useState, useEffect } from 'react';
import { User, Trade, AppSettings } from '../types';
import { db } from '../db';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../i18nContext';
import { useNavigate } from 'react-router-dom';
import MotivationalCoach from '../components/MotivationalCoach';
import StreakFlame from '../components/StreakFlame';
import DailyChecklist from '../components/DailyChecklist';
import PsychCoach from '../components/PsychCoach';
import Confetti from '../components/Confetti';
import PremiumTitle from '../components/PremiumTitle';

interface DashboardProps {
  user: User;
  settings: AppSettings;
}

const MetricCard: React.FC<{ label: string, value: string | number, color: string, icon?: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="bg-slate-900/40 border border-slate-800/40 p-6 rounded-3xl backdrop-blur-md hover:border-blue-500/30 transition-all group relative overflow-hidden">
    <div className="shine-overlay group-hover:block hidden" />
    <div className="flex justify-between items-start mb-4">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      {icon}
    </div>
    <p className={`text-2xl font-black ${color} tracking-tight`}>{value}</p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user, settings }) => {
  const trades = useMemo(() => db.getTrades(user.id), [user.id]);
  const psychLogs = useMemo(() => db.getPsychology(user.id), [user.id]);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showCelebration, setShowCelebration] = useState(false);
  
  const analytics = useMemo(() => {
    const sorted = [...trades].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const initialBal = user.startingBalance || 10000;
    
    let currentEquity = initialBal;
    let maxEquity = initialBal;
    let maxDDValue = 0;
    const equityCurve: any[] = [{ name: 'Start', equity: initialBal }];
    
    sorted.forEach((t, idx) => {
      currentEquity += t.profitLoss;
      equityCurve.push({ name: `T${idx + 1}`, equity: currentEquity });
      if (currentEquity > maxEquity) maxEquity = currentEquity;
      const dd = maxEquity - currentEquity;
      if (dd > maxDDValue) maxDDValue = dd;
    });

    const currentDDPct = ( (maxEquity - currentEquity) / maxEquity) * 100;
    const totalPL = currentEquity - initialBal;
    const totalPLPct = (totalPL / initialBal) * 100;
    const wins = trades.filter(t => t.profitLoss > 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const disciplineScore = trades.length > 0 ? (trades.filter(t => t.rulesFollowed).length / trades.length) * 100 : 100;

    return { totalPL, totalPLPct, currentDDPct, winRate, disciplineScore, equityCurve, currentEquity };
  }, [trades, user.startingBalance]);

  const levelName = useMemo(() => {
    const levels = ['Beginner', 'Apprentice', 'Skilled', 'Professional', 'Elite', 'Master', 'Legend'];
    return levels[Math.min(user.level - 1, levels.length - 1)];
  }, [user.level]);

  useEffect(() => {
    if (analytics.totalPLPct > 0 && trades.length > 0) {
      const lastTrade = trades[trades.length - 1];
      const today = new Date().toISOString().split('T')[0];
      if (lastTrade.date === today && lastTrade.profitLoss > 0 && !sessionStorage.getItem('celebrated_today')) {
        setShowCelebration(true);
        sessionStorage.setItem('celebrated_today', 'true');
      }
    }
  }, [analytics.totalPLPct, trades]);

  return (
    <div className="space-y-10 page-transition pb-20">
      <Confetti active={showCelebration} />
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="animate-in slide-in-from-left duration-700">
          <div className="flex items-center space-x-3 mb-2">
            <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">{levelName}</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('level')} {user.level}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">{user.name.split(' ')[0]}'s</span>
            <PremiumTitle as="h1" className="text-5xl" withParallax={true}>
              {t('terminal')}
            </PremiumTitle>
          </div>
          <p className="text-slate-500 mt-2 font-medium">{t('monitoring')}</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <button 
            onClick={() => navigate('/report')}
            className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-4 rounded-[28px] text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span>{t('exportJournal')}</span>
          </button>
          
          <div className="bg-slate-900/40 border border-slate-800/40 px-6 py-4 rounded-[28px] backdrop-blur-xl border-orange-500/20 flex items-center space-x-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{t('consistencyStreak')}</span>
            <StreakFlame count={user.streakCount || 0} size="md" />
          </div>
          <div className="bg-slate-900/40 border border-slate-800/40 px-8 py-4 rounded-[28px] backdrop-blur-xl animate-glow-blue">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{t('availableCapital')}</span>
            <p className="text-2xl font-black text-white">${analytics.currentEquity.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-10">
          {settings.coachEnabled && (
            <MotivationalCoach user={user} trades={trades} streak={user.streakCount || 0} analytics={analytics} />
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <MetricCard label={t('netPL')} value={`$${analytics.totalPL.toLocaleString()}`} color={analytics.totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
            <MetricCard label={t('returnPct')} value={`${analytics.totalPLPct.toFixed(2)}%`} color={analytics.totalPLPct >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
            <MetricCard label={t('accuracy')} value={`${analytics.winRate.toFixed(1)}%`} color="text-indigo-400" />
            <MetricCard label={t('discipline')} value={`${analytics.disciplineScore.toFixed(0)}%`} color="text-blue-400" />
            <MetricCard label={t('logs')} value={trades.length} color="text-white" />
          </div>

          <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[40px] backdrop-blur-md flex flex-col h-[400px] group transition-all">
            <div className="flex items-center justify-between mb-6">
              <PremiumTitle as="h3" className="text-xl" variant={analytics.totalPL >= 0 ? 'profit' : 'loss'} withParallax={false}>
                {t('growthPath')}
              </PremiumTitle>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Equity Trajectory</span>
            </div>
            <div className="flex-1 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.equityCurve}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={analytics.totalPL >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={analytics.totalPL >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.2} />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0B0B', border: '1px solid #1e293b', borderRadius: '16px' }}
                    itemStyle={{ color: analytics.totalPL >= 0 ? '#10b981' : '#f43f5e', fontWeight: '900', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="equity" stroke={analytics.totalPL >= 0 ? '#10b981' : '#f43f5e'} strokeWidth={4} fill="url(#equityGrad)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <DailyChecklist userId={user.id} />
          <PsychCoach trades={trades} psychEntries={psychLogs} />
          
          <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[40px] backdrop-blur-md text-center group overflow-hidden relative">
            <div className="shine-overlay group-hover:block hidden" />
            <PremiumTitle as="h4" variant="neutral" className="text-[10px] font-black uppercase tracking-widest mb-4" withParallax={false} withShine={false} withGlow={false}>
              {t('progression')}
            </PremiumTitle>
            <div className="w-24 h-24 rounded-full border-4 border-blue-600/30 bg-black/40 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-2xl shadow-blue-500/20">
              <span className="text-4xl font-black text-white">{user.level}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] font-black uppercase text-slate-500">
                <span>XP: {user.xp}</span>
                <span>Next: {(user.level) * 1000}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(user.xp % 1000) / 10}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
