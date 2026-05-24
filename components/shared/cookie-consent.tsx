'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { translate } from '@/lib/i18n';

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    // Check if user already consented
    const consent = localStorage.getItem('claril_cookie_consent');
    if (!consent) {
      // Small timeout for premium overlay experience
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sync language selection for localization
  useEffect(() => {
    const syncLang = () => {
      const saved = localStorage.getItem('claril_lang') || 'EN';
      if (saved === 'AZ') setLanguage('Azerbaijani');
      else if (saved === 'TR') setLanguage('Turkish');
      else setLanguage('English');
    };
    syncLang();
    window.addEventListener('claril_lang_change', syncLang);
    return () => window.removeEventListener('claril_lang_change', syncLang);
  }, []);

  const handleConsent = (level: 'accepted' | 'declined') => {
    localStorage.setItem('claril_cookie_consent', level);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[100] p-4 rounded-xl border border-border-subtle bg-bg-surface-2/95 backdrop-blur-md shadow-2xl flex flex-col gap-3 animate-[fadeInUp_0.4s_cubic-bezier(0.16,1,0.3,1)]">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-accent/15 text-accent shrink-0 mt-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-text-primary">Cookie Security Consent</h4>
          <p className="text-[10px] text-text-muted leading-relaxed">
            {translate('cookieText', language)}{' '}
            <Link href="/privacy" className="text-accent hover:underline font-medium">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={() => handleConsent('declined')}
          className="px-3 py-1.5 rounded-md text-[10px] font-medium text-text-muted hover:text-text-primary hover:bg-bg-surface-2 transition-colors border border-transparent"
        >
          {translate('cookieDecline', language)}
        </button>
        <button
          onClick={() => handleConsent('accepted')}
          className="btn btn-primary px-3.5 py-1.5 rounded-md text-[10px] font-medium shadow-[0_0_8px_rgba(20,110,245,0.15)]"
        >
          {translate('cookieAccept', language)}
        </button>
      </div>
    </div>
  );
}
