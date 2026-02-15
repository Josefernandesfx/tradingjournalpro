
import React, { useState, useMemo, useEffect } from 'react';
import { User, Trade, Side, MarketSession } from '../types';
import { db } from '../db';
import { useTranslation } from '../i18nContext';
import { useNavigate } from 'react-router-dom';
import PremiumTitle from '../components/PremiumTitle';

interface TradesProps {
  user: User;
}

const Trades: React.FC<TradesProps> = ({ user }) => {
  const [trades, setTrades] = useState<Trade[]>(() => db.getTrades(user.id));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [plString, setPlString] = useState('0');
  const [plMode, setPlMode] = useState<'profit' | 'loss'>('profit');

  const [formData, setFormData] = useState<Partial<Trade>>({
    date: new Date().toISOString().split('T')[0], 
    asset: '', 
    side: 'BUY', 
    lotSize: 0.01, 
    profitLoss: 0, 
    setup: '', 
    rulesFollowed: true,
    marketSession: 'None',
    description: ''
  });

  useEffect(() => {
    setTrades(db.getTrades(user.id));
  }, [user.id]);

  const handleOpenModal = (trade?: Trade) => {
    if (trade) {
      setEditingTrade(trade);
      setFormData(trade);
      setPlString(Math.abs(trade.profitLoss).toString());
      setPlMode(trade.profitLoss >= 0 ? 'profit' : 'loss');
    } else {
      setEditingTrade(null);
      setFormData({ 
        date: new Date().toISOString().split('T')[0], 
        asset: '', 
        side: 'BUY', 
        lotSize: 0.01, 
        profitLoss: 0, 
        setup: '', 
        rulesFollowed: true, 
        marketSession: 'None', 
        description: ''
      });
      setPlString('0');
      setPlMode('profit');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(plString) || 0;
    const finalPL = plMode === 'profit' ? val : -val;
    const newTrade: Trade = { 
      ...formData as Trade, 
      profitLoss: finalPL,
      id: editingTrade?.id || crypto.randomUUID(), 
      userId: user.id 
    };
    db.saveTrade(newTrade);
    setTrades(db.getTrades(user.id));
    setIsModalOpen(false);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === trades.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(trades.map(t => t.id)));
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) {
      db.deleteTrades(Array.from(selectedIds));
      setTrades(db.getTrades(user.id));
      setSelectedIds(new Set());
    }
  };

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trades]);

  return (
    <div className="space-y-10 page-transition pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <PremiumTitle as="h1" className="text-5xl" variant="secondary">
            {t('trades')} Log
          </PremiumTitle>
          <p className="text-slate-500 mt-2 font-medium">Capture every decision. Perfect every execution.</p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedIds.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30 px-6 py-5 rounded-[28px] font-black uppercase tracking-widest text-[10px] transition-all flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              <span>Delete {selectedIds.size}</span>
            </button>
          )}
          <button 
            onClick={() => navigate('/report')}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-8 py-5 rounded-[28px] font-black uppercase tracking-widest text-xs transition-all flex items-center space-x-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span>Export History</span>
          </button>
          <button onClick={() => handleOpenModal()} className="group bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[28px] font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-blue-500/30 flex items-center space-x-3 transform active:scale-95">
            <svg className="w-5 h-5 transition-transform group-hover:rotate-90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            <span>Log Execution</span>
          </button>
        </div>
      </header>

      {/* Records Table */}
      <div className="bg-slate-900/40 border border-slate-800/40 rounded-[48px] backdrop-blur-md overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/20 border-b border-slate-800/50">
              <tr>
                <th className="px-6 py-8">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-700 accent-blue-600 cursor-pointer"
                    checked={selectedIds.size === trades.length && trades.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Execution Date</th>
                <th className="px-4 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Market Entity</th>
                <th className="px-4 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Realized Result</th>
                <th className="px-4 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol Adherence</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {sortedTrades.map(trade => (
                <tr key={trade.id} className={`hover:bg-white/5 transition-all group ${selectedIds.has(trade.id) ? 'bg-blue-600/5' : ''}`}>
                  <td className="px-6 py-8">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-700 accent-blue-600 cursor-pointer"
                      checked={selectedIds.has(trade.id)}
                      onChange={() => toggleSelect(trade.id)}
                    />
                  </td>
                  <td className="px-4 py-8 text-sm font-bold text-slate-400 group-hover:text-slate-200">{trade.date}</td>
                  <td className="px-4 py-8">
                    <div className="flex items-center space-x-4">
                       <span className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${trade.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{trade.side}</span>
                       <span className="text-base font-black text-white group-hover:text-blue-400 transition-colors">{trade.asset}</span>
                    </div>
                  </td>
                  <td className="px-4 py-8">
                    <div className={`inline-flex items-center px-4 py-2 rounded-2xl font-black text-sm tracking-tight ${trade.profitLoss >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {trade.profitLoss >= 0 ? '+' : '-'}${Math.abs(trade.profitLoss).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-8">
                    <div className="flex items-center">
                       <div className={`w-3 h-3 rounded-full mr-3 shadow-lg ${trade.rulesFollowed ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-rose-500 shadow-rose-500/40'}`} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{trade.rulesFollowed ? 'System Integrity' : 'Rule Deviation'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right opacity-0 group-hover:opacity-100 transition-all">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleOpenModal(trade)} className="bg-slate-800 hover:bg-blue-600 text-white p-3 rounded-xl transition-all shadow-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button onClick={() => { if(confirm('Delete record?')) { db.deleteTrades([trade.id]); setTrades(db.getTrades(user.id)); } }} className="bg-slate-800 hover:bg-rose-600 text-white p-3 rounded-xl transition-all shadow-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {trades.length === 0 && (
            <div className="py-40 text-center opacity-40">
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero Record Database</p>
               <p className="text-xs mt-4">Commence execution logging to initialize terminal.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="absolute inset-0 bg-[#04070F]/90 backdrop-blur-2xl" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800/50 w-full max-w-2xl rounded-[48px] shadow-2xl p-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-12 duration-500 my-8">
             <div className="shine-overlay" />
             <PremiumTitle as="h3" variant="secondary" className="text-4xl mb-8">
               Commit Execution
             </PremiumTitle>
             <form onSubmit={handleSave} className="space-y-6 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('dateRange')}</label>
                     <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('asset')}</label>
                     <input required type="text" placeholder="e.g. BTCUSD" value={formData.asset} onChange={e => setFormData({ ...formData, asset: e.target.value.toUpperCase() })} className="w-full bg-black/40 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500" />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('lotSize')}</label>
                    <input type="number" step="0.01" value={formData.lotSize} onChange={e => setFormData({ ...formData, lotSize: parseFloat(e.target.value) || 0 })} className="w-full bg-black/40 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('session')}</label>
                    <select value={formData.marketSession} onChange={e => setFormData({ ...formData, marketSession: e.target.value as MarketSession })} className="w-full bg-black/40 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500">
                      <option value="None">{t('none')}</option>
                      <option value="Asia">{t('asia')}</option>
                      <option value="London">{t('london')}</option>
                      <option value="New York">{t('newyork')}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('pl')} ($)</label>
                     <div className="flex bg-black/40 p-1 rounded-xl border border-slate-800">
                        <button type="button" onClick={() => setPlMode('profit')} className={`px-4 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${plMode === 'profit' ? 'bg-emerald-500 text-black' : 'text-slate-500'}`}>{t('profitable')}</button>
                        <button type="button" onClick={() => setPlMode('loss')} className={`px-4 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${plMode === 'loss' ? 'bg-rose-500 text-black' : 'text-slate-500'}`}>{t('losing')}</button>
                     </div>
                   </div>
                   <input type="text" value={plString} onChange={e => setPlString(e.target.value)} className={`w-full bg-black/20 border border-slate-800 rounded-3xl p-6 text-4xl text-center font-black outline-none transition-all ${plMode === 'profit' ? 'text-emerald-400 focus:border-emerald-500' : 'text-rose-400 focus:border-rose-500'}`} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('description')}</label>
                  <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/40 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-blue-500 text-sm" placeholder="Market context..." />
                </div>

                <div className="bg-black/40 p-6 rounded-[32px] border border-slate-800/60 space-y-4">
                   <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('ruleCompliance')}</label>
                      <button type="button" onClick={() => setFormData({ ...formData, rulesFollowed: !formData.rulesFollowed })} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.rulesFollowed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                         {formData.rulesFollowed ? t('rulesFollowed') : t('rulesBroken')}
                      </button>
                   </div>
                </div>

                <div className="flex gap-3">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-700">Cancel</button>
                   <button type="submit" className="flex-1 bg-blue-600 p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-2xl shadow-blue-500/40 transform active:scale-95">Finalize Record</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trades;
