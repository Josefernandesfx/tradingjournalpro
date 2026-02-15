
import React, { useMemo } from 'react';
import { User, Trade } from '../types';
import { useTranslation } from '../i18nContext';
import PremiumTitle from './PremiumTitle';

interface MotivationalCoachProps {
  user: User;
  trades: Trade[];
  streak: number;
  analytics: any;
}

const MotivationalCoach: React.FC<MotivationalCoachProps> = ({ user, trades, streak, analytics }) => {
  const { t } = useTranslation();
  
  const coachData = useMemo(() => {
    const hour = new Date().getHours();
    let greeting = t('coachGreetingMorning');
    if (hour >= 12 && hour < 18) greeting = t('coachGreetingAfternoon');
    if (hour >= 18) greeting = t('coachGreetingEvening');

    let mainMessage = t('coachReady');
    let subMessage = t('coachConsistency');
    let type: 'info' | 'success' | 'warning' | 'streak' = 'info';

    const sortedTrades = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => t.date === today);
    const todayPL = todayTrades.reduce((s, t) => s + t.profitLoss, 0);

    if (streak > 0 && [3, 7, 14, 30].includes(streak)) {
      mainMessage = t('coachStreakMsg');
      subMessage = t('coachStreakSub');
      type = 'streak';
    }
    else if (analytics.currentDDPct > 5) {
      mainMessage = t('coachDDMsg');
      subMessage = t('coachDDSub');
      type = 'warning';
    }
    else if (todayPL > 0) {
      mainMessage = t('coachProfitMsg');
      subMessage = `+$${todayPL.toLocaleString()}. ${t('coachReady')}`;
      type = 'success';
    }
    else if (sortedTrades.length >= 3 && sortedTrades.slice(0, 3).every(t => t.profitLoss > 0)) {
      mainMessage = t('coachWinStreakMsg');
      type = 'success';
    }
    else if (sortedTrades.length >= 3 && sortedTrades.slice(0, 3).every(t => t.profitLoss < 0)) {
      mainMessage = t('coachLossStreakMsg');
      type = 'warning';
    }
    else if (trades.length > 10 && analytics.winRate > 50) {
      mainMessage = t('coachWinRateMsg');
      type = 'info';
    }

    return { greeting, mainMessage, subMessage, type };
  }, [trades, streak, analytics, t]);

  const bgColors = {
    info: 'from-blue-600/20 to-indigo-600/20 border-blue-500/30',
    success: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/30',
    warning: 'from-rose-600/20 to-orange-600/20 border-rose-500/30',
    streak: 'from-amber-600/20 to-yellow-600/20 border-amber-500/30'
  };

  const icons = {
    info: <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    success: <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    warning: <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    streak: <svg className="w-8 h-8 text-amber-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
  };

  const getVariant = () => {
    if (coachData.type === 'success') return 'profit';
    if (coachData.type === 'warning') return 'loss';
    return 'primary';
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${bgColors[coachData.type]} border p-8 rounded-[40px] backdrop-blur-md animate-in slide-in-from-top-4 duration-1000 group`}>
      <div className="shine-overlay group-hover:block hidden" />
      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
        <div className={`p-4 rounded-3xl bg-black/20 border border-white/5`}>
          {icons[coachData.type]}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">{coachData.greeting}</h3>
          <PremiumTitle as="h2" variant={getVariant()} className="text-2xl" withParallax={false}>
            {coachData.mainMessage}
          </PremiumTitle>
          <p className="text-slate-400 text-sm mt-1 font-medium">{coachData.subMessage}</p>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full border border-white/5">Auto-Coach v1.1</span>
        </div>
      </div>
    </div>
  );
};

export default MotivationalCoach;
