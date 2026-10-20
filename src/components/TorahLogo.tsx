"use client";

import { useId } from "react";

type LogoSize = "xs" | "sm" | "md" | "lg" | "hero";

const SIZE: Record<LogoSize, string> = {
  xs: "h-7 w-7",
  sm: "h-11 w-11",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  hero: "h-36 w-36",
};

export function TorahLogo({
  size = "md",
  className = "",
  title = "תורה דיליה",
}: {
  size?: LogoSize;
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const bg = `bg${uid}`;
  const gold = `gold${uid}`;
  const glow = `glow${uid}`;
  const shadow = `sh${uid}`;

  return (
    <div className={`logo-float relative shrink-0 select-none ${SIZE[size]} ${className}`}>
      <div className="logo-halo" />
      <div className="logo-ring" />
      <svg
        viewBox="0 0 512 512"
        className="relative h-full w-full overflow-visible drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
      >
        <defs>
          <radialGradient id={bg} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1e3567" />
            <stop offset="65%" stopColor="#0e1b38" />
            <stop offset="100%" stopColor="#070d1e" />
          </radialGradient>
          <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff2b2" />
            <stop offset="28%" stopColor="#e5be53" />
            <stop offset="70%" stopColor="#c59623" />
            <stop offset="100%" stopColor="#8a610f" />
          </linearGradient>
          <radialGradient id={glow} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f7d468" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c59623" stopOpacity="0" />
          </radialGradient>
          <filter id={shadow} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        <rect x="16" y="16" width="480" height="480" rx="100" fill={`url(#${bg})`} stroke={`url(#${gold})`} strokeWidth="12" filter={`url(#${shadow})`} />
        <rect x="36" y="36" width="440" height="440" rx="84" fill="none" stroke={`url(#${gold})`} strokeWidth="2.5" strokeDasharray="8 6" opacity="0.8" />
        <circle cx="256" cy="256" r="180" fill={`url(#${glow})`} />

        <g filter={`url(#${shadow})`}>
          <path d="M 180 180 Q 256 166 332 180 L 324 196 Q 256 182 188 196 Z" fill={`url(#${gold})`} />
          <circle cx="210" cy="188" r="4" fill="#fff" />
          <circle cx="256" cy="184" r="5.5" fill="#e11d48" />
          <circle cx="302" cy="188" r="4" fill="#fff" />
          <path d="M 180 180 L 170 135 L 210 160 L 256 110 L 302 160 L 342 135 L 332 180 Q 256 166 180 180 Z" fill={`url(#${gold})`} stroke="#664609" strokeWidth="2" />
          <circle cx="170" cy="132" r="7" fill={`url(#${gold})`} />
          <circle cx="210" cy="157" r="6" fill={`url(#${gold})`} />
          <circle cx="256" cy="107" r="9" fill="#fff" stroke={`url(#${gold})`} strokeWidth="2.5" />
          <circle cx="302" cy="157" r="6" fill={`url(#${gold})`} />
          <circle cx="342" cy="132" r="7" fill={`url(#${gold})`} />
        </g>

        <g filter={`url(#${shadow})`}>
          <path d="M 256 235 L 256 365" stroke="#78500c" strokeWidth="6" />
          <path d="M 256 235 C 215 220 165 220 120 230 C 114 231 110 236 110 242 L 110 355 C 110 361 115 366 121 365 C 165 352 215 352 256 368 Z" fill="#fff" stroke={`url(#${gold})`} strokeWidth="5" />
          {[260, 280, 300, 320].map((y) => (
            <line key={`l${y}`} x1="140" y1={y} x2="235" y2={y - 8} stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
          ))}
          <line x1="155" y1="340" x2="220" y2="332" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 256 235 C 297 220 347 220 392 230 C 398 231 402 236 402 242 L 402 355 C 402 361 397 366 391 365 C 347 352 297 352 256 368 Z" fill="#fff" stroke={`url(#${gold})`} strokeWidth="5" />
          {[252, 272, 292, 312].map((y) => (
            <line key={`r${y}`} x1="277" y1={y} x2="372" y2={y + 8} stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
          ))}
          <line x1="292" y1="332" x2="357" y2="340" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 254 235 L 254 395 L 256 385 L 258 395 L 258 235 Z" fill={`url(#${gold})`} />
        </g>

        <g filter={`url(#${shadow})`}>
          <rect x="110" y="398" width="292" height="52" rx="14" fill="#0f1d38" stroke={`url(#${gold})`} strokeWidth="3.5" />
          <text x="256" y="434" fontFamily="'Frank Ruhl Libre','David','FrankRuehl','Times New Roman',serif" fontWeight="900" fontSize="28" fill={`url(#${gold})`} textAnchor="middle" letterSpacing="2">
            תורה דיליה
          </text>
        </g>

        <path d="M 120 160 L 124 172 L 136 176 L 124 180 L 120 192 L 116 180 L 104 176 L 116 172 Z" fill={`url(#${gold})`} opacity="0.9" />
        <path d="M 392 160 L 396 172 L 408 176 L 396 180 L 392 192 L 388 180 L 376 176 L 388 172 Z" fill={`url(#${gold})`} opacity="0.9" />
      </svg>
    </div>
  );
}
