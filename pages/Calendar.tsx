
import React, { useMemo, useState } from 'react';
import { User, Trade, PsychologyEntry } from '../types';
import { db } from '../db';
import { useTranslation } from '../i18nContext';
import PremiumTitle from '../components/PremiumTitle';

interface CalendarProps {
  user: User;
}

interface DayData {
  day: number;
  date: string;
  trades: Trade[];
  psychology: PsychologyEntry | undefined;
  pl: number;
  hasWarnings: boolean;
  warnings: string[];
}

interface WeekSummary {
  weekNum: number;
  startDate: string;
  endDate: string;
  totalPL: number;
  totalTrades: number;
}

const Calendar: React.FC<CalendarProps> = ({ user }) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const trades = useMemo(() => db.getTrades(user.id), [user.id]);
  const psychology = useMemo(() => db.getPsychology(user.id), [user.id]);

  const monthInfo = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (DayData | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayTrades = trades.filter(t => t.date === dateStr);
      const dayPsych = psychology.find(p => p.date === dateStr);
      const dailyPL = dayTrades.reduce((sum, t) => sum + t.profitLoss, 0);
      
      const dayWarnings: string[] = [];
      dayTrades.forEach(t => t.autoFlags?.forEach(f => { if(!dayWarnings.includes(f)) dayWarnings.push(f); }));
      if (user.maxTradesPerDay && dayTrades.length > user.maxTradesPerDay) dayWarnings.push('Daily Overtrading');

      days.push({ 
        day: i, 
        date: dateStr, 
        trades: dayTrades, 
        psychology: dayPsych,
        pl: dailyPL,
        hasWarnings: dayWarnings.length > 0,
        warnings: dayWarnings
      });
    }

    // Weekly Summaries Logic
    const summaries: WeekSummary[] = [];
    const weeksCount = Math.ceil(days.length / 7);
    for (let w = 0; w < weeksCount; w++) {
      const weekDays = days.slice(w * 7, (w + 1) * 7);
      const weekTrades = weekDays.flatMap(d => d?.trades || []);
      const weekPL = weekDays.reduce((sum, d) => sum + (d?.pl || 0), 0);
      
      const validDays = weekDays.filter(d => d !== null) as DayData[];
      if (validDays.length > 0) {
        summaries.push({
          weekNum: w + 1,
          startDate: validDays[0].date,
          endDate: validDays[validDays.length - 1].date,
          totalPL: weekPL,
          totalTrades: weekTrades.length
        });
      }
    }

    return { days, summaries };
  }, [currentDate, trades, psychology, user.maxTradesPerDay]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const weekdays = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] space-y-4 page-transition pb-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <PremiumTitle as="h1" className="text-3xl" variant="primary">
            {t('calendarTitle')}
          </PremiumTitle>
          <p className="text-slate-500 text-xs font-medium">{t('chronologicalMap')}</p>
        </div>
        <div className="flex items-center space-x-4 bg-slate-900/40 p-2 rounded-2xl border border-slate-800/40 backdrop-blur-xl">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="text-xs font-black uppercase tracking-widest min-w-[140px] text-center text-white">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6 6-6"/></svg>
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 flex-grow min-h-0">
        {/* Calendar Grid */}
        <div className="flex-grow bg-slate-900/40 rounded-3xl shadow-2xl border border-slate-800/40 overflow-hidden backdrop-blur-xl flex flex-col min-h-0">
          <div className="grid grid-cols-7 flex-shrink-0 bg-black/30">
            {weekdays.map(day => (
              <div key={day} className="py-2 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-800/20 last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-grow min-h-0">
            {monthInfo.days.map((day, idx) => (
              <div 
                key={idx} 
                onClick={() => day && setSelectedDay(day)}
                className={`relative border-r border-b border-slate-800/20 transition-all cursor-pointer group flex flex-col p-1 md:p-2 ${!day ? 'bg-black/5' : 'hover:bg-white/5'}`}
              >
                {day && (
                  <>
                    <div className="flex justify-between items-start mb-auto">
                      <span className="text-[10px] font-black text-slate-500 group-hover:text-white transition-colors">{day.day}</span>
                      <div className="flex gap-1">
                        {day.hasWarnings && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                        {day.trades.length > 0 && <div className={`w-1.5 h-1.5 rounded-full ${day.pl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />}
                      </div>
                    </div>
                    
                    {day.trades.length > 0 && (
                      <div className="text-center pb-1">
                        <p className={`text-[10px] md:text-sm font-black tracking-tighter ${day.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {day.pl >= 0 ? '+' : '-'}${Math.abs(day.pl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <div className="hidden md:flex items-center justify-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{day.trades.length}T</span>
                           <div className={`w-1 h-1 rounded-full ${day.hasWarnings ? 'bg-amber-500' : 'bg-blue-500/40'}`} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Summaries Sidebar */}
        <div className="lg:w-64 flex-shrink-0 space-y-4 overflow-y-auto custom-scrollbar">
          {monthInfo.summaries.map(s => (
            <div key={s.weekNum} className="bg-slate-900/40 border border-slate-800/40 p-4 rounded-3xl backdrop-blur-md">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('week')} {s.weekNum}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase">{s.startDate.split('-').slice(1).join('/')} - {s.endDate.split('-').slice(1).join('/')}</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('totalPL')}</p>
                   <PremiumTitle as="span" className="text-xl" variant={s.totalPL >= 0 ? 'profit' : 'loss'} withParallax={false}>
                     {s.totalPL >= 0 ? '+' : '-'}${Math.abs(s.totalPL).toLocaleString()}
                   </PremiumTitle>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('executions')}</p>
                   <p className="text-sm font-black text-white">{s.totalTrades}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#04070F]/90 backdrop-blur-2xl" onClick={() => setSelectedDay(null)} />
          <div className="relative bg-slate-900 border border-slate-800/50 w-full max-w-2xl rounded-[40px] shadow-2xl p-8 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in slide-in-from-bottom-8">
            <div className="shine-overlay" />
            <header className="flex items-center justify-between mb-8 relative z-10">
               <div>
                 <PremiumTitle as="h3" variant="secondary" className="text-2xl">
                   Audit: {selectedDay.date}
                 </PremiumTitle>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{t('dailySessionLog')}</p>
               </div>
               <button onClick={() => setSelectedDay(null)} className="p-2 bg-slate-800 hover:bg-rose-500 text-white rounded-xl transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
               </button>
            </header>

            <div className="flex-1 overflow-auto space-y-6 pr-2 relative z-10 custom-scrollbar">
              {selectedDay.warnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-3xl">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">{t('behavioralAlerts')}</h4>
                  <ul className="space-y-1">
                    {selectedDay.warnings.map(w => <li key={w} className="text-[11px] text-slate-300 font-bold flex items-center"><span className="w-1 h-1 rounded-full bg-amber-500 mr-2" />{w}</li>)}
                  </ul>
                </div>
              )}

              <section>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{t('history')}</h4>
                <div className="space-y-3">
                  {selectedDay.trades.map(t => (
                    <div key={t.id} className="p-4 bg-black/30 rounded-2xl border border-slate-800/50 flex justify-between items-center group/item hover:bg-black/50 transition-all">
                      <div className="flex items-center space-x-4">
                        <span className={`text-[7px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${t.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{t.side}</span>
                        <div>
                          <p className="text-sm font-black text-white">{t.asset}</p>
                          <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{t.lotSize} Lots • {t.setup || 'Default'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${t.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${t.profitLoss.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-800/50 flex justify-between items-center relative z-10">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('netDaily')}</span>
               <PremiumTitle as="span" className="text-2xl" variant={selectedDay.pl >= 0 ? 'profit' : 'loss'} withParallax={false}>
                 ${selectedDay.pl.toLocaleString()}
               </PremiumTitle>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
