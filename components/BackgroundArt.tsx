
import React from 'react';

const BackgroundArt: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden transition-colors duration-700">
      {/* Bear Illustration - Left Side */}
      <svg 
        className="absolute left-[-10%] top-[5%] h-[90%] w-[50vw] opacity-[0.08] text-slate-950 dark:text-white transition-colors duration-700" 
        viewBox="0 0 100 100" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="0.08"
      >
        {/* Abstract Geometric Bear Body */}
        <path d="M5,40 L25,30 L55,35 L70,55 L60,85 L30,90 L10,75 Z" />
        <path d="M25,30 L30,15 L45,12 L55,35" /> {/* Shoulder/Hump */}
        <path d="M5,40 L12,45 L15,65 L10,75" /> {/* Head/Snout area */}
        
        {/* Technical Internal Facets */}
        <line x1="25" y1="30" x2="30" y2="90" />
        <line x1="55" y1="35" x2="30" y2="90" />
        <line x1="12" y1="45" x2="55" y2="35" />
        <line x1="12" y1="45" x2="30" y2="30" />
        <line x1="15" y1="65" x2="30" y2="90" />
        <line x1="70" y1="55" x2="30" y2="90" />
        
        {/* Abstract Grid Overlays */}
        <circle cx="35" cy="45" r="30" strokeDasharray="1,1" strokeWidth="0.03" />
        <rect x="5" y="10" width="80" height="80" strokeWidth="0.02" strokeDasharray="2,2" />
      </svg>

      {/* Bull Illustration - Right Side */}
      <svg 
        className="absolute right-[-10%] bottom-[5%] h-[90%] w-[50vw] opacity-[0.08] text-slate-950 dark:text-white transition-colors duration-700" 
        viewBox="0 0 100 100" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="0.08"
      >
        {/* Abstract Geometric Bull Body */}
        <path d="M95,60 L75,70 L45,65 L30,45 L40,15 L70,10 L90,25 Z" />
        <path d="M40,15 L25,5 L15,10 L30,45" /> {/* Horns/Neck */}
        <path d="M95,60 L85,90 L70,95 L45,65" /> {/* Hind legs/Rear */}
        
        {/* Technical Internal Facets */}
        <line x1="75" y1="70" x2="70" y2="10" />
        <line x1="45" y1="65" x2="70" y2="10" />
        <line x1="30" y1="45" x2="70" y2="10" />
        <line x1="25" y1="5" x2="70" y2="10" />
        <line x1="40" y1="15" x2="70" y2="10" />
        <line x1="95" y1="60" x2="70" y2="10" />
        
        {/* Abstract Grid Overlays */}
        <circle cx="60" cy="50" r="35" strokeDasharray="1,1" strokeWidth="0.03" />
        <rect x="15" y="5" width="80" height="90" strokeWidth="0.02" strokeDasharray="2,2" />
      </svg>
    </div>
  );
};

export default BackgroundArt;
