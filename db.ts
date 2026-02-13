
import { Trade, PsychologyEntry, User, TradingRule } from './types';

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
    if (user?.isAnonymous) {
      return anonymousTrades;
    }
    return getFromStorage<Trade>(STORAGE_KEYS.TRADES).filter(t => t.userId === userId);
  },
  saveTrade: (trade: Trade) => {
    const user = db.getCurrentUser();
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
  deleteTrade: (id: string) => {
    const user = db.getCurrentUser();
    if (user?.isAnonymous) {
      anonymousTrades = anonymousTrades.filter(t => t.id !== id);
      return;
    }
    const trades = getFromStorage<Trade>(STORAGE_KEYS.TRADES);
    saveToStorage(STORAGE_KEYS.TRADES, trades.filter(t => t.id !== id));
  },

  // Psychology
  getPsychology: (userId: string): PsychologyEntry[] => {
    const user = db.getCurrentUser();
    if (user?.isAnonymous) {
      return anonymousPsychology;
    }
    return getFromStorage<PsychologyEntry>(STORAGE_KEYS.PSYCHOLOGY).filter(p => p.userId === userId);
  },
  savePsychology: (entry: PsychologyEntry) => {
    const user = db.getCurrentUser();
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
  deletePsychology: (id: string) => {
    const user = db.getCurrentUser();
    if (user?.isAnonymous) {
      anonymousPsychology = anonymousPsychology.filter(e => e.id !== id);
      return;
    }
    const entries = getFromStorage<PsychologyEntry>(STORAGE_KEYS.PSYCHOLOGY);
    saveToStorage(STORAGE_KEYS.PSYCHOLOGY, entries.filter(e => e.id !== id));
  },

  // Rules
  getRules: (userId: string): TradingRule[] => {
    const user = db.getCurrentUser();
    if (user?.isAnonymous) {
      return anonymousRules;
    }
    return getFromStorage<TradingRule>(STORAGE_KEYS.RULES).filter(r => r.userId === userId);
  },
  saveRule: (rule: TradingRule) => {
    const user = db.getCurrentUser();
    if (user?.isAnonymous) {
      const index = anonymousRules.findIndex(r => r.id === rule.id);
      if (index > -1) anonymousRules[index] = rule;
      else anonymousRules.push(rule);
      return;
    }
    const rules = getFromStorage<TradingRule>(STORAGE_KEYS.RULES);
    const index = rules.findIndex(r => r.id === rule.id);
    if (index > -1) rules[index] = rule;
    else rules.push(rule);
    saveToStorage(STORAGE_KEYS.RULES, rules);
  },
  deleteRule: (id: string) => {
    const user = db.getCurrentUser();
    if (user?.isAnonymous) {
      anonymousRules = anonymousRules.filter(r => r.id !== id);
      return;
    }
    const rules = getFromStorage<TradingRule>(STORAGE_KEYS.RULES);
    saveToStorage(STORAGE_KEYS.RULES, rules.filter(r => r.id !== id));
  },

  // Auth (Mock)
  getUsers: (): User[] => getFromStorage<User>(STORAGE_KEYS.USERS),
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      anonymousTrades = [];
      anonymousPsychology = [];
      anonymousRules = [];
    }
  },
  registerUser: (user: User) => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    users.push(user);
    saveToStorage(STORAGE_KEYS.USERS, users);
  }
};
