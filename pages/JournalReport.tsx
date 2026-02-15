
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Trade, PsychologyEntry } from '../types';
import { db } from '../db';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface JournalReportProps {
  user: User;
}

const JournalReport: React.FC<JournalReportProps> = ({ user }) => {
  const navigate = useNavigate();
  const trades = useMemo(() => db.getTrades(user.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [user.id]);
  const psychology = useMemo(() => db.getPsychology(user.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [user.id]);

  const stats = useMemo(() => {
    const initialBal = user.startingBalance || 10000;
    let currentEquity = initialBal;
    let maxEquity = initialBal;
    let maxDDValue = 0;
    const equityCurve: any[] = [{ name: 'Start', equity: initialBal }];
    
    trades.forEach((t, idx) => {
      currentEquity += t.profitLoss;
      equityCurve.push({ name: `T${idx + 1}`, equity: currentEquity });
      if (currentEquity > maxEquity) maxEquity = currentEquity;
      const dd = maxEquity - currentEquity;
      if (dd > maxDDValue) maxDDValue = dd;
    });

    const totalPL = currentEquity - initialBal;
    const winRate = trades.length > 0 ? (trades.filter(t => t.profitLoss > 0).length / trades.length) * 100 : 0;
    const discipline = trades.length > 0 ? (trades.filter(t => t.rulesFollowed).length / trades.length) * 100 : 100;
    const maxDDPct = (maxDDValue / maxEquity) * 100;

    return { totalPL, winRate, discipline, currentEquity, maxDDPct, equityCurve };
  }, [trades, user.startingBalance]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans print:bg-white print:text-black">
      {/* Action Bar (Hidden on Print) */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-sm font-black uppercase tracking-widest text-slate-400">Journal Report Preview</h1>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
          <span>Export to PDF</span>
        </button>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white;
            color: black;
          }
          .no-print { display: none; }
          .page-break { page-break-before: always; }
          .print-container { padding: 40px; }
          .print-card { border: 1px solid #e2e8f0; break-inside: avoid; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        }
        .report-book { max-width: 900px; margin: 0 auto; padding: 40px; }
      `}</style>

      <div className="report-book space-y-20 print:p-0 print:m-0 print:max-w-none">
        
        {/* CHAPTER 1: COVER PAGE */}
        <section className="h-[90vh] flex flex-col items-center justify-center text-center space-y-12 border-b-8 border-blue-600 pb-20 print:h-screen print:border-none">
          <div className="w-32 h-32 bg-blue-600 rounded-[32px] flex items-center justify-center shadow-2xl mb-8">
            <span className="text-6xl font-black text-white">TJP</span>
          </div>
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-4 uppercase">Trading Journal Pro</h1>
            <p className="text-2xl font-bold text-slate-500 italic">Institutional Performance & Behavioral Audit</p>
          </div>
          <div className="h-px w-64 bg-slate-300" />
          <div className="space-y-4">
            <p className="text-lg font-black uppercase tracking-[0.4em] text-slate-400">Operator Profile</p>
            <h2 className="text-4xl font-black text-blue-600">{user.name}</h2>
            <p className="text-slate-500 font-bold">{user.email}</p>
          </div>
          <div className="pt-20">
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Period Coverage</p>
            <p className="text-xl font-bold mt-2">
              {trades[0]?.date || 'N/A'} — {trades[trades.length - 1]?.date || 'N/A'}
            </p>
            <p className="text-xs text-slate-400 mt-4">Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
          </div>
        </section>

        {/* CHAPTER 2: PERFORMANCE OVERVIEW */}
        <section className="page-break print:pt-20">
          <div className="flex items-center space-x-4 mb-12">
            <span className="text-6xl font-black text-slate-200">01</span>
            <h3 className="text-4xl font-black uppercase tracking-tight">Performance Summary</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mb-12">
            {[
              { label: 'Total Realized P/L', value: `$${stats.totalPL.toLocaleString()}`, sub: 'Net results' },
              { label: 'Current Capital', value: `$${stats.currentEquity.toLocaleString()}`, sub: 'Account Balance' },
              { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, sub: 'Execution Accuracy' },
              { label: 'Discipline Score', value: `${stats.discipline.toFixed(1)}%`, sub: 'System Compliance' },
              { label: 'Max Drawdown', value: `${stats.maxDDPct.toFixed(2)}%`, sub: 'Peak-to-Trough' },
              { label: 'Total Executions', value: trades.length, sub: 'Log entries' },
            ].map((m, i) => (
              <div key={i} className="p-8 border border-slate-200 rounded-[32px] bg-slate-50">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{m.label}</p>
                <p className="text-3xl font-black text-slate-900">{m.value}</p>
                <p className="text-xs font-bold text-slate-500 mt-2 italic">{m.sub}</p>
              </div>
            ))}
          </div>

          <div className="p-10 border-2 border-slate-900 rounded-[40px] space-y-6">
            <h4 className="text-xl font-black uppercase tracking-widest">Equity Growth Trajectory</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.equityCurve}>
                  <defs>
                    <linearGradient id="printEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" hide />
                  <YAxis domain={['auto', 'auto']} fontSize={10} axisLine={false} tickLine={false} />
                  <Area type="monotone" dataKey="equity" stroke="#2563eb" strokeWidth={3} fill="url(#printEquity)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* CHAPTER 3: TRADE HISTORY */}
        <section className="page-break print:pt-20">
          <div className="flex items-center space-x-4 mb-12">
            <span className="text-6xl font-black text-slate-200">02</span>
            <h3 className="text-4xl font-black uppercase tracking-tight">Execution Archives</h3>
          </div>
          
          <div className="space-y-6">
            {trades.slice().reverse().map((trade, i) => (
              <div key={trade.id} className="p-8 border border-slate-200 rounded-[32px] break-inside-avoid">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Execution #{trades.length - i}</span>
                    <h4 className="text-2xl font-black">{trade.asset} <span className="text-slate-400 ml-2">[{trade.side}]</span></h4>
                    <p className="text-sm font-bold text-slate-500 mt-1">{trade.date} • {trade.marketSession} Session</p>
                  </div>
                  <div className={`text-2xl font-black px-6 py-2 rounded-2xl ${trade.profitLoss >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trade.profitLoss >= 0 ? '+' : '-'}${Math.abs(trade.profitLoss).toLocaleString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black uppercase text-slate-400">Volume</p>
                    <p className="text-sm font-black">{trade.lotSize} Lots</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black uppercase text-slate-400">R Multiple</p>
                    <p className="text-sm font-black">{trade.rMultiple?.toFixed(2)} R</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black uppercase text-slate-400">Setup</p>
                    <p className="text-sm font-black truncate">{trade.setup || 'Manual'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[8px] font-black uppercase text-slate-400">Rules</p>
                    <p className={`text-sm font-black ${trade.rulesFollowed ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.rulesFollowed ? 'Followed' : 'Broken'}
                    </p>
                  </div>
                </div>

                {trade.description && (
                  <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-slate-200">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Technical Description</p>
                    <p className="text-sm text-slate-600 leading-relaxed italic">"{trade.description}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CHAPTER 4: PSYCHOLOGICAL AUDIT */}
        <section className="page-break print:pt-20">
          <div className="flex items-center space-x-4 mb-12">
            <span className="text-6xl font-black text-slate-200">03</span>
            <h3 className="text-4xl font-black uppercase tracking-tight">Psychology Journal</h3>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {psychology.slice().reverse().map((entry) => (
              <div key={entry.id} className="p-10 border border-slate-200 rounded-[40px] break-inside-avoid">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900">{entry.date}</h4>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Cognitive Record</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-black text-slate-400 uppercase">Intensity</span>
                    <div className="w-32 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${entry.intensity * 10}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {entry.emotions.map(emo => (
                    <span key={emo} className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                      {emo}
                    </span>
                  ))}
                </div>

                <div className="prose max-w-none text-slate-700 leading-relaxed italic">
                  <p className="text-lg">"{entry.notes}"</p>
                </div>
              </div>
            ))}
            {psychology.length === 0 && (
              <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-[40px]">
                <p className="text-sm font-black uppercase tracking-widest">No psychology records found.</p>
              </div>
            )}
          </div>
        </section>

        {/* CHAPTER 5: BEHAVIORAL ANALYSIS */}
        <section className="page-break print:pt-20 mb-20">
          <div className="flex items-center space-x-4 mb-12">
            <span className="text-6xl font-black text-slate-200">04</span>
            <h3 className="text-4xl font-black uppercase tracking-tight">Behavioral Audit</h3>
          </div>
          
          <div className="bg-slate-900 text-white p-12 rounded-[48px] space-y-10">
            <div className="grid grid-cols-2 gap-12">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-4">Integrity Summary</p>
                <p className="text-lg leading-relaxed">
                  Your execution compliance stands at <span className="text-blue-400 font-black">{stats.discipline.toFixed(1)}%</span>. 
                  Professional traders aim for >95% system adherence to eliminate execution variance.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-4">Risk Behavior</p>
                <p className="text-lg leading-relaxed">
                  Max Drawdown observed: <span className="text-rose-400 font-black">{stats.maxDDPct.toFixed(2)}%</span>.
                  Ensure risk-per-trade remains static to preserve psychological capital.
                </p>
              </div>
            </div>
            
            <div className="h-px bg-white/10" />
            
            <div className="text-center py-10">
              <p className="text-xs font-black uppercase tracking-[0.5em] text-slate-500 mb-8">System Conclusion</p>
              <h5 className="text-3xl font-black italic">"The market is a device for transferring money from the impatient to the patient."</h5>
            </div>
          </div>
        </section>

        {/* BACK COVER */}
        <section className="h-[40vh] flex flex-col items-center justify-center text-center opacity-30 page-break">
           <p className="text-xs font-black uppercase tracking-[0.5em] mb-4">End of Report</p>
           <p className="text-sm font-bold">Trading Journal Pro v1.0 • Secure Export</p>
        </section>

      </div>
    </div>
  );
};

export default JournalReport;
