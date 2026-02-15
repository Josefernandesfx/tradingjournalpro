
import React, { useMemo, useState } from 'react';
import { User, Achievement, AchievementCategory, Trade, PsychologyEntry } from '../types';
import { db } from '../db';
import { useTranslation } from '../i18nContext';
import PremiumTitle from '../components/PremiumTitle';

interface AchievementsProps {
  user: User;
}

const CATEGORIES: AchievementCategory[] = ['Discipline', 'Performance', 'Psychology', 'Consistency', 'Risk'];

const Achievements: React.FC<AchievementsProps> = ({ user }) => {
  const trades = useMemo(() => db.getTrades(user.id), [user.id]);
  const psychLogs = useMemo(() => db.getPsychology(user.id), [user.id]);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'All'>('All');
  const { t } = useTranslation();

  const achievements = useMemo(() => {
    const list: Achievement[] = [];
    const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const winCount = trades.filter(t => t.profitLoss > 0).length;
    const ruleFollowCount = trades.filter(t => t.rulesFollowed).length;
    const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;
    const initialCap = user.startingBalance || 10000;
    const growth = (totalPL / initialCap) * 100;
    const maxR = Math.max(...trades.map(t => t.rMultiple || 0), 0);

    // Helper to add series
    const addSeries = (cat: AchievementCategory, baseId: string, title: string, desc: string, milestones: number[], icon: string, source: number, xpMult = 10) => {
      milestones.forEach(m => {
        list.push({
          id: `${baseId}-${m}`,
          title: `${title} ${m}`,
          description: desc.replace('{n}', m.toString()),
          category: cat,
          unlocked: source >= m,
          progress: source,
          maxProgress: m,
          xpReward: m * xpMult,
          icon
        });
      });
    };

    // 1. PERFORMANCE (20+)
    addSeries('Performance', 'grow', 'Account Growth %', '{n}% total account growth achieved.', [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 200, 500], '🚀', growth, 50);
    addSeries('Performance', 'totalwin', 'Winning Hand', 'Achieve {n} profitable trades.', [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 300, 500], '💰', winCount, 15);
    addSeries('Performance', 'profit_val', 'Profit Tier ($)', 'Achieve ${n} total realized profit.', [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000], '💎', totalPL, 1);

    // 2. DISCIPLINE (20+)
    addSeries('Discipline', 'rules', 'Code Keeper', 'Log {n} trades that strictly followed your rules.', [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 300, 500], '🛡️', ruleFollowCount, 20);
    addSeries('Discipline', 'compliance', 'Execution Accuracy', 'Maintain a {n}% rule compliance rate.', [50, 60, 70, 80, 90, 95, 100], '🎯', (ruleFollowCount / (trades.length || 1)) * 100, 100);
    addSeries('Discipline', 'zero_fail', 'Flawless Days', 'Log {n} trades in a row with zero rule violations.', [3, 5, 7, 10, 15, 20], '⚔️', ruleFollowCount, 50);

    // 3. PSYCHOLOGY (20+)
    addSeries('Psychology', 'psych', 'Self Explorer', 'Complete {n} psychological audit entries.', [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200], '🧘', psychLogs.length, 25);
    addSeries('Psychology', 'zen', 'Zen Pulse', 'Log {n} sessions with "Calm" dominant emotion.', [1, 3, 5, 10, 20, 30, 50, 100], '😌', psychLogs.filter(p => p.emotions.includes('calm')).length, 40);
    addSeries('Psychology', 'fomo_hunter', 'FOMO Conqueror', 'Identify and log {n} FOMO sessions to reduce bias.', [1, 5, 10, 25, 50], '🐭', psychLogs.filter(p => p.emotions.includes('fomo')).length, 30);

    // 4. CONSISTENCY (20+)
    addSeries('Consistency', 'streak', 'Unstoppable', 'Reach a daily logging streak of {n} days.', [1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30, 45, 60, 90, 120, 150, 180, 365], '🔥', user.streakCount || 0, 100);
    addSeries('Consistency', 'totaldays', 'Market Veteran', 'Be active in the market for {n} logged days.', [5, 10, 30, 50, 100, 150, 200, 300, 500], '📅', new Set(trades.map(t => t.date)).size, 20);

    // 5. RISK (20+)
    addSeries('Risk', 'slusage', 'Safe Hands', 'Log {n} trades with a protective stop loss.', [1, 5, 10, 25, 50, 100, 200, 300, 500], '🛑', trades.filter(t => (t.stopLoss || 0) > 0).length, 15);
    addSeries('Risk', 'rmult', 'Efficiency Milestone', 'Achieve a trade with at least {n}R profit.', [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20], '📈', maxR, 200);

    return list;
  }, [trades, psychLogs, user]);

  const filtered = useMemo(() => {
    return achievements.filter(a => activeCategory === 'All' || a.category === activeCategory);
  }, [achievements, activeCategory]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-12 page-transition pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <PremiumTitle as="h1" className="text-5xl" variant="secondary">
            Hall of Fame
          </PremiumTitle>
          <p className="text-slate-500 mt-2 font-medium">Quantifying your evolution through {achievements.length} strategic milestones.</p>
        </div>
        <div className="bg-slate-900/60 p-2 rounded-2xl border border-slate-800 flex overflow-x-auto max-w-full custom-scrollbar">
          <button onClick={() => setActiveCategory('All')} className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeCategory === 'All' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}>All</button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}>
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(a => (
              <div key={a.id} className={`group relative p-6 rounded-[32px] border-2 transition-all duration-500 flex flex-col justify-between h-64 ${
                a.unlocked 
                ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 shadow-2xl scale-100' 
                : 'bg-slate-900/20 border-slate-800 opacity-60'
              }`}>
                <div className="flex justify-between items-start">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xl transition-transform duration-500 group-hover:scale-110 ${a.unlocked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-float' : 'bg-slate-800 text-slate-600'}`}>
                     {a.unlocked ? a.icon : '🔒'}
                   </div>
                   {a.unlocked && <span className="bg-amber-500 text-black text-[8px] font-black uppercase px-2 py-1 rounded-lg tracking-widest animate-pulse">Unlocked</span>}
                </div>
                <div>
                   <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors leading-tight">{a.title}</h3>
                   <p className="text-[11px] text-slate-400 font-bold mt-1 line-clamp-2">{a.description}</p>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
                     <span>{a.unlocked ? 'Complete' : 'Progress'}</span>
                     <span>{Math.floor(a.progress)} / {a.maxProgress}</span>
                   </div>
                   <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${a.unlocked ? 'bg-amber-500' : 'bg-slate-700'}`} 
                        style={{ width: `${Math.min(100, (a.progress / a.maxProgress) * 100)}%` }}
                      />
                   </div>
                   <p className="text-[9px] text-amber-500/60 font-black">Reward: +{a.xpReward} XP</p>
                </div>
              </div>
            ))}
         </div>

         <div className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[40px] backdrop-blur-md text-center group">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Medals Collected</h4>
                <p className="text-6xl font-black text-amber-400 tracking-tighter group-hover:scale-110 transition-transform">{unlockedCount}</p>
                <p className="text-xs font-bold text-slate-600 uppercase mt-4">Out of {achievements.length} available</p>
                <div className="mt-8 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(unlockedCount / achievements.length) * 100}%` }} />
                </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[40px] backdrop-blur-md">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 text-center">Rank Progress</h4>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black text-white shadow-xl shadow-blue-500/20">{user.level}</div>
                  <div className="flex-1 px-4">
                    <p className="text-sm font-black text-white">Level {user.level}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Next: {(user.level) * 1000} XP</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(user.xp % 1000) / 10}%` }} />
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Achievements;
