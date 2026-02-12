
export type Side = 'BUY' | 'SELL';

export interface Trade {
  id: string;
  userId: string;
  date: string;
  asset: string;
  side: Side;
  lotSize: number;
  profitLoss: number;
  notes: string;
  setup: string;
  rulesFollowed: boolean;
  rMultiple?: number;
}

export interface PsychologyEntry {
  id: string;
  userId: string;
  date: string;
  emotions: string[];
  intensity: number;
  notes: string;
  timestamp: number;
}

export interface TradingRule {
  id: string;
  userId: string;
  description: string;
}

export interface SetupType {
  id: string;
  userId: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isAnonymous?: boolean;
  startingBalance?: number;
  currency?: string;
  xp?: number;
  level?: number;
}

export type Language = 'en' | 'pt' | 'fr' | 'it' | 'jp';

export interface AppSettings {
  theme: 'light' | 'dark';
  language: Language;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  date?: string;
}
