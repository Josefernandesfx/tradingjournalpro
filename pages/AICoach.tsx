
import React, { useState, useEffect } from 'react';
import { User, Trade, PsychologyEntry } from '../types';
import { db } from '../db';
import { GoogleGenAI } from '@google/genai';

interface AICoachProps {
  user: User;
}

const AICoach: React.FC<AICoachProps> = ({ user }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const trades = db.getTrades(user.id);
      const psychology = db.getPsychology(user.id);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analyze my recent trading performance and emotional state as a trading coach.
        
        TRADES DATA: ${JSON.stringify(trades.slice(-20))}
        PSYCHOLOGY DATA: ${JSON.stringify(psychology.slice(-10))}
        
        Provide:
        1. A summary of my current performance.
        2. Identification of any behavioral patterns (good or bad).
        3. 3 actionable tips to improve my trading next week.
        
        Keep it professional, encouraging, and concise. Use Markdown formatting.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAdvice(response.text || "I'm having trouble analyzing your data right now. Try adding more trades first!");
    } catch (err: any) {
      console.error(err);
      setError('Failed to reach the AI Coach. Please ensure your API key is configured correctly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">AI Trading Coach</h2>
          <p className="text-slate-500 dark:text-slate-400">Get personalized insights based on your trade history and psychology logs.</p>
        </div>
        <button 
          onClick={generateAdvice}
          disabled={loading}
          className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-xl shadow-blue-500/20 flex items-center space-x-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
          )}
          <span>{loading ? 'Analyzing...' : 'Analyze My Trading'}</span>
        </button>
      </header>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {advice ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 prose dark:prose-invert max-w-none">
          <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white m-0">Gemini Coach Report</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 m-0">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {advice}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ready for some wisdom?</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Click the button above to have Gemini analyze your data and provide a professional coaching report.
          </p>
        </div>
      )}
    </div>
  );
};

export default AICoach;
