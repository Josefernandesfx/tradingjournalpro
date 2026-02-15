
import React, { useState, useMemo, useEffect } from 'react';
import { User, PsychologyEntry, TradingRule } from '../types';
import { db } from '../db';
import { useTranslation } from '../i18nContext';
import PremiumTitle from '../components/PremiumTitle';

interface PsychologyProps {
  user: User;
}

const EMOTIONS_MAP = {
  fear: '😨 Fear',
  confidence: '😎 Confidence',
  anxiety: '😰 Anxiety',
  discipline: '🧘 Discipline',
  overtrading: '🎢 Overtrading',
  calm: '😌 Calm',
  frustration: '😤 Frustration',
  greed: '🤑 Greed',
  fomo: '🐭 FOMO'
};

const Psychology: React.FC<PsychologyProps> = ({ user }) => {
  const [entries, setEntries] = useState<PsychologyEntry[]>(() => db.getPsychology(user.id));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PsychologyEntry | null>(null);
  const { t } = useTranslation();

  const [formData, setFormData] = useState<Partial<PsychologyEntry>>({
    date: new Date().toISOString().split('T')[0],
    emotions: [],
    intensity: 5,
    notes: ''
  });

  useEffect(() => {
    setEntries(db.getPsychology(user.id));
  }, [user.id]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.notes || (formData.emotions?.length ?? 0) === 0) return alert("Provide notes and emotions.");
    const newEntry: PsychologyEntry = {
      ...formData as PsychologyEntry,
      id: editingEntry?.id || crypto.randomUUID(),
      userId: user.id,
      timestamp: Date.now()
    };
    db.savePsychology(newEntry);
    setEntries(db.getPsychology(user.id));
    setIsFormOpen(false);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === entries.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(entries.map(e => e.id)));
  };

  const handleBulkDelete = () => {
    if (confirm(`Exterminate ${selectedIds.size} records?`)) {
      db.deletePsychologyEntries(Array.from(selectedIds));
      setEntries(db.getPsychology(user.id));
      setSelectedIds(new Set());
    }
  };

  const stats = useMemo(() => {
    if (entries.length === 0) return { avg: 0, dom: '-' };
    const avg = entries.reduce((acc, c) => acc + c.intensity, 0) / entries.length;
    return { avg: avg.toFixed(1), dom: 'Calm' };
  }, [entries]);

  return (
    <div className="space-y-8 page-transition pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <PremiumTitle as="h2" className="text-4xl" variant="primary">
            {t('psychology')}
          </PremiumTitle>
          <p className="text-slate-500 font-medium">Monitoring cognitive bias and emotional variance during sessions.</p>
        </div>
        <div className="flex space-x-4">
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">
              Delete {selectedIds.size} Entries
            </button>
          )}
          <button 
            onClick={() => { 
              setEditingEntry(null); 
              setFormData({
                date: new Date().toISOString().split('T')[0],
                emotions: [],
                intensity: 5,
                notes: ''
              });
              setIsFormOpen(true); 
            }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            <span>{t('addEntry')}</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[32px] backdrop-blur-md text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logs Collected</p>
          <p className="text-3xl font-black mt-2 text-white">{entries.length}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[32px] backdrop-blur-md text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mean Intensity</p>
          <p className="text-3xl font-black mt-2 text-indigo-400">{stats.avg}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[32px] backdrop-blur-md text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Emotional State</p>
          <p className="text-3xl font-black mt-2 text-blue-400">{stats.dom}</p>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/40 rounded-[40px] backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/20 border-b border-slate-800/50">
              <tr>
                <th className="px-6 py-6 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-700 accent-blue-600"
                    checked={selectedIds.size === entries.length && entries.length > 0} 
                    onChange={toggleSelectAll} 
                  />
                </th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Profile</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Insights</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {entries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                <tr key={entry.id} className={`hover:bg-white/5 transition-all group ${selectedIds.has(entry.id) ? 'bg-blue-600/5' : ''}`}>
                  <td className="px-6 py-8 text-center">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-700 accent-blue-600"
                      checked={selectedIds.has(entry.id)} 
                      onChange={() => toggleSelect(entry.id)} 
                    />
                  </td>
                  <td className="px-4 py-8">
                    <p className="text-sm font-black text-white">{entry.date}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${entry.intensity * 10}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-8">
                    <div className="flex flex-wrap gap-2">
                      {entry.emotions.map(emo => (
                        <span key={emo} className="text-[10px] bg-slate-800 border border-slate-700/50 text-slate-300 px-3 py-1 rounded-xl font-black uppercase tracking-widest">
                          {EMOTIONS_MAP[emo as keyof typeof EMOTIONS_MAP] || emo}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-8">
                    <p className="text-sm text-slate-400 font-medium italic line-clamp-1 max-w-sm">"{entry.notes}"</p>
                  </td>
                  <td className="px-10 py-8 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => { setEditingEntry(entry); setFormData(entry); setIsFormOpen(true); }} className="bg-slate-800 p-2 rounded-lg hover:text-blue-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button onClick={() => { if(confirm('Delete?')) { db.deletePsychologyEntries([entry.id]); setEntries(db.getPsychology(user.id)); } }} className="bg-slate-800 p-2 rounded-lg hover:text-rose-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsFormOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[40px] p-10 shadow-2xl my-8">
            <div className="text-center mb-8">
              <PremiumTitle as="h3" variant="primary" className="text-3xl">
                Cognitive Log
              </PremiumTitle>
            </div>
            <form onSubmit={handleSave} className="space-y-8">
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-black/40 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-500 text-center font-bold" />
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block text-center">Emotional Arousal Intensity: {formData.intensity}</label>
                <input type="range" min="1" max="10" value={formData.intensity} onChange={e => setFormData({ ...formData, intensity: parseInt(e.target.value) })} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest px-1">
                  <span>Zen</span>
                  <span>Extreme</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block text-center">Active Emotional States</label>
                <div className="flex flex-wrap justify-center gap-3">
                  {Object.keys(EMOTIONS_MAP).map(key => (
                    <button key={key} type="button" onClick={() => {
                      const current = formData.emotions || [];
                      const next = current.includes(key) ? current.filter(x => x !== key) : [...current, key];
                      setFormData({ ...formData, emotions: next });
                    }} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black border transition-all duration-300 transform active:scale-95 ${formData.emotions?.includes(key) ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                      {(EMOTIONS_MAP as any)[key]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block text-center">Inner Dialogue</label>
                <textarea rows={4} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-black/40 border border-slate-800 p-5 rounded-3xl text-white outline-none focus:border-blue-500 text-sm italic text-center leading-relaxed" placeholder="What biases are influencing my decisions right now?..." />
              </div>

              <button type="submit" className="w-full bg-blue-600 p-5 rounded-3xl font-black uppercase tracking-widest text-white shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all transform active:scale-[0.98]">Commit Session Analysis</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Psychology;
