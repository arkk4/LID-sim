export interface AppVersionInfo {
  version: string;
  codename: string;
  releaseDate: string;
  coatOfArmsSrc: string;
  coatOfArmsFallback: string;
}

export const APP_VERSION_CONFIG: AppVersionInfo = {
  version: 'v2026.10.07',
  codename: 'Essen',
  releaseDate: '2026-10-07',
  coatOfArmsSrc: 'Assets/coats/essen.svg',
  coatOfArmsFallback: 'essen.svg',
};
