import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const Icon = {
  Logo: ({ size = 22, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path d="M16 3.5 L27 9.5 L27 22.5 L16 28.5 L5 22.5 L5 9.5 Z"
            stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="3.2" fill="currentColor" />
      <path d="M16 9.5 L16 12.8 M22.5 13 L19.2 14.6 M22.5 19 L19.2 17.4 M16 22.5 L16 19.2 M9.5 19 L12.8 17.4 M9.5 13 L12.8 14.6"
            stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <circle cx="16" cy="9" r="1.3" fill="currentColor" />
      <circle cx="23" cy="13" r="1.3" fill="currentColor" />
      <circle cx="23" cy="19" r="1.3" fill="currentColor" />
      <circle cx="16" cy="23" r="1.3" fill="currentColor" />
      <circle cx="9" cy="19" r="1.3" fill="currentColor" />
      <circle cx="9" cy="13" r="1.3" fill="currentColor" />
    </svg>
  ),
  Arrow: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ArrowUR: ({ size = 12, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M5 11L11 5M11 5H6M11 5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Check: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Doc: ({ size = 22, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6 3h8l4 4v14H6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9 11h6M9 14h6M9 17h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.55"/>
    </svg>
  ),
  DocInvoice: ({ size = 22, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6 3h8l4 4v14H6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9 11h6M9 14h6M9 17h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.55"/>
      <circle cx="16.5" cy="17" r="1.4" stroke="currentColor" strokeWidth="1" opacity="0.55"/>
    </svg>
  ),
  DocBank: ({ size = 22, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="4" y="9" width="16" height="11" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 9 L12 4 L21 9" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7 12v4M12 12v4M17 12v4M4 19h16" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
    </svg>
  ),
  Upload: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M8 11V3M5 6l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  Lock: ({ size = 16, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  Hash: ({ size = 16, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M3 6h10M3 10h10M6 3l-1 10M11 3l-1 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Grid: ({ size = 16, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="4.5" height="4.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8.5" y="3" width="4.5" height="4.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="3" y="8.5" width="4.5" height="4.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8.5" y="8.5" width="4.5" height="4.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  Loop: ({ size = 16, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M13 6a5 5 0 10-1 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M13 3v3h-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Bolt: ({ size = 16, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M9 2L3 9h4l-1 5 6-7H8l1-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  Sun: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  Moon: ({ size = 14, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M13 9.5A5.5 5.5 0 016.5 3 5 5 0 1013 9.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  Sparkle: ({ size = 12, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  Code: ({ size = 16, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M5 5l-3 3 3 3M11 5l3 3-3 3M9 3l-2 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Shield: ({ size = 16, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M8 2l5 2v4c0 3-2.5 5.5-5 6-2.5-.5-5-3-5-6V4l5-2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  Branch: ({ size = 16, ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="4" cy="3.5" r="1.4" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="4" cy="12.5" r="1.4" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="12" cy="6.5" r="1.4" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4 5v6M5.4 6.5h2.6a2 2 0 002-2V5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
};
