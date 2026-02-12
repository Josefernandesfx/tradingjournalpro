
import React, { useState, useMemo, useEffect } from 'react';
import { User, Trade, Side, TradingRule } from '../types';
import { db } from '../db';
import { useTranslation } from '../i18nContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface TradesProps {
  user: User;
}

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
    if (selectedIds.size === trades.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(trades.map(t => t.id)));
  };

  const pieData = useMemo(() => {
    const profitable = trades.filter(t => t.profitLoss > 0).length;
    const losing = trades.filter(t => t.profitLoss <= 0).length;
    return [
      { name: t('profitable'), value: profitable },
      { name: t('losing'), value: losing }
    ];
  }, [trades, t]);

  const assetMetrics = useMemo(() => {
    const metrics: Record<string, { count: number; wins: number; pl: number }> = {};
    trades.forEach(t => {
      if (!metrics[t.asset]) metrics[t.asset] = { count: 0, wins: 0, pl: 0 };
      metrics[t.asset].count += 1;
      metrics[t.asset].pl += t.profitLoss;
      if (t.profitLoss > 0) metrics[t.asset].wins += 1;
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
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-black">
        {value}
      </text>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-100">{t('trades')}</h2>
          <p className="text-slate-500">Historical dataset and rule adherence logs.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center space-x-2 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          <span>{t('addTrade')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/40 rounded-3xl backdrop-blur-md overflow-hidden h-fit">
          {selectedIds.size > 0 && (
            <div className="bg-blue-600/10 border-b border-blue-500/20 p-4 px-8 flex items-center justify-between backdrop-blur-md">
              <span className="text-sm font-bold text-blue-400">{selectedIds.size} {t('deleteSelected')}</span>
              <button onClick={handleBulkDelete} className="bg-rose-500/20 text-rose-500 border border-rose-500/30 px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition-all">
                {t('deleteSelected')}
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/50 border-b border-slate-800/40">
                <tr>
                  <th className="px-8 py-5">
                    <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={selectedIds.size === trades.length && trades.length > 0} onChange={toggleSelectAll} />
                  </th>
                  <th className="px-4 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-4 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('asset')}</th>
                  <th className="px-4 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('pl')}</th>
                  <th className="px-4 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('rules')}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {trades.map(trade => (
                  <tr key={trade.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5">
                      <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={selectedIds.has(trade.id)} onChange={() => toggleSelect(trade.id)} />
                    </td>
                    <td className="px-4 py-5 text-sm font-medium text-slate-400">{trade.date}</td>
                    <td className="px-4 py-5">
                      <div className="flex items-center space-x-3">
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trade.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{trade.side}</span>
                         <span className="text-sm font-bold">{trade.asset}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-5 text-sm font-black ${trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.profitLoss >= 0 ? '+' : '-'}${Math.abs(trade.profitLoss).toLocaleString()}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${trade.rulesFollowed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{trade.rulesFollowed ? t('completed') : t('incomplete')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end space-x-3">
                        <button onClick={() => handleOpenModal(trade)} className="text-slate-400 hover:text-blue-400 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button onClick={() => handleDelete(trade.id)} className="text-slate-400 hover:text-rose-400 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trades.length === 0 && (
              <div className="p-20 text-center">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Zero trades found in ledger.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md">
            <h3 className="text-lg font-bold mb-6">{t('profitDistribution')}</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={85} 
                    paddingAngle={8} 
                    dataKey="value" 
                    stroke="none"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-3xl backdrop-blur-md">
            <h3 className="text-lg font-bold mb-6">Asset Performance</h3>
            <div className="space-y-4 max-h-[400px] overflow-auto pr-2 custom-scrollbar">
              {assetMetrics.map(m => (
                <div key={m.name} className="bg-black/20 p-4 rounded-2xl border border-slate-800/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-black text-white">{m.name}</span>
                    <span className={`text-xs font-black ${m.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.pl >= 0 ? '+' : '-'}${Math.abs(m.pl).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>{m.count} Trades</span>
                    <span className={m.winRate >= 50 ? 'text-emerald-500' : 'text-rose-500'}>
                      {m.winRate.toFixed(1)}% Win Rate
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${m.winRate >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                      style={{ width: `${m.winRate}%` }}
                    />
                  </div>
                </div>
              ))}
              {assetMetrics.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No data.</p>}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#04070F]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800/50 w-full max-w-xl rounded-3xl shadow-2xl p-8 overflow-hidden max-h-[95vh] flex flex-col">
            <h3 className="text-2xl font-black mb-6">{editingTrade ? 'Edit Trade Execution' : 'Log New Execution'}</h3>
            <form onSubmit={handleSave} className="space-y-6 overflow-auto pr-2">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry Date</label>
                   <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-black/30 border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Pair</label>
                   <input type="text" placeholder="e.g. XAUUSD" value={formData.asset} onChange={e => setFormData({ ...formData, asset: e.target.value })} className="w-full bg-black/30 border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Side</label>
                  <select value={formData.side} onChange={e => setFormData({ ...formData, side: e.target.value as Side })} className="w-full bg-black/30 border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors">
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Volume (Lots)</label>
                  <input type="number" step="0.01" value={formData.lotSize} onChange={e => setFormData({ ...formData, lotSize: parseFloat(e.target.value) })} className="w-full bg-black/30 border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Realized P/L ($)</label>
                <input type="number" value={formData.profitLoss} onChange={e => setFormData({ ...formData, profitLoss: parseFloat(e.target.value) })} className="w-full bg-black/30 border border-slate-800 rounded-xl p-4 outline-none focus:border-blue-500 transition-colors font-black text-xl text-blue-400" />
              </div>

              <div className="bg-black/30 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('ruleAdherence')}</label>
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, rulesFollowed: !formData.rulesFollowed })}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${formData.rulesFollowed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                  >
                    {formData.rulesFollowed ? t('rulesFollowed') : t('rulesBroken')}
                  </button>
                </div>
                {rules.length > 0 && (
                   <div className="space-y-2 max-h-32 overflow-auto custom-scrollbar">
                     {rules.map(rule => (
                       <div key={rule.id} className="flex items-center text-xs text-slate-400">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                         {rule.description}
                       </div>
                     ))}
                   </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl font-bold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 transition-all">Commit Trade</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
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
