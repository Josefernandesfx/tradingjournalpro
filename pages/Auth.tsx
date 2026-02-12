
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
      const newUser: User = { id: crypto.randomUUID(), email, name };
      db.registerUser(newUser); db.setCurrentUser(newUser); onLogin(newUser);
    }
  };

  const handleAnonymousLogin = () => {
    const guestUser: User = { id: 'guest-session', email: 'guest@tjp.com', name: 'Guest', isAnonymous: true };
    db.setCurrentUser(guestUser); onLogin(guestUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-10">Trading Journal Pro</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />}
          <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
          <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent" />
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold">{isLogin ? 'Login' : 'Sign Up'}</button>
        </form>
        <div className="my-6 text-center text-xs text-slate-500 uppercase tracking-widest">Or</div>
        <button onClick={handleAnonymousLogin} className="w-full border-2 border-slate-100 dark:border-slate-700 p-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:border-blue-500 transition-colors">
          {t('guestLogin')}
        </button>
        <p className="mt-2 text-[10px] text-center text-slate-400 italic">{t('anonymousNote')}</p>
        <div className="mt-8 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 font-bold">{isLogin ? 'Create Account' : 'Back to Login'}</button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
