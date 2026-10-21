import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-500 to-purple-600 rounded-xl blur-sm opacity-60 dark:opacity-80 animate-pulse" />
        
        {/* Shield & Network Vector */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-md"
        >
          {/* Shield Outline */}
          <path
            d="M24 4L7 11V22C7 32.5 14.3 42.2 24 45C33.7 42.2 41 32.5 41 22V11L24 4Z"
            fill="url(#shield_grad)"
            stroke="url(#shield_border)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Network Proxy Nodes & Interconnects */}
          <circle cx="24" cy="20" r="3.5" fill="#FFFFFF" />
          <circle cx="17" cy="28" r="2.8" fill="#38BDF8" />
          <circle cx="31" cy="28" r="2.8" fill="#C084FC" />
          <circle cx="24" cy="35" r="2.5" fill="#38BDF8" />

          {/* Network Data Paths */}
          <path
            d="M24 20L17 28M24 20L31 28M17 28L24 35M31 28L24 35"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />

          {/* Center Pulse Ring */}
          <circle
            cx="24"
            cy="20"
            r="6"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            className="animate-spin origin-center"
            style={{ animationDuration: '8s' }}
          />

          <defs>
            <linearGradient id="shield_grad" x1="7" y1="4" x2="41" y2="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284C7" />
              <stop offset="0.5" stopColor="#0F172A" />
              <stop offset="1" stopColor="#7E22CE" />
            </linearGradient>
            <linearGradient id="shield_border" x1="7" y1="4" x2="41" y2="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#C084FC" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-tight ${textSizes[size]} bg-gradient-to-r from-sky-500 via-indigo-400 to-purple-500 bg-clip-text text-transparent`}>
              Proxy
            </span>
            <span className={`font-black tracking-tight ${textSizes[size]} text-slate-900 dark:text-white`}>
              Bazar
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/30">
              v2.5
            </span>
          </div>
          <span className="text-[10px] font-medium tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            Premium Proxy Network
          </span>
        </div>
      )}
    </div>
  );
};
