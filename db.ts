
import { Trade, PsychologyEntry, User, TradingRule, UserGoal } from './types';

const STORAGE_KEYS = {
  TRADES: 'tjp_trades',
  PSYCHOLOGY: 'tjp_psychology',
  USERS: 'tjp_users',
  CURRENT_USER: 'tjp_current_user',
  SETTINGS: 'tjp_settings',
  RULES: 'tjp_rules'
};

let anonymousTrades: Trade[] = [];
let anonymousPsychology: PsychologyEntry[] = [];
let anonymousRules: TradingRule[] = [];

const getFromStorage = <T,>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = <T,>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  // Trades
  getTrades: (userId: string): Trade[] => {
    const user = db.getCurrentUser();
    if (user?.isAnonymous) return anonymousTrades;
    return getFromStorage<Trade>(STORAGE_KEYS.TRADES).filter(t => t.userId === userId);
  },
  saveTrade: (trade: Trade) => {
    const user = db.getCurrentUser();
    if (user) {
      db.updateXP(user.id, 25);
      db.updateStreak(user.id);
    }
    if (user?.isAnonymous) {
      const index = anonymousTrades.findIndex(t => t.id === trade.id);
      if (index > -1) anonymousTrades[index] = trade;
      else anonymousTrades.push(trade);
      return;
    }
    const trades = getFromStorage<Trade>(STORAGE_KEYS.TRADES);
    const index = trades.findIndex(t => t.id === trade.id);
    if (index > -1) trades[index] = trade;
    else trades.push(trade);
    saveToStorage(STORAGE_KEYS.TRADES, trades);
  },
  deleteTrades: (ids: string[]) => {
    const user = db.getCurrentUser();
    if (user?.isAnonymous) {
      anonymousTrades = anonymousTrades.filter(t => !ids.includes(t.id));
      return;
    }
    const trades = getFromStorage<Trade>(STORAGE_KEYS.TRADES);
    saveToStorage(STORAGE_KEYS.TRADES, trades.filter(t => !ids.includes(t.id)));
  },

  // Psychology
  getPsychology: (userId: string): PsychologyEntry[] => {
    const user = db.getCurrentUser();
    if (user?.isAnonymous) return anonymousPsychology;
    return getFromStorage<PsychologyEntry>(STORAGE_KEYS.PSYCHOLOGY).filter(p => p.userId === userId);
  },
  savePsychology: (entry: PsychologyEntry) => {
    const user = db.getCurrentUser();
    if (user) {
      db.updateXP(user.id, 20);
      db.updateStreak(user.id);
    }
    if (user?.isAnonymous) {
      const index = anonymousPsychology.findIndex(e => e.id === entry.id);
      if (index > -1) anonymousPsychology[index] = entry;
      else anonymousPsychology.push(entry);
      return;
    }
    const entries = getFromStorage<PsychologyEntry>(STORAGE_KEYS.PSYCHOLOGY);
    const index = entries.findIndex(e => e.id === entry.id);
    if (index > -1) entries[index] = entry;
    else entries.push(entry);
    saveToStorage(STORAGE_KEYS.PSYCHOLOGY, entries);
  },
  deletePsychologyEntries: (ids: string[]) => {
    const user = db.getCurrentUser();
    if (user?.isAnonymous) {
      anonymousPsychology = anonymousPsychology.filter(e => !ids.includes(e.id));
      return;
    }
    const entries = getFromStorage<PsychologyEntry>(STORAGE_KEYS.PSYCHOLOGY);
    saveToStorage(STORAGE_KEYS.PSYCHOLOGY, entries.filter(e => !ids.includes(e.id)));
  },

  // XP and Leveling
  updateXP: (userId: string, amount: number) => {
    const user = db.getCurrentUser();
    if (!user) return;
    const currentXP = user.xp || 0;
    const newXP = currentXP + amount;
    const newLevel = Math.floor(newXP / 1000) + 1;
    db.updateUserRecord({ ...user, xp: newXP, level: newLevel });
  },

  updateStreak: (userId: string) => {
    const user = db.getCurrentUser();
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let currentStreak = user.streakCount || 0;
    if (user.lastActivityDate === today) return;

    if (user.lastActivityDate === yesterday) currentStreak += 1;
    else currentStreak = 1;

    db.updateUserRecord({ ...user, streakCount: currentStreak, lastActivityDate: today });
  },

  updateUserRecord: (user: User) => {
    db.setCurrentUser(user);
    if (!user.isAnonymous) {
      const users = getFromStorage<User>(STORAGE_KEYS.USERS);
      const index = users.findIndex(u => u.id === user.id);
      if (index > -1) users[index] = user;
      saveToStorage(STORAGE_KEYS.USERS, users);
    }
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
  getRules: (userId: string): TradingRule[] => {
    const user = db.getCurrentUser();
    if (user?.isAnonymous) return anonymousRules;
    return getFromStorage<TradingRule>(STORAGE_KEYS.RULES).filter(r => r.userId === userId);
  },
  saveRule: (rule: TradingRule) => {
    if (db.getCurrentUser()?.isAnonymous) {
      anonymousRules.push(rule);
      return;
    }
    const rules = getFromStorage<TradingRule>(STORAGE_KEYS.RULES);
    rules.push(rule);
    saveToStorage(STORAGE_KEYS.RULES, rules);
  },
  deleteRule: (id: string) => {
    const rules = getFromStorage<TradingRule>(STORAGE_KEYS.RULES).filter(r => r.id !== id);
    saveToStorage(STORAGE_KEYS.RULES, rules);
  },
  getUsers: (): User[] => getFromStorage<User>(STORAGE_KEYS.USERS),
  registerUser: (user: User) => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    users.push({ ...user, xp: 0, level: 1, streakCount: 0, streakFreezeCount: 0, goals: [] });
    saveToStorage(STORAGE_KEYS.USERS, users);
  }
};
