// lib/i18n.ts

export type Locale = 'EN' | 'AZ' | 'TR';

export const LOCALES: Record<Locale, { name: string; flag: string }> = {
  EN: { name: 'English', flag: '🇬🇧' },
  AZ: { name: 'Azərbaycan', flag: '🇦🇿' },
  TR: { name: 'Türkçe', flag: '🇹🇷' },
};

export const DICTIONARY: Record<string, Record<Locale, string>> = {
  // Navigation
  dashboard: { EN: 'Dashboard', AZ: 'İdarə Paneli', TR: 'Panel' },
  cases: { EN: 'Cases', AZ: 'İşlər', TR: 'Davalar' },
  agents: { EN: 'Agents Pool', AZ: 'Agentlər Bazası', TR: 'Ajan Havuzu' },
  settings: { EN: 'Settings', AZ: 'Tənzimləmələr', TR: 'Ayarlar' },
  
  // Headers & Page Titles
  casesLedger: { EN: 'Cases Ledger', AZ: 'İşlərin Reyestri', TR: 'Dava Defteri' },
  agentsPool: { EN: 'Cognitive Agents Pool', AZ: 'Koqnitiv Agentlər Bazası', TR: 'Bilişsel Ajan Havuzu' },
  newCase: { EN: 'New Case Wizard', AZ: 'Yeni İş Sihirbazı', TR: 'Yeni Dava Sihirbazı' },
  
  // Case Detail Tabs
  details: { EN: 'Details', AZ: 'Təfərrüatlar', TR: 'Detaylar' },
  extraction: { EN: 'Extraction', AZ: 'Ekstraksiya', TR: 'Veri Çıkarımı' },
  analysis: { EN: 'Cognitive Analysis', AZ: 'Koqnitiv Analiz', TR: 'Bilişsel Analiz' },
  chat: { EN: 'Case Copilot', AZ: 'İş Köməkçisi', TR: 'Dava Yardımcısı' },
  counterfactual: { EN: 'What-If Simulator', AZ: 'Ssenari Simulyatoru', TR: 'What-If Simülatörü' },

  // Buttons & Actions
  runAnalysis: { EN: 'Run Analysis', AZ: 'Analizi Başlat', TR: 'Analizi Çalıştır' },
  exportJson: { EN: 'Export JSON', AZ: 'JSON İxrac Et', TR: 'JSON Dışa Aktar' },
  runAgain: { EN: 'Run Again', AZ: 'Yenidən Başlat', TR: 'Tekrar Çalıştır' },
  createCase: { EN: 'Create Case', AZ: 'İş Yarat', TR: 'Dava Oluştur' },
  voiceInput: { EN: 'Voice Intake', AZ: 'Səslə Giriş', TR: 'Sesli Alım' },
  micStart: { EN: 'Start Recording', AZ: 'Yazmağı Başlat', TR: 'Kaydı Başlat' },
  micStop: { EN: 'Stop Recording', AZ: 'Yazmağı Dayandır', TR: 'Kaydı Durdur' },
  simulate: { EN: 'Simulate Scenario', AZ: 'Ssenarini Simulyasiya Et', TR: 'Senaryoyu Simüle Et' },

  // Case Metadata labels
  subjectName: { EN: 'Subject Name', AZ: 'Mövzu Adı', TR: 'Konu Adı' },
  primaryValue: { EN: 'Primary Value', AZ: 'Əsas Dəyər', TR: 'Birincil Değer' },
  description: { EN: 'Case Description', AZ: 'İşin Təsviri', TR: 'Dava Açıklaması' },
  caseReference: { EN: 'Case Reference', AZ: 'İşin Referansı', TR: 'Dava Referansı' },
  status: { EN: 'Status', AZ: 'Status', TR: 'Durum' },
  createdAt: { EN: 'Created At', AZ: 'Yaradılma Tarixi', TR: 'Oluşturulma Tarihi' },
  filesCount: { EN: 'Files', AZ: 'Sənədlər', TR: 'Belgeler' },
  storageSize: { EN: 'Storage', AZ: 'Yaddaş', TR: 'Depolama' },
  apiCost: { EN: 'API Cost', AZ: 'API Xərci', TR: 'API Maliyeti' },
  avgLatency: { EN: 'Avg. Latency', AZ: 'Ort. Gecikmə', TR: 'Ort. Gecikme' },

  // Messages
  dropFiles: { EN: 'Drag & drop documents here or click to select', AZ: 'Sənədləri bura sürükləyin və ya seçmək üçün klikləyin', TR: 'Belgeleri buraya sürükleyip bırakın veya seçmek için tıklayın' },
  noDocsAttached: { EN: 'No documents attached yet', AZ: 'Hələ heç bir sənəd əlavə edilməyib', TR: 'Henüz belge eklenmemiş' },
  uploadingDocs: { EN: 'Uploading documents...', AZ: 'Sənədlər yüklənir...', TR: 'Belgeler yükleniyor...' },
  cookieText: { 
    EN: 'Claril uses cookies to guarantee a premium, glassmorphic analytics experience.', 
    AZ: 'Claril premium, şüşəvari analitika təcrübəsini təmin etmək üçün kuki fayllarından istifadə edir.', 
    TR: 'Claril, premium, cam görünümlü analitik deneyimini garanti etmek için çerezleri kullanır.' 
  },
  cookieAccept: { EN: 'Accept', AZ: 'Qəbul Et', TR: 'Kabul Et' },
  cookieDecline: { EN: 'Decline', AZ: 'İmtina Et', TR: 'Reddet' },
  cookiePreferences: { EN: 'Preferences', AZ: 'Tərcihlər', TR: 'Tercihler' },
};

/**
 * Translatable string lookup helper.
 * Fallbacks cleanly to English if key is missing or locale mapping doesn't exist.
 */
export function translate(key: string, lang: string): string {
  // Map standard long names back to Locale symbols
  let locale: Locale = 'EN';
  if (lang === 'Azerbaijani' || lang === 'AZ') locale = 'AZ';
  else if (lang === 'Turkish' || lang === 'TR') locale = 'TR';

  const entry = DICTIONARY[key];
  if (!entry) return key;

  return entry[locale] || entry['EN'] || key;
}

export function getFullLanguageName(locale: Locale): string {
  if (locale === 'AZ') return 'Azerbaijani';
  if (locale === 'TR') return 'Turkish';
  return 'English';
}
