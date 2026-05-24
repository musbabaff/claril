'use client';

import { useState, useEffect, useRef } from 'react';
import { LOCALES, Locale } from '@/lib/i18n';

export function LanguageSwitcher() {
  const [active, setActive] = useState<Locale>('EN');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem('claril_lang') as Locale;
    if (saved && LOCALES[saved]) {
      setActive(saved);
    }
  }, []);

  // Listen to clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectLanguage = (lang: Locale) => {
    setActive(lang);
    localStorage.setItem('claril_lang', lang);
    setOpen(false);
    
    // Dispatch a global event so state-subscribers can react instantly without full reloads
    window.dispatchEvent(new Event('claril_lang_change'));
  };

  return (
    <div ref={dropdownRef} className="relative z-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle hover:border-accent bg-bg-surface-2 hover:bg-bg-surface transition-all text-xs font-medium text-text-primary"
      >
        <span>{LOCALES[active].flag}</span>
        <span>{active}</span>
        <svg
          className={`w-3 h-3 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 rounded-lg border border-border-subtle bg-bg-surface/90 backdrop-blur-md shadow-lg overflow-hidden py-1 animate-[fadeIn_0.15s_ease-out]">
          {(Object.keys(LOCALES) as Locale[]).map((loc) => {
            const isSelected = loc === active;
            return (
              <button
                key={loc}
                onClick={() => selectLanguage(loc)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-bg-surface-2 transition-colors ${
                  isSelected ? 'text-accent font-semibold bg-accent/5' : 'text-text-primary'
                }`}
              >
                <span className="text-sm">{LOCALES[loc].flag}</span>
                <span>{LOCALES[loc].name}</span>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 ml-auto text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
