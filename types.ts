
export type Side = 'BUY' | 'SELL';
export type MarketSession = 'Asia' | 'London' | 'New York' | 'None';
export type RiskType = 'amount' | 'pct';

export interface Trade {
  id: string;
  userId: string;
  date: string;
  asset: string;
  side: Side;
  lotSize: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskAmount?: number;
  riskPct?: number;
  rMultiple?: number;
  profitLoss: number;
  notes: string;
  setup: string;
  rulesFollowed: boolean;
  marketSession?: MarketSession;
  description?: string;
  autoFlags?: string[];
  overrideNote?: string;
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

export type GoalPeriod = 'daily' | 'weekly' | 'monthly';

export interface UserGoal {
  id: string;
  name: string;
  type: 'max_trades' | 'min_trades' | 'psych_required' | 'profit_target' | 'drawdown_limit';
  period: GoalPeriod;
  targetValue: number;
  active: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string; // New field for profile photo
  isAnonymous?: boolean;
  startingBalance?: number;
  currency?: string;
  xp: number;
  level: number;
  streakCount: number;
  lastActivityDate?: string;
  streakFreezeCount: number;
  // Risk & Discipline Settings
  riskType?: RiskType;
  defaultRiskValue?: number;
  maxTradesPerDay?: number;
  dailyLossLimitValue?: number;
  dailyLossLimitType?: RiskType;
  mandatorySL?: boolean;
  goals?: UserGoal[];
}

export type Language = 'en' | 'pt' | 'fr' | 'zh';

export type AnimationIntensity = 'low' | 'medium' | 'high';

export interface AppSettings {
  language: Language;
  coachEnabled: boolean;
  streakEnabled: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  // Visual Effects
  marketAnimationsEnabled: boolean;
  animationIntensity: AnimationIntensity;
  reducedMotion: boolean;
}

export type AchievementCategory = 'Discipline' | 'Performance' | 'Psychology' | 'Consistency' | 'Risk';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  xpReward: number;
  icon: string;
}
