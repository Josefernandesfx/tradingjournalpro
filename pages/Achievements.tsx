
import React, { useMemo, useState } from 'react';
import { User, Achievement, Trade, PsychologyEntry } from '../types';
import { db } from '../db';
import { useTranslation } from '../i18nContext';

interface AchievementsProps {
  user: User;
}

const Achievements: React.FC<AchievementsProps> = ({ user }) => {
  const trades = useMemo(() => db.getTrades(user.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [user.id]);
  const psychLogs = useMemo(() => db.getPsychology(user.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [user.id]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const { t } = useTranslation();

  const achievementsData = useMemo(() => {
    const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const initialCapital = 10000;

    // Rule Streaks
    let currentRuleStreak = 0;
    let maxRuleStreak = 0;
    trades.forEach(t => {
      if (t.rulesFollowed) {
        currentRuleStreak++;
        maxRuleStreak = Math.max(maxRuleStreak, currentRuleStreak);
      } else {
        currentRuleStreak = 0;
      }
    });

    // Profitable Day Streaks
    const dailyPLs: Record<string, number> = {};
    trades.forEach(t => {
      dailyPLs[t.date] = (dailyPLs[t.date] || 0) + t.profitLoss;
    });
    const sortedDates = Object.keys(dailyPLs).sort();
    let currentWinStreak = 0;
    let maxWinStreak = 0;
    sortedDates.forEach(date => {
      if (dailyPLs[date] > 0) {
        currentWinStreak++;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else {
        currentWinStreak = 0;
      }
    });

    // Zen Spirit (Mood Streaks)
    // Counting days where "calm" or "confidence" was selected and intensity was <= 5
    let currentMoodStreak = 0;
    let maxMoodStreak = 0;
    psychLogs.forEach(p => {
      const goodMood = p.emotions.some(e => ['calm', 'confidence', 'discipline'].includes(e)) && p.intensity <= 7;
      if (goodMood) {
        currentMoodStreak++;
        maxMoodStreak = Math.max(maxMoodStreak, currentMoodStreak);
      } else {
        currentMoodStreak = 0;
      }
    });

    const list: Achievement[] = [
      // Rule Medals
      { id: 'rule-5', title: 'Iron Cadet', description: '5-Day Rule Compliance Streak.', unlocked: maxRuleStreak >= 5, progress: maxRuleStreak, maxProgress: 5 },
      { id: 'rule-10', title: 'Code Keeper', description: '10-Day Rule Compliance Streak.', unlocked: maxRuleStreak >= 10, progress: maxRuleStreak, maxProgress: 10 },
      { id: 'rule-15', title: 'Sentinel', description: '15-Day Rule Compliance Streak.', unlocked: maxRuleStreak >= 15, progress: maxRuleStreak, maxProgress: 15 },
      { id: 'rule-20', title: 'Iron Discipline', description: '20-Day Rule Compliance Streak.', unlocked: maxRuleStreak >= 20, progress: maxRuleStreak, maxProgress: 20 },

      // Profit Medals
      { id: 'win-3', title: 'Lucky Clover', description: '3 Consecutive Profitable Days.', unlocked: maxWinStreak >= 3, progress: maxWinStreak, maxProgress: 3 },
      { id: 'win-10', title: 'Trend Rider', description: '10 Consecutive Profitable Days.', unlocked: maxWinStreak >= 10, progress: maxWinStreak, maxProgress: 10 },
      { id: 'win-15', title: 'Market Oracle', description: '15 Consecutive Profitable Days.', unlocked: maxWinStreak >= 15, progress: maxWinStreak, maxProgress: 15 },
      { id: 'win-20', title: 'Green Legend', description: '20 Consecutive Profitable Days.', unlocked: maxWinStreak >= 20, progress: maxWinStreak, maxProgress: 20 },

      // Mood Medals
      { id: 'mood-5', title: 'Steady Breath', description: '5 Consecutive Days of Calm Focus.', unlocked: maxMoodStreak >= 5, progress: maxMoodStreak, maxProgress: 5 },
      { id: 'mood-10', title: 'Mindful Trader', description: '10 Consecutive Days of Calm Focus.', unlocked: maxMoodStreak >= 10, progress: maxMoodStreak, maxProgress: 10 },
      { id: 'mood-15', title: 'Zen Master', description: '15 Consecutive Days of Calm Focus.', unlocked: maxMoodStreak >= 15, progress: maxMoodStreak, maxProgress: 15 },

      // Growth
      { id: 'grow-100', title: 'Double Down', description: 'Profit equal to 100% of capital.', unlocked: totalPL >= initialCapital, progress: Math.max(0, totalPL), maxProgress: initialCapital },
    ];

    return list;
  }, [trades, psychLogs]);

  const filtered = achievementsData.filter(a => {
    if (filter === 'completed') return a.unlocked;
    if (filter === 'incomplete') return !a.unlocked;
    return true;
  });

  const level = user.level || 1;
  const tierInfo = useMemo(() => {
    if (level < 6) return { name: 'Bronze', color: 'text-[#CD7F32]', bg: 'bg-[#CD7F32]/10', border: 'border-[#CD7F32]/30', crown: '🥉' };
    if (level < 11) return { name: 'Silver', color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/30', crown: '🥈' };
    if (level < 16) return { name: 'Gold', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', crown: '🥇' };
    return { name: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', crown: '👑' };
  }, [level]);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      {/* Tier Header */}
      <div className={`p-10 rounded-[40px] border-4 ${tierInfo.border} ${tierInfo.bg} backdrop-blur-xl relative overflow-hidden group`}>
        <div className="absolute top-[-20%] right-[-10%] opacity-10 group-hover:scale-125 transition-transform duration-1000">
           <span className="text-[250px]">{tierInfo.crown}</span>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
           <div className={`w-32 h-32 rounded-full border-4 ${tierInfo.border} bg-black/40 flex items-center justify-center text-6xl shadow-2xl animate-bounce-slow`}>
             {tierInfo.crown}
           </div>
           <div className="text-center md:text-left">
             <h2 className={`text-5xl font-black ${tierInfo.color} uppercase tracking-tighter`}>{tierInfo.name} Tier</h2>
             <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-sm">Level {level} Trader • XP {user.xp || 0}</p>
             <div className="mt-6 w-full max-w-md h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full bg-gradient-to-r ${level < 6 ? 'from-orange-700 to-orange-500' : level < 11 ? 'from-slate-400 to-slate-100' : level < 16 ? 'from-amber-600 to-yellow-300' : 'from-cyan-600 to-blue-300'} transition-all duration-1000`} 
                  style={{ width: `${((user.xp || 0) % 1000) / 10}%` }}
                />
             </div>
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">{1000 - ((user.xp || 0) % 1000)} XP to next level</p>
           </div>
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Challenge Ledger</h2>
          <p className="text-slate-500 font-medium">Earn medals by mastering your habits.</p>
        </div>
        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
          {(['all', 'completed', 'incomplete'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t(f as any)}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map(achievement => {
          const progressPercent = Math.min(100, (achievement.progress / achievement.maxProgress) * 100);
          const isRule = achievement.id.startsWith('rule');
          const isWin = achievement.id.startsWith('win');
          const isMood = achievement.id.startsWith('mood');

          const accentColor = isRule ? 'blue' : isWin ? 'emerald' : isMood ? 'indigo' : 'purple';
          const icon = isRule ? '⚔️' : isWin ? '📈' : isMood ? '🧘' : '💎';

          return (
            <div 
              key={achievement.id} 
              className={`group p-6 rounded-3xl border-2 transition-all duration-500 relative overflow-hidden flex flex-col justify-between h-64 ${
                achievement.unlocked 
                ? `bg-${accentColor}-600/10 border-${accentColor}-600/40 shadow-xl scale-100` 
                : 'bg-slate-900/40 border-slate-800/40 grayscale opacity-60 hover:grayscale-0 hover:scale-[1.02]'
              }`}
            >
              {/* Background Glow */}
              {achievement.unlocked && (
                <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${accentColor}-600/20 rounded-full blur-3xl`} />
              )}
              
              <div>
                <div className="flex items-center justify-between mb-4">
                   <span className="text-3xl">{achievement.unlocked ? (isRule ? '🛡️' : isWin ? '🎖️' : isMood ? '💎' : '🔥') : '🔒'}</span>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${achievement.unlocked ? `text-${accentColor}-400` : 'text-slate-600'}`}>
                     {achievement.unlocked ? 'Achievement Unlocked' : 'Locked'}
                   </span>
                </div>
                <h3 className="text-lg font-black text-white leading-tight">{achievement.title}</h3>
                <p className="text-xs text-slate-400 mt-2 font-medium">{achievement.description}</p>
              </div>

              <div className="mt-auto">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                   <span className="text-slate-500">Progress</span>
                   <span className={`text-${accentColor}-400`}>{Math.floor(achievement.progress)} / {achievement.maxProgress}</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                   <div 
                    className={`h-full bg-${accentColor}-500 shadow-[0_0_10px_rgba(var(--tw-color-${accentColor}-500),0.3)] transition-all duration-1000`} 
                    style={{ width: `${progressPercent}%` }}
                   />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Achievements;
