import * as React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="logo-cyan" x1="8" y1="8" x2="18" y2="13" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00C8FF" />
          <stop offset="100%" stopColor="#008BB2" />
        </linearGradient>
        <linearGradient id="logo-bridge" x1="14" y1="13" x2="18" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="100%" stopColor="#00C8FF" />
        </linearGradient>
        <linearGradient id="logo-bottom" x1="14" y1="19" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#008BB2" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00C8FF" />
        </linearGradient>
      </defs>
      {/* Top Segment */}
      <path d="M8 8h10l-4 5H8z" fill="url(#logo-cyan)" />
      {/* Middle Bridge */}
      <path d="M14 13h10l-6 6H8z" fill="url(#logo-bridge)" />
      {/* Bottom Segment */}
      <path d="M14 19h10l-4 5H14z" fill="url(#logo-bottom)" />
    </svg>
  );
}
