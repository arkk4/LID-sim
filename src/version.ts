export interface AppVersionInfo {
  version: string;
  codename: string;
  releaseDate: string;
  coatOfArmsSrc: string;
  coatOfArmsFallback: string;
}

// Безпечне отримання BASE_URL (працює і в браузері, і в Node.js під час білду)
const baseUrl = import.meta.env?.BASE_URL || './';

export const APP_VERSION_CONFIG: AppVersionInfo = {
  version: 'v2026.10.08-2',
  codename: 'Dortmund',
  releaseDate: '2026-10-08',
  coatOfArmsSrc: `${baseUrl}badge.svg`,
  coatOfArmsFallback: '',
};