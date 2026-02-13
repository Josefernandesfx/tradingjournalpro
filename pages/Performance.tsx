
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { User, Trade } from '../types';
import { db } from '../db';
import { useTranslation } from '../i18nContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

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
          Parsing Logic...
        </div>
      )}
    </div>
  );
};

const Performance: React.FC<PerformanceProps> = ({ user }) => {
  const trades = useMemo(() => db.getTrades(user.id), [user.id]);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'asset' | 'setup' | 'day'>('asset');

  const stats = useMemo(() => {
    if (trades.length === 0) return { 
      avgWin: 0, 
      avgLoss: 0, 
      profitFactor: '0', 
      expectancy: '0', 
      totalTrades: 0, 
      winCount: 0, 
      lossCount: 0, 
      ruleAdherence: 0 
    };

    const wins = trades.filter(t => t.profitLoss > 0);
    const losses = trades.filter(t => t.profitLoss < 0);
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.profitLoss, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.profitLoss, 0) / losses.length) : 0;
    
    const grossProfit = wins.reduce((s, t) => s + t.profitLoss, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.profitLoss, 0));
    const profitFactor = (grossProfit / (grossLoss || 1)).toFixed(2);
    
    const winRate = wins.length / trades.length;
    const expectancy = (winRate * avgWin - (1 - winRate) * avgLoss).toFixed(2);

    const followedCount = trades.filter(t => t.rulesFollowed).length;
    const ruleAdherence = (followedCount / trades.length) * 100;

    return { avgWin, avgLoss, profitFactor, expectancy, totalTrades: trades.length, winCount: wins.length, lossCount: losses.length, ruleAdherence };
  }, [trades]);

  const assetData = useMemo(() => {
    const groups: Record<string, number> = {};
    trades.forEach(t => {
      groups[t.asset] = (groups[t.asset] || 0) + t.profitLoss;
    });
    return Object.entries(groups).map(([name, pl]) => ({ name, pl }));
  }, [trades]);

  const setupData = useMemo(() => {
    const groups: Record<string, number> = {};
    trades.forEach(t => {
      groups[t.setup || 'Unknown'] = (groups[t.setup || 'Unknown'] || 0) + t.profitLoss;
    });
    return Object.entries(groups).map(([name, pl]) => ({ name, pl }));
  }, [trades]);

  const dayData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const groups: Record<string, number> = {};
    trades.forEach(t => {
      const day = days[new Date(t.date).getDay()];
      groups[day] = (groups[day] || 0) + t.profitLoss;
    });
    return days.map(name => ({ name, pl: groups[name] || 0 }));
  }, [trades]);

  const ruleEdgeData = useMemo(() => {
    const followed = trades.filter(t => t.rulesFollowed);
    const broken = trades.filter(t => !t.rulesFollowed);
    
    const avgFollowed = followed.length > 0 ? followed.reduce((s, t) => s + t.profitLoss, 0) / followed.length : 0;
    const avgBroken = broken.length > 0 ? broken.reduce((s, t) => s + t.profitLoss, 0) / broken.length : 0;

    return [
      { name: t('rulesFollowed'), pl: avgFollowed },
      { name: t('rulesBroken'), pl: avgBroken }
    ];
  }, [trades, t]);

  const chartData = activeTab === 'asset' ? assetData : activeTab === 'setup' ? setupData : dayData;

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-slate-900/40 rounded-full flex items-center justify-center text-slate-400 mb-6 border border-slate-800/40 backdrop-blur-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        </div>
        <h3 className="text-2xl font-bold">No data available</h3>
        <p className="text-slate-500 max-w-sm mt-2">Start logging your trades to unlock institutional-grade performance analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <style>{`
        .recharts-bar-rectangle {
          transition: transform 0.25s ease-out;
          transform-origin: center bottom;
        }
        .recharts-bar-rectangle:hover {
          transform: scaleY(1.05) scaleX(1.02);
        }
      `}</style>
      
      <header>
        <h2 className="text-4xl font-black">{t('performance')}</h2>
        <p className="text-slate-500 mt-2">Deep dive into your statistical edge and behavioral discipline.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: t('profitFactor'), val: stats.profitFactor, color: 'text-blue-400' },
          { label: t('expectancy'), val: `$${stats.expectancy}`, color: 'text-indigo-400' },
          { label: t('avgWin'), val: `$${stats.avgWin.toFixed(0)}`, color: 'text-emerald-400' },
          { label: t('avgLoss'), val: `$${stats.avgLoss.toFixed(0)}`, color: 'text-rose-400' },
          { label: t('winRate'), val: `${((stats.winCount / (stats.totalTrades || 1)) * 100).toFixed(1)}%`, color: 'text-white' },
          { label: t('ruleCompliance'), val: `${stats.ruleAdherence.toFixed(1)}%`, color: 'text-emerald-400' }
        ].map((m, i) => (
          <div key={i} className="bg-slate-900/40 border border-slate-800/40 p-6 rounded-2xl backdrop-blur-md flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</p>
            <p className={`text-xl font-bold mt-2 ${m.color}`}>{m.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">{t(`by${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` as any)}</h3>
            <div className="flex bg-black/40 p-1 rounded-xl">
              {(['asset', 'setup', 'day'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {t(`by${tab.charAt(0).toUpperCase() + tab.slice(1)}` as any)}
                </button>
              ))}
            </div>
          </div>

          <SafeChart height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Bar dataKey="pl" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pl >= 0 ? '#34d399' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SafeChart>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">{t('impactOnPL')}</h3>
              <p className="text-xs text-slate-500">Comparing Average Profit based on discipline.</p>
            </div>
          </div>

          <SafeChart height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ruleEdgeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Bar dataKey="pl" radius={[4, 4, 0, 0]}>
                  <Cell fill="#60a5fa" />
                  <Cell fill="#f43f5e" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SafeChart>
        </div>
      </div>
    </div>
  );
};

export default Performance;
