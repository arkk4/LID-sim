import versionData from '../version.json';

export interface AppVersionInfo {
  version: string;
  codename: string;
  releaseDate: string;
  logoSrc: string;
  badgeSrc: string;
  coatOfArmsSrc: string;
  coatOfArmsFallback: string;
}

// Безпечне отримання BASE_URL (працює і в браузері, і в Node.js під час білду)
const baseUrl = import.meta.env?.BASE_URL || './';

export const APP_VERSION_CONFIG: AppVersionInfo = {
  version: `v${versionData.version}`,
  codename: versionData.codename,
  releaseDate: versionData.date,
  logoSrc: `${baseUrl}logo.png`,
  badgeSrc: `${baseUrl}badge.svg`,
  coatOfArmsSrc: `${baseUrl}logo.png`,
  coatOfArmsFallback: '',
};