
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { User, Trade } from '../types';
import { db } from '../db';
import { useTranslation } from '../i18nContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, AreaChart, Area } from 'recharts';
import PremiumTitle from '../components/PremiumTitle';

interface PerformanceProps {
  user: User;
}

const SafeChart: React.FC<{ children: React.ReactNode; height: number }> = ({ children, height }) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full overflow-hidden min-w-0 flex flex-col" style={{ height: `${height}px` }}>
      {size.width > 50 && size.height > 50 ? children : (
        <div className="flex items-center justify-center h-full text-slate-600 text-[10px] font-black uppercase tracking-widest">
          Analysing Market Edge...
        </div>
      )}
    </div>
  );
};

const Performance: React.FC<PerformanceProps> = ({ user }) => {
  const trades = useMemo(() => db.getTrades(user.id), [user.id]);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'asset' | 'setup' | 'day'>('asset');

  const advancedStats = useMemo(() => {
    if (trades.length === 0) return { avgR: 0, expectancy: 0, profitFactor: 0, winRate: 0, maxDD: 0, ddCurve: [] };
    
    const wins = trades.filter(t => t.profitLoss > 0);
    const losses = trades.filter(t => t.profitLoss < 0);
    const avgWin = wins.reduce((s,t) => s + t.profitLoss, 0) / (wins.length || 1);
    const avgLoss = Math.abs(losses.reduce((s,t) => s + t.profitLoss, 0) / (losses.length || 1));
    const winRate = wins.length / trades.length;
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
    const profitFactor = (wins.reduce((s,t) => s + t.profitLoss, 0)) / (Math.abs(losses.reduce((s,t) => s + t.profitLoss, 0)) || 1);
    const avgR = trades.reduce((s,t) => s + (t.rMultiple || 0), 0) / trades.length;

    // Drawdown Curve
    let peak = user.startingBalance || 10000;
    let balance = peak;
    const ddCurve: any[] = [];
    trades.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach((t, i) => {
      balance += t.profitLoss;
      if (balance > peak) peak = balance;
      const dd = ((peak - balance) / peak) * 100;
      ddCurve.push({ name: `T${i+1}`, dd });
    });

    return { avgR, expectancy, profitFactor, winRate, ddCurve };
  }, [trades, user.startingBalance]);

  const bestWorstSetups = useMemo(() => {
    const groups: Record<string, { pl: number; count: number; wins: number }> = {};
    trades.forEach(t => {
      const name = t.setup || 'Unknown';
      if (!groups[name]) groups[name] = { pl: 0, count: 0, wins: 0 };
      groups[name].pl += t.profitLoss;
      groups[name].count++;
      if (t.profitLoss > 0) groups[name].wins++;
    });

    const list = Object.entries(groups).map(([name, d]) => {
      const wr = d.wins / d.count;
      const exp = (d.pl / d.count);
      return { name, exp, pl: d.pl };
    }).sort((a,b) => b.exp - a.exp);

    return { best: list[0], worst: list[list.length - 1] };
  }, [trades]);

  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    trades.forEach(t => {
      const key = activeTab === 'asset' ? t.asset : activeTab === 'setup' ? t.setup || 'Unknown' : new Date(t.date).toLocaleDateString('en-US', { weekday: 'long' });
      groups[key] = (groups[key] || 0) + t.profitLoss;
    });
    return Object.entries(groups).map(([name, pl]) => ({ name, pl }));
  }, [trades, activeTab]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <PremiumTitle as="h2" className="text-4xl">
          {t('performance')}
        </PremiumTitle>
        <p className="text-slate-500 mt-2 font-medium">Deep analytics of your strategic edge and execution variance.</p>
      </header>

      {/* Advanced Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Expectancy', val: `$${advancedStats.expectancy.toFixed(2)}`, color: 'text-blue-400' },
          { label: 'Profit Factor', val: advancedStats.profitFactor.toFixed(2), color: 'text-indigo-400' },
          { label: 'Average R', val: `${advancedStats.avgR.toFixed(2)}R`, color: 'text-emerald-400' },
          { label: 'Win Rate', val: `${(advancedStats.winRate * 100).toFixed(1)}%`, color: 'text-white' },
          { label: 'Best Setup', val: bestWorstSetups.best?.name || '-', color: 'text-emerald-400' },
          { label: 'Worst Setup', val: bestWorstSetups.worst?.name || '-', color: 'text-rose-400' }
        ].map((m, i) => (
          <div key={i} className="bg-slate-900/40 border border-slate-800/40 p-6 rounded-2xl backdrop-blur-md">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</p>
            <p className={`text-xl font-bold mt-2 truncate ${m.color}`}>{m.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* P/L Distribution Chart */}
        <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <PremiumTitle as="h3" variant="secondary" className="text-xl">
              Performance Distribution
            </PremiumTitle>
            <div className="flex bg-black/40 p-1 rounded-xl">
              {(['asset', 'setup', 'day'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                   {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <SafeChart height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.2} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0B0B', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="pl">
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.pl >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SafeChart>
        </div>

        {/* Drawdown Percentage Curve */}
        <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <PremiumTitle as="h3" variant="loss" className="text-xl">
              Drawdown Curve
            </PremiumTitle>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Equity Variance %</span>
          </div>
          <SafeChart height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={advancedStats.ddCurve}>
                <defs>
                  <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.2} />
                <XAxis dataKey="name" hide />
                <YAxis fontSize={10} axisLine={false} tickLine={false} reversed unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0B0B0B', border: 'none', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="dd" stroke="#f43f5e" strokeWidth={2} fill="url(#ddGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </SafeChart>
        </div>
      </div>
    </div>
  );
};

export default Performance;
