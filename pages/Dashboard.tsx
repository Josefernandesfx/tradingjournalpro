
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { db } from '../db';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from '../i18nContext';

interface DashboardProps {
  user: User;
}

/**
 * SafeChart ensures Recharts only mounts when the container has a valid non-zero size.
 * It uses a ResizeObserver to track actual layout dimensions.
 */
const SafeChart: React.FC<{ children: React.ReactNode; height: number; minHeight?: number }> = ({ children, height, minHeight }) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height: observedHeight } = entry.contentRect;
        // Recharts needs positive dimensions > 0 to avoid -1 warnings.
        // We use a threshold of 50px to ensure the layout has stabilized.
        if (width > 50 && observedHeight > 50) {
          setSize({ width, height: observedHeight });
        } else {
          setSize(null);
        }
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className="w-full min-w-0 overflow-hidden relative" 
      style={{ height: `${height}px`, minHeight: minHeight ? `${minHeight}px` : undefined }}
    >
      {size ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-20">
          <div className="w-8 h-8 rounded-full border-2 border-slate-500 border-t-transparent animate-spin" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em]">Calibrating Graphics...</p>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const trades = useMemo(() => db.getTrades(user.id), [user.id]);
  const { t } = useTranslation();
  
  const stats = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.profitLoss > 0);
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const avgWin = wins.reduce((s,t) => s + t.profitLoss,0) / (wins.length || 1);
    
    const ruleCompliance = trades.filter(t => t.rulesFollowed).length;
    const disciplineScore = totalTrades > 0 ? (ruleCompliance / totalTrades) * 100 : 100;

    return { totalTrades, winRate, totalPL, avgWin, disciplineScore };
  }, [trades]);

  const chartData = useMemo(() => {
    let balance = 0;
    return trades
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((t, idx) => {
        balance += t.profitLoss;
        return { name: `T${idx + 1}`, equity: balance };
      });
  }, [trades]);

  const winRateData = [
    { name: 'Wins', value: stats.winRate || 0.001 },
    { name: 'Losses', value: stats.totalTrades > 0 ? (100 - stats.winRate) : 100 }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight">{t('dashboard')}</h2>
          <p className="text-slate-500 mt-1 font-medium">Monitoring capital efficiency and behavioral edge.</p>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-4 rounded-2xl backdrop-blur-md max-w-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">AI Intelligence</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {t('emotionalImpactAlert')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: t('totalPL'), val: `$${stats.totalPL.toLocaleString()}`, color: stats.totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400' },
          { label: t('winRate'), val: `${stats.winRate.toFixed(1)}%`, color: 'text-indigo-400' },
          { label: t('totalTrades'), val: stats.totalTrades, color: 'text-white' },
          { label: t('avgWin'), val: `$${stats.avgWin.toFixed(0)}`, color: 'text-blue-400' },
          { label: 'Expectancy', val: `$${(stats.totalPL / (stats.totalTrades || 1)).toFixed(2)}`, color: 'text-amber-400' },
          { label: 'Discipline', val: `${stats.disciplineScore.toFixed(0)}%`, color: 'text-emerald-400' }
        ].map((card, idx) => (
          <div key={idx} className="bg-slate-900/40 border border-slate-800/40 p-6 rounded-2xl backdrop-blur-md hover:border-slate-700/60 transition-colors group">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover:text-slate-400 transition-colors">{card.label}</p>
            <p className={`text-2xl font-black ${card.color}`}>
              {card.val}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve Card - Fixed Height 420px */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md min-w-0 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">{t('equityCurve')}</h3>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Growth Analytics</span>
          </div>
          <SafeChart height={420} minHeight={380}>
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0B0B', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={3} fill="url(#equityGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </SafeChart>
        </div>

        <div className="space-y-6 min-w-0 flex flex-col">
          {/* Win Rate Card - Fixed Height 260px */}
          <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md min-w-0 flex flex-col h-[380px]">
            <h3 className="text-lg font-bold mb-4">{t('winRate')}</h3>
            <div className="relative flex-1">
              <SafeChart height={260} minHeight={220}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <PieChart>
                    <Pie data={winRateData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" startAngle={90} endAngle={450}>
                      <Cell fill="#6366f1" stroke="none" />
                      <Cell fill="#1e293b" stroke="none" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </SafeChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black">{stats.winRate.toFixed(0)}%</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Success Rate</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md flex flex-col">
            <h3 className="text-lg font-bold mb-4">{t('disciplineScore')}</h3>
            <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all duration-1000" style={{ width: `${stats.disciplineScore}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-500">Emotional Bias</span>
              <span className="text-emerald-400">Zen Trading</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
