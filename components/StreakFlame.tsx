
import React from 'react';

interface StreakFlameProps {
  count: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const StreakFlame: React.FC<StreakFlameProps> = ({ count, size = 'md' }) => {
  const getFlameClass = () => {
    if (count >= 30) return 'text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-pulse scale-125';
    if (count >= 14) return 'text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.6)] animate-pulse';
    if (count >= 7) return 'text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.4)]';
    return 'text-orange-300';
  };

  const sizes = {
    sm: 'w-4 h-4 text-sm',
    md: 'w-6 h-6 text-base',
    lg: 'w-10 h-10 text-2xl',
    xl: 'w-20 h-20 text-5xl',
  };

  return (
    <div className={`flex items-center space-x-1 font-black ${getFlameClass()}`}>
      <svg className={`${sizes[size as keyof typeof sizes].split(' ')[0]} ${sizes[size as keyof typeof sizes].split(' ')[1]}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2c0 1.88-1.57 3.42-3.41 3.5-1.59.07-2.61.42-3.43 1.34-1.07 1.2-1.39 3.01-.81 4.54.49 1.3.16 2.37-.9 3.19C2.4 15.4 2 16.7 2 18c0 3.31 2.69 6 6 6 1.49 0 2.85-.54 3.91-1.44C13.06 23.46 14.42 24 16 24c3.31 0 6-2.69 6-6 0-1.88-1.57-3.42-3.41-3.5-1.59-.07-2.61-.42-3.43-1.34-1.07-1.2-1.39-3.01-.81-4.54.49-1.3.16-2.37-.9-3.19-.3-.23-.5-.46-.66-.69C12.44 3.4 12 2.7 12 2z" />
      </svg>
      {count > 0 && <span className={sizes[size as keyof typeof sizes].split(' ')[2]}>{count}</span>}
    </div>
  );
};

export default StreakFlame;
