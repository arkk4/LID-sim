export interface AppVersionInfo {
  version: string;
  codename: string;
  releaseDate: string;
  coatOfArmsSrc: string;
  coatOfArmsFallback: string;
}

export const APP_VERSION_CONFIG: AppVersionInfo = {
  version: 'v2026.10.08-1',
  codename: 'Dortmund',
  releaseDate: '2026-10-08',
  coatOfArmsSrc: '/badge.svg',
  coatOfArmsFallback: '',
};
