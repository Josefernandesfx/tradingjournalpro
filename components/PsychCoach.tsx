
import React, { useMemo } from 'react';
import { Trade, PsychologyEntry } from '../types';
import { useTranslation } from '../i18nContext';
import PremiumTitle from './PremiumTitle';

interface PsychCoachProps {
  trades: Trade[];
  psychEntries: PsychologyEntry[];
}

const PsychCoach: React.FC<PsychCoachProps> = ({ trades, psychEntries }) => {
  const { t } = useTranslation();
  
  const insights = useMemo(() => {
    const messages: { type: 'positive' | 'risk', text: string }[] = [];
    const actionStep = "Focus on one A+ setup tomorrow.";
    
    // Rule: Detect Fear
    const fearCount = psychEntries.filter(p => p.emotions.includes('fear')).length;
    const recentLosses = trades.slice(-3).filter(t => t.profitLoss < 0).length;
    
    if (fearCount >= 3 && recentLosses >= 2) {
      messages.push({ type: 'risk', text: 'Fear is recurring on losing days. Reduce position size by 50% until confidence returns.' });
    }

    // Rule: Overtrading
    const overtradingCount = psychEntries.filter(p => p.emotions.includes('overtrading')).length;
    if (overtradingCount >= 2) {
      messages.push({ type: 'risk', text: 'Overtrading detected in logs. Set a mandatory max trade limit of 2 per day.' });
    }

    // Rule: Confidence & Profit
    const confidenceWins = psychEntries.filter(p => p.emotions.includes('confidence')).length;
    const totalProfits = trades.filter(t => t.profitLoss > 0).length;
    if (confidenceWins >= 3 && totalProfits >= 5) {
      messages.push({ type: 'positive', text: 'Confidence aligns with your best performance. Your routine is working.' });
    }

    // Default if no specific rules hit
    if (messages.length === 0) {
      messages.push({ type: 'positive', text: 'Data shows stable emotional variance. Continue tracking to uncover hidden biases.' });
    }

    return { messages, actionStep };
  }, [trades, psychEntries]);

  return (
    <div className="bg-slate-900/40 border border-slate-800/40 p-8 rounded-[40px] backdrop-blur-md space-y-6">
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 14.5A5.5 5.5 0 0 0 17.5 9 5.5 5.5 0 0 0 12 3.5 5.5 5.5 0 0 0 6.5 9 5.5 5.5 0 0 0 12 14.5Z"/><path d="M12 14.5v7"/><path d="M8 22h8"/></svg>
        </div>
        <PremiumTitle as="h3" variant="primary" className="text-xl" withParallax={false}>
          {t('psychCoach')}
        </PremiumTitle>
      </div>

      <div className="space-y-4">
        {insights.messages.map((msg, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${msg.type === 'positive' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
            <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-800/50">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{t('actionNext')}</p>
        <p className="text-sm text-indigo-400 font-black tracking-tight">{insights.actionStep}</p>
      </div>
    </div>
  );
};

export default PsychCoach;
