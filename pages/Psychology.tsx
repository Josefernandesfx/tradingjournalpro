
import React, { useState, useMemo, useEffect } from 'react';
import { User, PsychologyEntry, TradingRule } from '../types';
import { db } from '../db';
import { useTranslation } from '../i18nContext';

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
  greed: '🤑 Greed'
};

const Psychology: React.FC<PsychologyProps> = ({ user }) => {
  const [entries, setEntries] = useState<PsychologyEntry[]>(() => db.getPsychology(user.id));
  const [rules, setRules] = useState<TradingRule[]>(() => db.getRules(user.id));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PsychologyEntry | null>(null);
  const { t } = useTranslation();

  const [checkedRules, setCheckedRules] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<Partial<PsychologyEntry>>({
    date: new Date().toISOString().split('T')[0],
    emotions: [],
    intensity: 5,
    notes: ''
  });

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    emotion: '',
    minIntensity: 1,
    maxIntensity: 10
  });

  useEffect(() => {
    setEntries(db.getPsychology(user.id));
    setRules(db.getRules(user.id));
  }, [user.id]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.notes || (formData.emotions?.length ?? 0) === 0) {
      alert("Please provide notes and select at least one emotion.");
      return;
    }

    const newEntry: PsychologyEntry = {
      ...formData as PsychologyEntry,
      id: editingEntry?.id || crypto.randomUUID(),
      userId: user.id,
      timestamp: Date.now()
    };

    db.savePsychology(newEntry);
    setEntries(db.getPsychology(user.id));
    setIsFormOpen(false);
    setEditingEntry(null);
    setCheckedRules(new Set());
    setFormData({
      date: new Date().toISOString().split('T')[0],
      emotions: [],
      intensity: 5,
      notes: ''
    });
  };

  const handleEdit = (entry: PsychologyEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('confirmDelete'))) {
      db.deletePsychology(id);
      setEntries(db.getPsychology(user.id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBulkDelete = () => {
    if (confirm(t('confirmDelete'))) {
      selectedIds.forEach(id => db.deletePsychology(id));
      setEntries(db.getPsychology(user.id));
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
    if (selectedIds.size === filteredEntries.length && filteredEntries.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEntries.map(e => e.id)));
    }
  };

  const toggleEmotion = (emo: string) => {
    setFormData(prev => {
      const current = prev.emotions || [];
      if (current.includes(emo)) {
        return { ...prev, emotions: current.filter(e => e !== emo) };
      } else {
        return { ...prev, emotions: [...current, emo] };
      }
    });
  };

  const toggleRuleCheck = (id: string) => {
    setCheckedRules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;

      const dateMatch = (!start || entryDate >= start) && (!end || entryDate <= end);
      const emotionMatch = !filters.emotion || entry.emotions.includes(filters.emotion);
      const intensityMatch = entry.intensity >= filters.minIntensity && entry.intensity <= filters.maxIntensity;

      return dateMatch && emotionMatch && intensityMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, filters]);

  const stats = useMemo(() => {
    if (filteredEntries.length === 0) return { avgIntensity: 0, dominantEmotion: '-' };
    const totalIntensity = filteredEntries.reduce((acc, curr) => acc + curr.intensity, 0);
    const emotionCounts: Record<string, number> = {};
    filteredEntries.forEach(entry => {
      entry.emotions.forEach(emo => {
        emotionCounts[emo] = (emotionCounts[emo] || 0) + 1;
      });
    });

    let dominant = '-';
    let maxCount = 0;
    Object.entries(emotionCounts).forEach(([emo, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominant = emo;
      }
    });

    return {
      avgIntensity: (totalIntensity / filteredEntries.length).toFixed(1),
      dominantEmotion: dominant
    };
  }, [filteredEntries]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <style>{`
        .emotion-tag {
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .emotion-tag:hover {
          transform: scale(1.1) rotate(1deg);
        }
      `}</style>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tight text-white">{t('psychology')}</h2>
          <p className="text-slate-500 font-medium">Monitoring cognitive bias and emotional variance during market sessions.</p>
        </div>
        <button 
          onClick={() => { setIsFormOpen(true); setEditingEntry(null); setCheckedRules(new Set()); }} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-500/20 flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          <span>{t('addEntry')}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[32px] backdrop-blur-md">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('summary')}</p>
          <p className="text-3xl font-black mt-2 text-white">{filteredEntries.length} Recorded Sessions</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[32px] backdrop-blur-md">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('avgIntensity')}</p>
          <p className="text-3xl font-black mt-2 text-indigo-400">{stats.avgIntensity}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[32px] backdrop-blur-md">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('dominantEmotion')}</p>
          <p className="text-3xl font-black mt-2 text-blue-400">
            {stats.dominantEmotion !== '-' ? (EMOTIONS_MAP[stats.dominantEmotion as keyof typeof EMOTIONS_MAP] || stats.dominantEmotion) : '-'}
          </p>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#04070F]/80 backdrop-blur-md" onClick={() => setIsFormOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800/50 w-full max-w-2xl rounded-[40px] shadow-2xl p-10 overflow-hidden max-h-[95vh] flex flex-col">
            <h3 className="text-3xl font-black mb-8 text-white">{editingEntry ? 'Refine Session Record' : 'Initial Session Discovery'}</h3>
            <form onSubmit={handleSave} className="space-y-8 overflow-auto pr-4 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Session Date</label>
                  <input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({ ...formData, date: e.target.value })} 
                    className="w-full bg-black/40 border border-slate-800 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all text-white font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Emotional Intensity ({formData.intensity})</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={formData.intensity} 
                    onChange={e => setFormData({ ...formData, intensity: parseInt(e.target.value) })} 
                    className="w-full accent-blue-600 mt-4"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 font-black uppercase tracking-widest">
                    <span>Neutral</span>
                    <span>Peak Arousal</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Sentiment Identifiers</label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(EMOTIONS_MAP).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleEmotion(key)}
                      className={`emotion-tag px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all duration-300 ${
                        formData.emotions?.includes(key) 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'border-slate-800 bg-black/20 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-black/30 p-8 rounded-[32px] border border-slate-800/60 shadow-inner">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-6">Plan Fidelity Checklist</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rules.length > 0 ? rules.map(rule => (
                    <label key={rule.id} className="flex items-center space-x-4 cursor-pointer group p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                      <div 
                        onClick={() => toggleRuleCheck(rule.id)}
                        className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                          checkedRules.has(rule.id) ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-slate-700 bg-black/40 group-hover:border-slate-500'
                        }`}
                      >
                        {checkedRules.has(rule.id) && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        )}
                      </div>
                      <span className={`text-xs font-bold transition-colors ${checkedRules.has(rule.id) ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        {rule.description}
                      </span>
                    </label>
                  )) : (
                    <p className="text-[10px] text-slate-600 font-black uppercase italic py-4">Defined rules not found in terminal settings.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Self-Reflective Narrative</label>
                <textarea 
                  rows={4}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Record internal dialogue, patterns of hesitation, or moments of flow..."
                  className="w-full bg-black/40 border border-slate-800 rounded-3xl p-6 outline-none focus:border-blue-500 transition-all text-sm text-slate-300 resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="flex gap-4 pt-4 mb-4">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)} 
                  className="flex-1 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all"
                >
                  Finalize Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="bg-slate-900/40 border border-slate-800/40 rounded-[40px] backdrop-blur-md overflow-hidden shadow-2xl">
        {selectedIds.size > 0 && (
          <div className="bg-blue-600/10 p-6 px-10 flex items-center justify-between border-b border-blue-500/20">
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{selectedIds.size} Sessions Selected</span>
            <button 
              onClick={handleBulkDelete} 
              className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20"
            >
              Exterminate Selected
            </button>
          </div>
        )}

        {filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/20 border-b border-slate-800/50">
                <tr>
                  <th className="px-10 py-6">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border-slate-700 accent-blue-600"
                      checked={selectedIds.size === filteredEntries.length && filteredEntries.length > 0} 
                      onChange={toggleSelectAll} 
                    />
                  </th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timeline</th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Psychological Profile</th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Core Insights</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-10 py-8">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg border-slate-700 accent-blue-600"
                        checked={selectedIds.has(entry.id)} 
                        onChange={() => toggleSelect(entry.id)} 
                      />
                    </td>
                    <td className="px-4 py-8">
                      <p className="text-sm font-black text-white">{entry.date}</p>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${entry.intensity * 10}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Int: {entry.intensity}</span>
                      </div>
                    </td>
                    <td className="px-4 py-8">
                      <div className="flex flex-wrap gap-2">
                        {entry.emotions.map(emo => (
                          <span key={emo} className="emotion-tag text-[10px] bg-slate-800/80 border border-slate-700/50 text-slate-300 px-4 py-1.5 rounded-2xl font-black uppercase tracking-widest transition-transform cursor-default">
                            {EMOTIONS_MAP[emo as keyof typeof EMOTIONS_MAP] || emo}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-8">
                      <p className="text-sm text-slate-400 font-medium italic line-clamp-2 max-w-md">"{entry.notes}"</p>
                    </td>
                    <td className="px-10 py-8 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end space-x-4">
                        <button onClick={() => handleEdit(entry)} className="text-slate-500 hover:text-blue-400 transition-colors p-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button onClick={() => handleDelete(entry.id)} className="text-slate-500 hover:text-rose-500 transition-colors p-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center px-10">
            <div className="w-24 h-24 bg-slate-800/40 rounded-full flex items-center justify-center text-slate-600 mb-8 border border-slate-700/40 backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 14.5A5.5 5.5 0 0 0 17.5 9 5.5 5.5 0 0 0 12 3.5 5.5 5.5 0 0 0 6.5 9 5.5 5.5 0 0 0 12 14.5Z"/><path d="M12 14.5v7"/><path d="M8 22h8"/></svg>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-4">Void Detection: Behavioral Logs Empty</h3>
            <p className="text-slate-500 max-w-sm text-sm font-medium leading-relaxed">
              Quantify the invisible elements of your trading. Identifying your cognitive bias is the final step in achieving professional-grade consistency.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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

export default Psychology;
