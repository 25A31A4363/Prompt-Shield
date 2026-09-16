import React from 'react';

interface SecurityGaugeProps {
  score: number;
  grade: string;
  size?: number;
}

export const SecurityGauge: React.FC<SecurityGaugeProps> = ({ score, grade, size = 180 }) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  let colorClass = 'text-emerald-400 stroke-emerald-500';
  let glowClass = 'cyber-glow-emerald';
  let posture = 'HARDENED';

  if (normalizedScore < 50) {
    colorClass = 'text-rose-400 stroke-rose-500';
    glowClass = 'cyber-glow-crimson';
    posture = 'CRITICAL VULNERABILITY';
  } else if (normalizedScore < 75) {
    colorClass = 'text-amber-400 stroke-amber-500';
    glowClass = 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]';
    posture = 'ELEVATED RISK';
  } else if (normalizedScore < 90) {
    colorClass = 'text-cyan-400 stroke-cyan-500';
    glowClass = 'cyber-glow-cyan';
    posture = 'MODERATE RESILIENCE';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative flex items-center justify-center rounded-full p-2 ${glowClass}`} style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`transition-all duration-1000 ease-out ${colorClass}`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black font-mono tracking-tight text-white">{normalizedScore}</span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Security Score</span>
          <div className="mt-1 flex items-center space-x-1">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
              GRADE {grade}
            </span>
          </div>
        </div>
      </div>
      <span className="mt-3 text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
        {posture}
      </span>
    </div>
  );
};
