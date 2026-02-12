
import React, { useMemo, useState } from 'react';
import { User, Trade, PsychologyEntry } from '../types';
import { db } from '../db';

interface CalendarProps {
  user: User;
}

interface DayData {
  day: number;
  date: string;
  trades: Trade[];
  psychology: PsychologyEntry | undefined;
  pl: number;
}

const Calendar: React.FC<CalendarProps> = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<{ weekNum: number, days: DayData[] } | null>(null);

  const trades = useMemo(() => db.getTrades(user.id), [user.id]);
  const psychology = useMemo(() => db.getPsychology(user.id), [user.id]);

  const monthInfo = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (DayData | null)[] = [];
    // Fill empty start
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Fill actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayTrades = trades.filter(t => t.date === dateStr);
      const dayPsych = psychology.find(p => p.date === dateStr);
      const dailyPL = dayTrades.reduce((sum, t) => sum + t.profitLoss, 0);
      days.push({ 
        day: i, 
        date: dateStr, 
        trades: dayTrades, 
        psychology: dayPsych,
        pl: dailyPL 
      });
    }

    // Split into weeks
    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];
    days.forEach((day, index) => {
      if (day) currentWeek.push(day);
      if ((index + 1) % 7 === 0 || index === days.length - 1) {
        if (currentWeek.length > 0) weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return { days, weeks };
  }, [currentDate, trades, psychology]);

  const stats = useMemo(() => {
    const monthDays = monthInfo.days.filter((d): d is DayData => d !== null);
    const monthPL = monthDays.reduce((sum, d) => sum + d.pl, 0);
    const totalTrades = monthDays.reduce((sum, d) => sum + d.trades.length, 0);
    const tradingDays = monthDays.filter(d => d.trades.length > 0).length;
    const profitableDays = monthDays.filter(d => d.pl > 0).length;
    
    return { monthPL, totalTrades, tradingDays, profitableDays };
  }, [monthInfo]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const getRuleComplianceIcon = (day: DayData) => {
    if (day.trades.length === 0) return null;
    const followedCount = day.trades.filter(t => t.rulesFollowed).length;
    const ratio = followedCount / day.trades.length;
    
    if (ratio === 1) return <span className="text-emerald-500" title="100% Rule Compliance">●</span>;
    if (ratio >= 0.5) return <span className="text-amber-500" title="Partial Rule Compliance">●</span>;
    return <span className="text-red-500" title="Low Rule Compliance">●</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Calendar</h2>
          <p className="text-slate-500 dark:text-slate-400">Monthly and Weekly performance visualization.</p>
        </div>
        <div className="flex items-center space-x-4 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="text-lg font-bold text-slate-900 dark:text-white min-w-[140px] text-center">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </header>

      {/* Month Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase">Month P&L</p>
          <p className={`text-xl font-bold ${stats.monthPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            ${stats.monthPL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Trades</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalTrades}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase">Trading Days</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.tradingDays}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase">Profitable Days</p>
          <p className="text-xl font-bold text-emerald-500">{stats.profitableDays}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[110px] md:auto-rows-[130px]">
          {monthInfo.days.map((day, idx) => (
            <div 
              key={idx} 
              onClick={() => day && setSelectedDay(day)}
              className={`relative p-2 border-r border-b border-slate-100 dark:border-slate-700 last:border-r-0 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:scale-[1.03] hover:shadow-xl hover:z-10 group ${!day ? 'bg-slate-50/30 dark:bg-slate-900/10 pointer-events-none' : ''}`}
            >
              {day && (
                <div className="h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400">{day.day}</span>
                    <span className="text-[10px]">{getRuleComplianceIcon(day)}</span>
                  </div>
                  
                  {day.trades.length > 0 && (
                    <div className="flex flex-col items-center flex-1 justify-center">
                      <div className={`text-sm md:text-base font-bold ${day.pl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {day.pl >= 0 ? '+$' : '-$'}{Math.abs(day.pl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.trades.length} Trades
                      </div>
                    </div>
                  )}

                  {day.trades.length > 0 && (
                    <div className={`h-1 w-full rounded-full ${day.pl >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly View Blocks */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Weekly Summaries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthInfo.weeks.map((week, idx) => {
            const weekPL = week.reduce((sum, d) => sum + d.pl, 0);
            const weekTrades = week.reduce((sum, d) => sum + d.trades.length, 0);
            const firstDate = week[0].date;
            const lastDate = week[week.length - 1].date;

            return (
              <div 
                key={idx} 
                onClick={() => setSelectedWeek({ weekNum: idx + 1, days: week })}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:scale-[1.02] transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Week {idx + 1}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{firstDate} to {lastDate}</p>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Net P&L</p>
                    <p className={`text-lg font-bold ${weekPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      ${weekPL.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Trades</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{weekTrades}</p>
                  </div>
                </div>
                <div className={`mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden`}>
                   <div className={`h-full ${weekPL >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: '100%' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Breakdown Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedDay(null)} />
          <div className="relative bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
            <header className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Day Breakdown: {selectedDay.date}</h3>
              <button onClick={() => setSelectedDay(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </header>

            <div className="flex-1 overflow-auto space-y-6 pr-2">
              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Trades ({selectedDay.trades.length})</h4>
                <div className="space-y-2">
                  {selectedDay.trades.length > 0 ? selectedDay.trades.map(t => (
                    <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.side === 'BUY' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{t.side}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{t.asset}</p>
                          <p className="text-xs text-slate-500">{t.setup} • {t.lotSize} lots</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${t.profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          ${t.profitLoss.toLocaleString()}
                        </p>
                        {t.rulesFollowed ? 
                          <span className="text-[10px] text-emerald-500 font-bold">✓ Rules Followed</span> : 
                          <span className="text-[10px] text-red-500 font-bold">✗ Rules Broken</span>
                        }
                      </div>
                    </div>
                  )) : <p className="text-slate-500 italic">No trades logged for this day.</p>}
                </div>
              </section>

              <section>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Psychology</h4>
                {selectedDay.psychology ? (
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex flex-wrap gap-1">
                        {selectedDay.psychology.emotions.map(e => (
                          <span key={e} className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full">#{e}</span>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-indigo-600">Intensity: {selectedDay.psychology.intensity}/10</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">"{selectedDay.psychology.notes}"</p>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No psychology notes recorded.</p>
                )}
              </section>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between">
              <span className="text-sm font-bold text-slate-500">Total Day P&L</span>
              <span className={`text-lg font-bold ${selectedDay.pl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                ${selectedDay.pl.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Week Breakdown Modal */}
      {selectedWeek && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedWeek(null)} />
          <div className="relative bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[80vh] flex flex-col">
            <header className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Week {selectedWeek.weekNum} Breakdown</h3>
              <button onClick={() => setSelectedWeek(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </header>
            <div className="space-y-4 overflow-auto">
              {selectedWeek.days.filter(d => d.trades.length > 0).map(day => (
                <div key={day.date} className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{day.date}</p>
                    <p className="text-xs text-slate-500">{day.trades.length} trades conducted</p>
                  </div>
                  <div className={`font-bold ${day.pl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {day.pl >= 0 ? '+' : ''}{day.pl.toLocaleString()}
                  </div>
                </div>
              ))}
              {selectedWeek.days.filter(d => d.trades.length > 0).length === 0 && (
                 <p className="text-slate-500 text-center py-8 italic">No trades in this week.</p>
              )}
            </div>
            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase">Weekly Total</p>
                 <p className={`text-2xl font-bold ${selectedWeek.days.reduce((s,d) => s + d.pl, 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                   ${selectedWeek.days.reduce((s,d) => s + d.pl, 0).toLocaleString()}
                 </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Win Ratio (Days)</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedWeek.days.filter(d => d.trades.length > 0).length > 0 ?
                    Math.round((selectedWeek.days.filter(d => d.pl > 0).length / selectedWeek.days.filter(d => d.trades.length > 0).length) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
