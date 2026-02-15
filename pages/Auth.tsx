
import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../db';
import { useTranslation } from '../i18nContext';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const user = db.getUsers().find(u => u.email === email);
      if (user) { db.setCurrentUser(user); onLogin(user); }
      else { setError('User not found.'); }
    } else {
      // Fix: Add missing required User properties
      const newUser: User = { 
        id: crypto.randomUUID(), 
        email, 
        name,
        xp: 0,
        level: 1,
        streakCount: 0,
        streakFreezeCount: 0
      };
      db.registerUser(newUser); db.setCurrentUser(newUser); onLogin(newUser);
    }
  };

  const handleAnonymousLogin = () => {
    // Fix: Add missing required User properties
    const guestUser: User = { 
      id: 'guest-session', 
      email: 'guest@tjp.com', 
      name: 'Guest', 
      isAnonymous: true,
      xp: 0,
      level: 1,
      streakCount: 0,
      streakFreezeCount: 0
    };
    db.setCurrentUser(guestUser); onLogin(guestUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-md bg-white/20 dark:bg-[#0B0B0B]/40 backdrop-blur-3xl rounded-[40px] shadow-2xl p-10 border border-black/5 dark:border-white/5 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent uppercase tracking-tighter">
            Trading Journal Pro
          </h1>
          <p className="text-slate-600 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Institutional Logic Terminal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Operator Identity (Name)" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-black/40 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500" 
            />
          )}
          <input 
            type="email" 
            placeholder="Network ID (Email)" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-black/40 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500" 
          />
          <input 
            type="password" 
            placeholder="Security Key (Password)" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-black/40 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500" 
          />
          {error && <p className="text-rose-600 text-[10px] font-black uppercase text-center tracking-widest">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-600/20">
            {isLogin ? 'Initialize Session' : 'Create Terminal Access'}
          </button>
        </form>

        <div className="my-8 flex items-center">
          <div className="flex-1 h-px bg-slate-300 dark:bg-slate-800" />
          <span className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Cross-Protocol</span>
          <div className="flex-1 h-px bg-slate-300 dark:bg-slate-800" />
        </div>

        <button onClick={handleAnonymousLogin} className="w-full border border-slate-300 dark:border-slate-800 bg-white/10 p-4 rounded-2xl font-black text-slate-600 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-white/10 transition-all uppercase tracking-widest text-[10px]">
          {t('guestLogin')}
        </button>
        <p className="mt-4 text-[10px] text-center text-slate-500 font-medium italic opacity-60 leading-relaxed px-4">
          {t('anonymousNote')}
        </p>
        
        <div className="mt-8 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
            {isLogin ? 'New Operator? Register' : 'Existing Access? Authenticate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
