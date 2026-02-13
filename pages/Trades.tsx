
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Trade, Side, TradingRule } from '../types';
import { db } from '../db';
import { useTranslation } from '../i18nContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface TradesProps {
  user: User;
}

/**
 * SafeChart ensures Recharts only mounts when the container has a valid non-zero size.
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
          <p className="text-[9px] font-black uppercase tracking-[0.2em]">Mapping Data...</p>
        </div>
      )}
    </div>
  );
};

const Trades: React.FC<TradesProps> = ({ user }) => {
  const [trades, setTrades] = useState<Trade[]>(() => db.getTrades(user.id));
  const [rules, setRules] = useState<TradingRule[]>(() => db.getRules(user.id));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const { t } = useTranslation();

  const [formData, setFormData] = useState<Partial<Trade>>({
    date: new Date().toISOString().split('T')[0], 
    asset: '', 
    side: 'BUY', 
    lotSize: 0.01, 
    profitLoss: 0, 
    setup: '', 
    notes: '', 
    rulesFollowed: true
  });

  useEffect(() => {
    setRules(db.getRules(user.id));
    setTrades(db.getTrades(user.id));
  }, [user.id]);

  const handleOpenModal = (trade?: Trade) => {
    if (trade) {
      setEditingTrade(trade);
      setFormData(trade);
    } else {
      setEditingTrade(null);
      setFormData({ date: new Date().toISOString().split('T')[0], asset: '', side: 'BUY', lotSize: 0.01, profitLoss: 0, setup: '', notes: '', rulesFollowed: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrade: Trade = { ...formData as Trade, id: editingTrade?.id || crypto.randomUUID(), userId: user.id };
    db.saveTrade(newTrade);
    setTrades(db.getTrades(user.id));
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('confirmDelete'))) {
      db.deleteTrade(id);
      setTrades(db.getTrades(user.id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBulkDelete = () => {
    if (confirm(t('confirmDelete'))) {
      selectedIds.forEach(id => db.deleteTrade(id));
      setTrades(db.getTrades(user.id));
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === trades.length && trades.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(trades.map(t => t.id)));
  };

  const pieData = useMemo(() => {
    const profitable = trades.filter(t => t.profitLoss > 0).length;
    const losing = trades.filter(t => t.profitLoss <= 0).length;
    // We use small values instead of 0 to keep the Pie consistent in Recharts
    return [
      { name: t('profitable'), value: profitable || 0.0001 },
      { name: t('losing'), value: losing || 0.0001 }
    ];
  }, [trades, t]);

  const assetMetrics = useMemo(() => {
    const metrics: Record<string, { count: number; wins: number; pl: number }> = {};
    trades.forEach(t => {
      const asset = t.asset.toUpperCase();
      if (!metrics[asset]) metrics[asset] = { count: 0, wins: 0, pl: 0 };
      metrics[asset].count += 1;
      metrics[asset].pl += t.profitLoss;
      if (t.profitLoss > 0) metrics[asset].wins += 1;
    });
    return Object.entries(metrics).map(([name, data]) => ({
      name,
      ...data,
      winRate: (data.wins / data.count) * 100
    })).sort((a, b) => b.pl - a.pl);
  }, [trades]);

  const COLORS = ['#10b981', '#ef4444'];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const displayValue = value > 0.01 ? value : 0;
    if (displayValue === 0) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central" 
        className="text-lg font-black"
        style={{ pointerEvents: 'none' }}
      >
        {displayValue}
      </text>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-100">{t('trades')}</h2>
          <p className="text-slate-500">Dataset of your market executions and performance distribution.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 flex items-center space-x-2 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          <span>{t('addTrade')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/40 rounded-[32px] backdrop-blur-md overflow-hidden h-fit min-w-0 flex flex-col">
          {selectedIds.size > 0 && (
            <div className="bg-blue-600/10 border-b border-blue-500/20 p-4 px-10 flex items-center justify-between backdrop-blur-md">
              <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{selectedIds.size} Selected Records</span>
              <button onClick={handleBulkDelete} className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20">
                Purge Data
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/20 border-b border-slate-800/50">
                <tr>
                  <th className="px-10 py-6">
                    <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-700 accent-blue-600" checked={selectedIds.size === trades.length && trades.length > 0} onChange={toggleSelectAll} />
                  </th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Date</th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('asset')}</th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('pl')}</th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('rules')}</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {trades.map(trade => (
                  <tr key={trade.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-10 py-6">
                      <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-700 accent-blue-600" checked={selectedIds.has(trade.id)} onChange={() => toggleSelect(trade.id)} />
                    </td>
                    <td className="px-4 py-6 text-sm font-bold text-slate-400">{trade.date}</td>
                    <td className="px-4 py-6">
                      <div className="flex items-center space-x-3">
                         <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${trade.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>{trade.side}</span>
                         <span className="text-sm font-black text-white">{trade.asset}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-6 text-sm font-black ${trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.profitLoss >= 0 ? '+' : '-'}${Math.abs(trade.profitLoss).toLocaleString()}
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${trade.rulesFollowed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{trade.rulesFollowed ? 'Disciplined' : 'Violated'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end space-x-3">
                        <button onClick={() => handleOpenModal(trade)} className="text-slate-500 hover:text-blue-400 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button onClick={() => handleDelete(trade.id)} className="text-slate-500 hover:text-rose-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trades.length === 0 && (
              <div className="p-32 text-center">
                <div className="w-20 h-20 bg-slate-800/40 rounded-full flex items-center justify-center text-slate-600 mx-auto mb-6 border border-slate-700/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Log your first trade to activate terminal analytics.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8 min-w-0 flex flex-col">
          {/* Pie Chart Card - Fixed Height 260px */}
          <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[32px] backdrop-blur-md relative overflow-hidden min-w-0 flex flex-col h-[380px]">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">{t('profitDistribution')}</h3>
            <div className="flex-1">
              <SafeChart height={260} minHeight={220}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      cx="50%" 
                      cy="45%" 
                      innerRadius={75} 
                      outerRadius={105} 
                      paddingAngle={10} 
                      dataKey="value" 
                      stroke="none"
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom" 
                      align="center" 
                      iconType="circle" 
                      wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </SafeChart>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[32px] backdrop-blur-md min-w-0">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">Edge by Asset Pair</h3>
            <div className="space-y-5 max-h-[450px] overflow-auto pr-3 custom-scrollbar">
              {assetMetrics.map(m => (
                <div key={m.name} className="bg-black/30 p-5 rounded-3xl border border-slate-800/50 hover:border-slate-700/50 transition-colors group">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-black text-white group-hover:text-blue-400 transition-colors tracking-tight">{m.name}</span>
                    <span className={`text-sm font-black ${m.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.pl >= 0 ? '+' : '-'}${Math.abs(m.pl).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>{m.count} Executions</span>
                    <span className={m.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500'}>
                      {m.winRate.toFixed(1)}% Win Rate
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${m.winRate >= 50 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`} 
                      style={{ width: `${m.winRate}%` }}
                    />
                  </div>
                </div>
              ))}
              {assetMetrics.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-widest">Awaiting execution data...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#04070F]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800/50 w-full max-w-xl rounded-[40px] shadow-2xl p-10 overflow-hidden max-h-[95vh] flex flex-col">
            <h3 className="text-3xl font-black mb-8 text-white">{editingTrade ? 'Update Execution' : 'Log New Execution'}</h3>
            <form onSubmit={handleSave} className="space-y-6 overflow-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry Date</label>
                   <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors text-white font-bold" />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Pair</label>
                   <input type="text" placeholder="e.g. XAUUSD" value={formData.asset} onChange={e => setFormData({ ...formData, asset: e.target.value.toUpperCase() })} className="w-full bg-black/40 border border-slate-800 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors text-white font-bold placeholder:text-slate-700" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Side</label>
                  <select value={formData.side} onChange={e => setFormData({ ...formData, side: e.target.value as Side })} className="w-full bg-black/40 border border-slate-800 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors text-white font-bold appearance-none">
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Volume (Lots)</label>
                  <input type="number" step="0.01" value={formData.lotSize} onChange={e => setFormData({ ...formData, lotSize: parseFloat(e.target.value) })} className="w-full bg-black/40 border border-slate-800 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors text-white font-bold" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Realized P/L ($)</label>
                <input type="number" value={formData.profitLoss} onChange={e => setFormData({ ...formData, profitLoss: parseFloat(e.target.value) })} className="w-full bg-black/40 border border-slate-800 rounded-3xl p-6 outline-none focus:border-blue-500 transition-colors font-black text-3xl text-blue-400 text-center" />
              </div>

              <div className="bg-black/40 p-6 rounded-3xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Behavioral Audit</label>
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, rulesFollowed: !formData.rulesFollowed })}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${formData.rulesFollowed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}
                  >
                    {formData.rulesFollowed ? 'Rules Followed' : 'Rules Violated'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-medium italic">Did this execution align with your pre-defined trading plan and risk parameters?</p>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 transition-all">Commit Execution</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default Trades;
