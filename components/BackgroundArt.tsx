
import React, { useMemo } from 'react';
import { AppSettings } from '../types';

interface BackgroundArtProps {
  settings: AppSettings;
}

const BackgroundArt: React.FC<BackgroundArtProps> = ({ settings }) => {
  const isEnabled = settings?.marketAnimationsEnabled && !settings?.reducedMotion;
  const intensity = settings?.animationIntensity || 'medium';

  const particleCount = intensity === 'high' ? 30 : intensity === 'medium' ? 15 : 8;
  const lineOpacity = intensity === 'high' ? 'opacity-[0.1]' : intensity === 'medium' ? 'opacity-[0.06]' : 'opacity-[0.03]';

  // Memoize random particle properties to prevent flickering on re-renders
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      driftX: `${(Math.random() - 0.5) * 200}px`,
      driftY: `${(Math.random() - 0.5) * 200}px`,
      duration: `${15 + Math.random() * 20}s`,
      delay: `${Math.random() * 10}s`,
      size: `${1 + Math.random() * 2}px`
    }));
  }, [particleCount]);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-white dark:bg-[#04070F] transition-colors duration-500">
      
      {/* GLOBAL GRID SYSTEM */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-900 dark:text-white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* DYNAMIC MARKET LINE LAYER */}
      {isEnabled && (
        <div className={`absolute inset-0 ${lineOpacity} overflow-visible`}>
          <svg viewBox="0 0 1600 900" className="w-[3200px] h-full overflow-visible preserve-3d" style={{
            animation: `market-line-scroll ${intensity === 'high' ? '60s' : intensity === 'medium' ? '100s' : '150s'} linear infinite`,
            willChange: 'transform'
          }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path 
              d="M 0,450 Q 200,300 400,450 T 800,450 T 1200,450 T 1600,450 T 2000,450 T 2400,450 T 2800,450 T 3200,450" 
              fill="none" 
              stroke="url(#lineGrad)" 
              strokeWidth="2"
              className="text-blue-500 dark:text-blue-400"
            />
            <path 
              d="M 0,550 Q 200,700 400,550 T 800,550 T 1200,550 T 1600,550 T 2000,550 T 2400,550 T 2800,550 T 3200,550" 
              fill="none" 
              stroke="url(#lineGrad)" 
              strokeWidth="1"
              className="text-indigo-500 dark:text-indigo-400 opacity-50"
            />
          </svg>
        </div>
      )}

      {/* DYNAMIC CANDLESTICKS LAYER */}
      {isEnabled && (
        <div className="absolute inset-0 flex items-center justify-around opacity-[0.05] dark:opacity-[0.08]">
          {[1, 2, 3, 4, 5].map((_, i) => (
            <div key={i} className="flex flex-col items-center" style={{
              animation: `market-candle-rise ${10 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 3}s`,
              '--candle-height': `${80 + i * 40}px`
            } as any}>
              <div className="w-[1px] h-10 bg-slate-400 dark:bg-slate-600" />
              <div className={`w-8 rounded-sm ${i % 2 === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ height: 'var(--candle-height)' }} />
              <div className="w-[1px] h-10 bg-slate-400 dark:bg-slate-600" />
            </div>
          ))}
        </div>
      )}

      {/* FINANCIAL PARTICLES LAYER */}
      {isEnabled && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div 
              key={p.id}
              className="absolute bg-blue-400/40 rounded-full"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                animation: `financial-particle-drift ${p.duration} linear infinite`,
                animationDelay: p.delay,
                '--drift-x': p.driftX,
                '--drift-y': p.driftY
              } as any}
            />
          ))}
        </div>
      )}

      {/* STATIC CANDLESTICK CHARTS LAYER */}
      <div className="absolute inset-0 opacity-[0.1] dark:opacity-[0.15]">
        <svg viewBox="0 0 1600 900" className="w-full h-full text-slate-900 dark:text-white fill-none stroke-current" strokeWidth="1.2">
          {/* Main Chart Cluster 1 */}
          <g transform="translate(100, 100) scale(0.8)">
            <line x1="50" y1="200" x2="50" y2="350" /> <rect x="35" y="240" width="30" height="80" className="fill-current/10" />
            <line x1="100" y1="180" x2="100" y2="300" /> <rect x="85" y="200" width="30" height="70" />
            <line x1="150" y1="150" x2="150" y2="250" /> <rect x="135" y="180" width="30" height="40" className="fill-current/10" />
            <line x1="200" y1="120" x2="200" y2="200" /> <rect x="185" y="140" width="30" height="30" />
            <path d="M 40,320 Q 120,200 210,140" strokeDasharray="8,4" opacity="0.5" />
          </g>

          {/* Main Chart Cluster 2 (Background Depth) */}
          <g transform="translate(1100, 500) scale(1.2)">
            <line x1="20" y1="100" x2="20" y2="250" /> <rect x="5" y="140" width="30" height="80" className="fill-current/5" />
            <line x1="70" y1="130" x2="70" y2="280" /> <rect x="55" y="170" width="30" height="70" className="fill-current/5" />
            <line x1="120" y1="80" x2="120" y2="200" /> <rect x="105" y="110" width="30" height="50" className="fill-current/5" />
          </g>

          {/* Data Points / Tape Numbers */}
          <g className="text-[12px] font-mono fill-current stroke-none opacity-30">
            <text x="1550" y="50" textAnchor="end">HIGH: 1.25890</text>
            <text x="1550" y="70" textAnchor="end">LOW: 1.24120</text>
            <text x="50" y="850">VOLUME_SIGMA_DELTA: 45.2k</text>
          </g>
        </svg>
      </div>

      {/* FIBONACCI GOLDEN SPIRAL - CENTRAL ELEMENT */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] dark:opacity-[0.12]">
        <svg viewBox="0 0 1000 1000" className="w-[120vh] h-[120vh] text-slate-900 dark:text-white fill-none stroke-current" strokeWidth="0.8">
          <path d="M 500,500 
                   A 31,31 0 0 1 469,531 
                   A 31,31 0 0 1 438,500 
                   A 62,62 0 0 1 500,438 
                   A 93,93 0 0 1 593,531 
                   A 155,155 0 0 1 438,686 
                   A 248,248 0 0 1 190,438 
                   A 403,403 0 0 1 593,35 
                   A 651,651 0 0 1 1244,686" 
                strokeDasharray="10,5" 
          />
          <rect x="469" y="500" width="31" height="31" />
          <rect x="438" y="500" width="31" height="31" />
          <rect x="438" y="438" width="62" height="62" />
          <rect x="500" y="438" width="93" height="93" />
          <rect x="438" y="531" width="155" height="155" />
          <rect x="190" y="438" width="248" height="248" />
          
          <g className="text-[14px] font-mono fill-current stroke-none opacity-50">
            <text x="510" y="490">Φ = 1.618</text>
            <text x="100" y="900">CONVERGENCE_ZONE_BETA</text>
          </g>
        </svg>
      </div>

      {/* BEAR - TECHNICAL SKETCH (LEFT) */}
      <div className="absolute left-[-10%] top-[15%] w-[45vw] h-[70vh] opacity-[0.08] dark:opacity-[0.12]">
        <svg viewBox="0 0 800 1000" className="w-full h-full text-slate-900 dark:text-white fill-none stroke-current" strokeWidth="1">
          <path d="M400,200 L550,250 L600,450 L550,700 L400,850 L250,700 L200,450 L250,250 Z" />
          <path d="M250,250 L400,350 L550,250" />
          <path d="M400,350 L400,550" />
          <path d="M300,550 L400,500 L500,550 L500,750 L400,850 L300,750 Z" />
          <path d="M250,250 L180,180 L300,220" />
          <path d="M550,250 L620,180 L500,220" />
          <text x="210" y="440" className="text-[14px] font-mono fill-current stroke-none opacity-60">SHORT_BIAS_ALPHA</text>
        </svg>
      </div>

      {/* BULL - TECHNICAL SKETCH (RIGHT) */}
      <div className="absolute right-[-10%] bottom-[10%] w-[45vw] h-[70vh] opacity-[0.08] dark:opacity-[0.12]">
        <svg viewBox="0 0 800 1000" className="w-full h-full text-slate-900 dark:text-white fill-none stroke-current" strokeWidth="1">
          <path d="M300,300 L500,300 L600,500 L550,800 L300,900 L150,650 L200,450 Z" />
          <path d="M300,300 L100,100 L250,250 Z" />
          <path d="M500,300 L750,150 L550,280 Z" />
          <path d="M300,300 L400,450 L500,300" />
          <path d="M280,450 L350,480 L320,520 Z" />
          <path d="M520,450 L450,480 L480,520 Z" />
          <text x="500" y="850" className="text-[14px] font-mono fill-current stroke-none opacity-60">LONG_EXP_DELTA</text>
        </svg>
      </div>

      {/* GRADIENT OVERLAYS FOR DEPTH */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 dark:from-[#04070F]/20 via-transparent to-white/10 dark:to-[#04070F]/20"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-white dark:from-[#04070F] via-transparent to-white dark:to-[#04070F] opacity-90"></div>
    </div>
  );
};

export default BackgroundArt;
