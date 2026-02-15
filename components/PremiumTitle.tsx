
import React from 'react';

type GradientVariant = 'primary' | 'secondary' | 'profit' | 'loss' | 'neutral';

interface PremiumTitleProps {
  children: React.ReactNode;
  variant?: GradientVariant;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span';
  withShine?: boolean;
  withGlow?: boolean;
  withParallax?: boolean; // Kept in interface to prevent breaking existing call sites, but effect is removed
}

const PremiumTitle: React.FC<PremiumTitleProps> = ({
  children,
  variant = 'primary',
  className = '',
  as: Tag = 'h1',
  withShine = true,
  withGlow = true,
}) => {
  const gradients: Record<GradientVariant, string> = {
    primary: 'from-blue-600 via-indigo-400 to-purple-600',
    secondary: 'from-blue-400 via-cyan-300 to-blue-500',
    profit: 'from-emerald-400 via-teal-300 to-emerald-600',
    loss: 'from-rose-400 via-pink-400 to-rose-600',
    neutral: 'from-slate-400 via-slate-200 to-slate-500'
  };

  const glows: Record<GradientVariant, string> = {
    primary: 'animate-[text-glow-blue_6s_infinite]',
    secondary: 'animate-[text-glow-blue_6s_infinite]',
    profit: 'animate-[text-glow-emerald_6s_infinite]',
    loss: 'animate-[text-glow-rose_6s_infinite]',
    neutral: ''
  };

  return (
    <div className={`inline-block ${className}`}>
      <Tag className={`
        premium-title-base
        bg-clip-text text-transparent
        bg-gradient-to-r ${gradients[variant]}
        ${withShine ? 'premium-shine' : ''}
        ${withGlow ? glows[variant] : ''}
        font-black tracking-tighter uppercase
      `}>
        {children}
      </Tag>
    </div>
  );
};

export default PremiumTitle;
