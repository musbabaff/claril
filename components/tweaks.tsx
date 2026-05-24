'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// ── Accent palette ──────────────────────────────────────────────────────────
export const ACCENTS = {
  gold:   { base: '0.78 0.13 78',  ink: '0.45 0.10 76',  soft: '0.96 0.04 82',  glow: '0.78 0.13 78 / 0.22',  hex: '#D7A547' },
  teal:   { base: '0.72 0.11 195', ink: '0.40 0.08 200', soft: '0.95 0.03 200', glow: '0.72 0.11 195 / 0.22',  hex: '#3BB0B5' },
  velvet: { base: '0.55 0.18 310', ink: '0.36 0.13 308', soft: '0.95 0.03 310', glow: '0.55 0.18 310 / 0.24',  hex: '#7C3FB0' },
  forest: { base: '0.60 0.14 155', ink: '0.36 0.11 155', soft: '0.95 0.03 155', glow: '0.60 0.14 155 / 0.22',  hex: '#3F9F6B' },
} as const;

export type AccentName = keyof typeof ACCENTS;

export const TYPE_SETS = {
  'serif-grotesk': {
    display: '"Newsreader", Georgia, serif',
    sans: '"Geist", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  'all-grotesk': {
    display: '"Geist", ui-sans-serif, system-ui',
    sans: '"Geist", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  'editorial': {
    display: '"Newsreader", "Charter", serif',
    sans: '"Newsreader", Georgia, serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  'mono-heavy': {
    display: '"JetBrains Mono", ui-monospace',
    sans: '"Geist", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
} as const;

export type TypeSetName = keyof typeof TYPE_SETS;

export interface TweakValues {
  accent: AccentName;
  theme: 'light' | 'dark';
  typeSet: TypeSetName;
  heroLayout: 'centered' | 'asymmetric' | 'split';
}

const DEFAULTS: TweakValues = {
  accent: 'gold',
  theme: 'light',
  typeSet: 'serif-grotesk',
  heroLayout: 'centered',
};

// ── Apply tokens to DOM ─────────────────────────────────────────────────────
export function applyTokens(t: Partial<TweakValues>) {
  if (typeof document === 'undefined') return;
  const a = ACCENTS[(t.accent ?? 'gold') as AccentName] ?? ACCENTS.gold;
  const ts = TYPE_SETS[(t.typeSet ?? 'serif-grotesk') as TypeSetName] ?? TYPE_SETS['serif-grotesk'];
  const r = document.documentElement;
  r.style.setProperty('--accent',      `oklch(${a.base})`);
  r.style.setProperty('--accent-ink',  `oklch(${a.ink})`);
  r.style.setProperty('--accent-soft', `oklch(${a.soft})`);
  r.style.setProperty('--accent-glow', `oklch(${a.glow})`);
  r.style.setProperty('--f-display',   ts.display);
  r.style.setProperty('--f-sans',      ts.sans);
  r.style.setProperty('--f-mono',      ts.mono);
  const isDark = t.theme === 'dark';
  r.setAttribute('data-theme', isDark ? 'dark' : 'light');
  if (isDark) r.classList.add('dark');
  else r.classList.remove('dark');
}

// ── Context ─────────────────────────────────────────────────────────────────
interface TweaksContextType {
  tweaks: TweakValues;
  setTweak: <K extends keyof TweakValues>(key: K, value: TweakValues[K]) => void;
}

const TweaksContext = createContext<TweaksContextType>({
  tweaks: DEFAULTS,
  setTweak: () => {},
});

export function TweaksProvider({ children }: { children: React.ReactNode }) {
  const [tweaks, setTweaks] = useState<TweakValues>(DEFAULTS);

  const setTweak = useCallback(<K extends keyof TweakValues>(key: K, value: TweakValues[K]) => {
    setTweaks(prev => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    applyTokens(tweaks);
  }, [tweaks]);

  return (
    <TweaksContext.Provider value={{ tweaks, setTweak }}>
      {children}
    </TweaksContext.Provider>
  );
}

export function useTweaks() {
  return useContext(TweaksContext);
}

// ── Floating Tweaks Panel ───────────────────────────────────────────────────
export function TweaksPanel() {
  const { tweaks, setTweak } = useTweaks();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 16, y: 16 });

  const clamp = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const PAD = 16;
    const maxR = Math.max(PAD, window.innerWidth - w - PAD);
    const maxB = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxR, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxB, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right  = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  useEffect(() => {
    if (!open) return;
    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, [open, clamp]);

  const onDragStart = (e: React.MouseEvent) => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startR = window.innerWidth - rect.right;
    const startB = window.innerHeight - rect.bottom;
    const move = (ev: MouseEvent) => {
      offsetRef.current = {
        x: startR - (ev.clientX - sx),
        y: startB - (ev.clientY - sy),
      };
      clamp();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 16, right: open ? 312 : 16, zIndex: 2147483645,
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--surface)', border: '1px solid var(--hairline-2)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'right 0.2s ease',
          color: 'var(--muted)',
          fontSize: 15,
        }}
        aria-label="Open tweaks panel"
        title="Tweaks"
      >
        ⚙
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed', right: 16, bottom: 16, zIndex: 2147483646,
            width: 280, maxHeight: 'calc(100vh - 32px)',
            display: 'flex', flexDirection: 'column',
            background: 'rgba(250,249,247,.92)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border: '.5px solid rgba(255,255,255,.6)',
            borderRadius: 14,
            boxShadow: '0 1px 0 rgba(255,255,255,.5) inset, 0 12px 40px rgba(0,0,0,.18)',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSize: 11.5,
            color: '#29261b',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            onMouseDown={onDragStart}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 8px 10px 14px', cursor: 'move', userSelect: 'none',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <b style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.01em' }}>Tweaks</b>
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={() => setOpen(false)}
              style={{
                width: 22, height: 22, borderRadius: 6, border: 0,
                background: 'transparent', cursor: 'pointer', fontSize: 13,
                color: 'rgba(41,38,27,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Close tweaks"
            >✕</button>
          </div>

          {/* Body */}
          <div style={{ padding: '2px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
            {/* Theme */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(41,38,27,.45)', paddingTop: 10 }}>Theme</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(41,38,27,.72)' }}><span style={{ fontWeight: 500 }}>Mode</span></div>
              <div style={{ display: 'flex', borderRadius: 8, background: 'rgba(0,0,0,.06)', padding: 2, gap: 0 }}>
                {(['light', 'dark'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setTweak('theme', m)}
                    style={{
                      flex: 1, height: 22, borderRadius: 6, border: 0, cursor: 'pointer',
                      background: tweaks.theme === m ? 'rgba(255,255,255,.9)' : 'transparent',
                      fontWeight: 500, fontSize: 11, fontFamily: 'inherit',
                      boxShadow: tweaks.theme === m ? '0 1px 2px rgba(0,0,0,.12)' : 'none',
                      color: 'inherit',
                    }}
                  >{m}</button>
                ))}
              </div>
            </div>

            {/* Accent */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ color: 'rgba(41,38,27,.72)', fontWeight: 500 }}>Accent</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(Object.entries(ACCENTS) as [AccentName, typeof ACCENTS.gold][]).map(([name, a]) => (
                  <button
                    key={name}
                    onClick={() => setTweak('accent', name)}
                    title={name}
                    style={{
                      flex: 1, height: 46, borderRadius: 6, border: 0, cursor: 'pointer',
                      background: a.hex,
                      boxShadow: tweaks.accent === name
                        ? '0 0 0 2px rgba(0,0,0,.85), 0 2px 6px rgba(0,0,0,.15)'
                        : '0 0 0 .5px rgba(0,0,0,.12)',
                      transition: 'transform .12s, box-shadow .12s',
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    aria-label={name}
                  >
                    {tweaks.accent === name && (
                      <svg viewBox="0 0 14 14" width={14} height={14} aria-hidden>
                        <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" stroke="rgba(0,0,0,0.7)" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(41,38,27,.45)', paddingTop: 6 }}>Typography</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ color: 'rgba(41,38,27,.72)', fontWeight: 500 }}>Type set</div>
              <select
                value={tweaks.typeSet}
                onChange={e => setTweak('typeSet', e.target.value as TypeSetName)}
                style={{
                  appearance: 'none', width: '100%', height: 26, padding: '0 8px',
                  border: '.5px solid rgba(0,0,0,.1)', borderRadius: 7,
                  background: 'rgba(255,255,255,.6)', fontFamily: 'inherit', fontSize: 11.5,
                  color: 'inherit', cursor: 'pointer', outline: 'none',
                }}
              >
                {(Object.keys(TYPE_SETS) as TypeSetName[]).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Hero layout */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(41,38,27,.45)', paddingTop: 6 }}>Hero</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ color: 'rgba(41,38,27,.72)', fontWeight: 500 }}>Layout</div>
              <div style={{ display: 'flex', borderRadius: 8, background: 'rgba(0,0,0,.06)', padding: 2, gap: 0 }}>
                {(['centered', 'asymmetric', 'split'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setTweak('heroLayout', l)}
                    style={{
                      flex: 1, height: 22, borderRadius: 6, border: 0, cursor: 'pointer',
                      background: tweaks.heroLayout === l ? 'rgba(255,255,255,.9)' : 'transparent',
                      fontWeight: 500, fontSize: 10, fontFamily: 'inherit',
                      boxShadow: tweaks.heroLayout === l ? '0 1px 2px rgba(0,0,0,.12)' : 'none',
                      color: 'inherit', overflowWrap: 'anywhere',
                    }}
                  >{l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
