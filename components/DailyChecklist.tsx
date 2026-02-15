
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { useTranslation } from '../i18nContext';
import PremiumTitle from './PremiumTitle';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  xp: number;
}

const DailyChecklist: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`checklist_${userId}_${today}`);
    const defaultItems: ChecklistItem[] = [
      { id: 'log_trade', label: t('logTradeTask'), completed: false, xp: 10 },
      { id: 'psych_note', label: t('psychNoteTask'), completed: false, xp: 15 },
      { id: 'rules_check', label: t('rulesCheckTask'), completed: false, xp: 5 },
      { id: 'review_perf', label: t('reviewPerfTask'), completed: false, xp: 10 },
    ];
    
    const initialItems = saved ? JSON.parse(saved) : defaultItems;
    
    const trades = db.getTrades(userId).filter(t => t.date === today);
    const psych = db.getPsychology(userId).filter(p => p.date === today);
    
    const syncItems = initialItems.map((item: ChecklistItem) => {
      const refreshedItem = { ...item };
      if (item.id === 'log_trade') refreshedItem.label = t('logTradeTask');
      if (item.id === 'psych_note') refreshedItem.label = t('psychNoteTask');
      if (item.id === 'rules_check') refreshedItem.label = t('rulesCheckTask');
      if (item.id === 'review_perf') refreshedItem.label = t('reviewPerfTask');

      if (item.id === 'log_trade' && trades.length > 0) refreshedItem.completed = true;
      if (item.id === 'psych_note' && psych.length > 0) refreshedItem.completed = true;
      return refreshedItem;
    });

    setItems(syncItems);
  }, [userId, t]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`checklist_${userId}_${today}`, JSON.stringify(items));
    const completed = items.filter(i => i.completed).length;
    setProgress(items.length > 0 ? (completed / items.length) * 100 : 0);
  }, [items, userId]);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        if (!item.completed) db.updateXP(userId, item.xp);
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[40px] backdrop-blur-md">
      <div className="flex justify-between items-center mb-6">
        <PremiumTitle as="h3" variant="secondary" className="text-lg" withParallax={false}>
          {t('dailyChecklist')}
        </PremiumTitle>
        <div className="text-[10px] font-black uppercase tracking-widest text-blue-400">{progress.toFixed(0)}% Done</div>
      </div>
      
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-8">
        <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <button 
            key={item.id} 
            onClick={() => toggleItem(item.id)}
            className={`w-full flex items-center p-4 rounded-2xl border transition-all ${item.completed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-black/20 border-slate-800 text-slate-400 hover:border-slate-700'}`}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'}`}>
              {item.completed && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
            </div>
            <span className="text-sm font-bold flex-1 text-left">{item.label}</span>
            <span className="text-[10px] font-black uppercase opacity-60">+{item.xp} XP</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DailyChecklist;
