
import { Trade, PsychologyEntry, User, TradingRule } from './types';

const STORAGE_KEYS = {
  TRADES: 'tjp_trades',
  PSYCHOLOGY: 'tjp_psychology',
  USERS: 'tjp_users',
  CURRENT_USER: 'tjp_current_user',
  SETTINGS: 'tjp_settings',
  RULES: 'tjp_rules'
};

const generateSampleRules = (userId: string): TradingRule[] => [
  { id: 'rule-1', userId, description: 'Max 3 losses per day' },
  { id: 'rule-2', userId, description: 'Never trade without a Stop Loss' },
  { id: 'rule-3', userId, description: 'Wait for 2nd candle confirmation' },
  { id: 'rule-4', userId, description: 'No trading after 8 PM' }
];

const generateSamplePsychology = (userId: string): PsychologyEntry[] => {
  const emotionsSet = ['fear', 'confidence', 'anxiety', 'discipline', 'overtrading', 'calm', 'frustration', 'greed'];
  const samples: PsychologyEntry[] = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    samples.push({
      id: `psych-sample-${i}`,
      userId,
      date: date.toISOString().split('T')[0],
      emotions: [emotionsSet[i % emotionsSet.length], emotionsSet[(i + 2) % emotionsSet.length]],
      intensity: Math.floor(Math.random() * 5) + 3,
      notes: i % 2 === 0 ? "Felt very disciplined today. Followed all setups without hesitation." : "Felt a bit of FOMO during the NY open. Need to stay calmer.",
      timestamp: date.getTime()
    });
  }
  return samples;
};

const generateSampleTrades = (userId: string): Trade[] => {
  const assets = ['XAUUSD', 'USDJPY'];
  const sides: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
  const samples: Trade[] = [];
  
  for (let i = 0; i < 10; i++) {
    const isWin = Math.random() > 0.4;
    const pl = isWin ? Math.floor(Math.random() * 500) + 100 : -(Math.floor(Math.random() * 300) + 50);
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    samples.push({
      id: `sample-${i}`,
      userId,
      date: date.toISOString().split('T')[0],
      asset: assets[i % 2],
      side: sides[Math.floor(Math.random() * 2)],
      lotSize: parseFloat((Math.random() * 0.5 + 0.1).toFixed(2)),
      profitLoss: pl,
      notes: 'Sample trade for platform testing.',
      setup: i % 2 === 0 ? 'Trend Continuation' : 'Mean Reversion',
      rulesFollowed: Math.random() > 0.2,
      rMultiple: isWin ? 2.5 : -1
    });
  }
  return samples;
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
      if (anonymousTrades.length === 0) anonymousTrades = generateSampleTrades(userId);
      return anonymousTrades;
    }
    const trades = getFromStorage<Trade>(STORAGE_KEYS.TRADES).filter(t => t.userId === userId);
    if (trades.length === 0) return generateSampleTrades(userId);
    return trades;
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
      if (anonymousPsychology.length === 0) anonymousPsychology = generateSamplePsychology(userId);
      return anonymousPsychology;
    }
    const entries = getFromStorage<PsychologyEntry>(STORAGE_KEYS.PSYCHOLOGY).filter(p => p.userId === userId);
    if (entries.length === 0) return generateSamplePsychology(userId);
    return entries;
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
      if (anonymousRules.length === 0) anonymousRules = generateSampleRules(userId);
      return anonymousRules;
    }
    const rules = getFromStorage<TradingRule>(STORAGE_KEYS.RULES).filter(r => r.userId === userId);
    if (rules.length === 0) return generateSampleRules(userId);
    return rules;
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
