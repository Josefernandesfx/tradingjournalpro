
import React, { useEffect, useState } from 'react';

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (active) {
      const p = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        size: Math.random() * 8 + 4,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
        delay: Math.random() * 2,
        duration: Math.random() * 2 + 1
      }));
      setParticles(p);
      const timer = setTimeout(() => setParticles([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[300] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animation: `fall ${p.duration}s linear ${p.delay}s forwards`
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Confetti;
