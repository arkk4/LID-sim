import { Bundesland, BundeslandCode } from '../types';

export const BUNDESLAENDER: Bundesland[] = [
  { code: 'BW', name: 'Baden-Württemberg', capital: 'Stuttgart' },
  { code: 'BY', name: 'Bayern', capital: 'München' },
  { code: 'BE', name: 'Berlin', capital: 'Berlin' },
  { code: 'BB', name: 'Brandenburg', capital: 'Potsdam' },
  { code: 'HB', name: 'Bremen', capital: 'Bremen' },
  { code: 'HH', name: 'Hamburg', capital: 'Hamburg' },
  { code: 'HE', name: 'Hessen', capital: 'Wiesbaden' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern', capital: 'Schwerin' },
  { code: 'NI', name: 'Niedersachsen', capital: 'Hannover' },
  { code: 'NW', name: 'Nordrhein-Westfalen', capital: 'Düsseldorf' },
  { code: 'RP', name: 'Rheinland-Pfalz', capital: 'Mainz' },
  { code: 'SL', name: 'Saarland', capital: 'Saarbrücken' },
  { code: 'SN', name: 'Sachsen', capital: 'Dresden' },
  { code: 'ST', name: 'Sachsen-Anhalt', capital: 'Magdeburg' },
  { code: 'SH', name: 'Schleswig-Holstein', capital: 'Kiel' },
  { code: 'TH', name: 'Thüringen', capital: 'Erfurt' }
];

export const LOCAL_IMAGE_CACHE: Record<string, string> = {
  "https://foreignvasi.com/q148.197dc41c.png": "assets/cache/q148.197dc41c_45564593.png",
  "https://foreignvasi.com/q160.5e16bedb.png": "assets/cache/q160.5e16bedb_d37855ef.png",
  "https://foreignvasi.com/q212.75bffc4d.png": "assets/cache/q212.75bffc4d_445d1c5c.png",
  "https://foreignvasi.com/q26.48d9065a.png": "assets/cache/q26.48d9065a_8ee72f39.png",
  "https://foreignvasi.com/q279.1a549501.png": "assets/cache/q279.1a549501_98e31742.png",
  "https://foreignvasi.com/q287.838640b1.png": "assets/cache/q287.838640b1_b6b2faac.png",
  "https://foreignvasi.com/q29.31824d77.png": "assets/cache/q29.31824d77_b7a12172.png",
  "https://foreignvasi.com/q35.e7713f5f.png": "assets/cache/q35.e7713f5f_b8d41ec2.png",
  "https://foreignvasi.com/q56-q99.42b88c95.png": "assets/cache/q56-q99.42b88c95_cf274881.png",
  "https://foreignvasi.com/q62.28bca79d.png": "assets/cache/q62.28bca79d_3e205fa2.png",
  "https://foreignvasi.com/qbb1.706c4d3c.jpeg": "assets/cache/qbb1.706c4d3c_8a564f22.jpeg",
  "https://foreignvasi.com/qbb10.7926742d.jpeg": "assets/cache/qbb10.7926742d_62588638.jpeg",
  "https://foreignvasi.com/qbl1.83065446.jpeg": "assets/cache/qbl1.83065446_04e52625.jpeg",
  "https://foreignvasi.com/qbl10.70634ae6.jpeg": "assets/cache/qbl10.70634ae6_f19876a9.jpeg",
  "https://foreignvasi.com/qbm1.9033f1b7.jpeg": "assets/cache/qbm1.9033f1b7_d2c1ffc8.jpeg",
  "https://foreignvasi.com/qbm10.9f45074b.jpeg": "assets/cache/qbm10.9f45074b_93c84dac.jpeg",
  "https://foreignvasi.com/qbw1.18061c05.jpeg": "assets/cache/qbw1.18061c05_1fa9a987.jpeg",
  "https://foreignvasi.com/qbw8.27ed57e1.jpeg": "assets/cache/qbw8.27ed57e1_2e27e839.jpeg",
  "https://foreignvasi.com/qby1.378f8193.jpeg": "assets/cache/qby1.378f8193_50574801.jpeg",
  "https://foreignvasi.com/qby10.eaddc2be.jpeg": "assets/cache/qby10.eaddc2be_d5a1ef6c.jpeg",
  "https://foreignvasi.com/qhb1.ec3ac9e3.jpeg": "assets/cache/qhb1.ec3ac9e3_171cb0f4.jpeg",
  "https://foreignvasi.com/qhb10.4c2c3aab.jpeg": "assets/cache/qhb10.4c2c3aab_7bc94689.jpeg",
  "https://foreignvasi.com/qhs1.a1d732b7.jpeg": "assets/cache/qhs1.a1d732b7_bf2b842b.jpeg",
  "https://foreignvasi.com/qhs10.da672a59.jpeg": "assets/cache/qhs10.da672a59_fcc2e569.jpeg",
  "https://foreignvasi.com/qmv1.a2812830.jpeg": "assets/cache/qmv1.a2812830_8d04b022.jpeg",
  "https://foreignvasi.com/qmv10.bc891748.jpeg": "assets/cache/qmv10.bc891748_620d812e.jpeg",
  "https://foreignvasi.com/qns1.fc718c6e.jpeg": "assets/cache/qns1.fc718c6e_a57e85bc.jpeg",
  "https://foreignvasi.com/qns8.81db6464.jpeg": "assets/cache/qns8.81db6464_0faf3411.jpeg",
  "https://foreignvasi.com/qnw1.78baa273.jpeg": "assets/cache/qnw1.78baa273_0ad61019.jpeg",
  "https://foreignvasi.com/qnw8.f555cf6b.jpeg": "assets/cache/qnw8.f555cf6b_84aabd71.jpeg",
  "https://foreignvasi.com/qrp1.5a74c5da.jpeg": "assets/cache/qrp1.5a74c5da_8838e716.jpeg",
  "https://foreignvasi.com/qrp8.528dcff5.jpeg": "assets/cache/qrp8.528dcff5_03af2bff.jpeg",
  "https://foreignvasi.com/qsa1.1e4245dd.jpeg": "assets/cache/qsa1.1e4245dd_ed965317.jpeg",
  "https://foreignvasi.com/qsa8.fd6b5f78.jpeg": "assets/cache/qsa8.fd6b5f78_1b422ab8.jpeg",
  "https://foreignvasi.com/qsh1.c4be2a60.jpeg": "assets/cache/qsh1.c4be2a60_e876ee99.jpeg",
  "https://foreignvasi.com/qsh8.442d7ed7.jpeg": "assets/cache/qsh8.442d7ed7_3ab52e41.jpeg",
  "https://foreignvasi.com/qsl1.5d22fa5a.jpeg": "assets/cache/qsl1.5d22fa5a_ebe8f28a.jpeg",
  "https://foreignvasi.com/qsl8.e724ee61.jpeg": "assets/cache/qsl8.e724ee61_14574367.jpeg",
  "https://foreignvasi.com/qss1.71aaeb78.jpeg": "assets/cache/qss1.71aaeb78_2f962ad8.jpeg",
  "https://foreignvasi.com/qss8.6922b0bb.jpeg": "assets/cache/qss8.6922b0bb_8dbc0c84.jpeg",
  "https://foreignvasi.com/qtg1.aca82959.jpeg": "assets/cache/qtg1.aca82959_6e014456.jpeg",
  "https://foreignvasi.com/qtg8.56380392.jpeg": "assets/cache/qtg8.56380392_137308b1.jpeg"
};

// Reverse map: local cached asset path -> origin backup URL
export const ORIGIN_IMAGE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(LOCAL_IMAGE_CACHE).map(([origin, local]) => [local, origin])
);

export function getBackupImageUrl(imagePath?: string): string | null {
  if (!imagePath) return null;
  const trimmed = imagePath.trim();
  if (ORIGIN_IMAGE_MAP[trimmed]) return ORIGIN_IMAGE_MAP[trimmed];
  // If it's already an origin URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return null;
}

// Fallback high-resolution coats from official Wikimedia Commons if local file isn't present
export const STATE_COAT_FALLBACKS: Record<BundeslandCode, string> = {
  BW: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Grosses_Landeswappen_Baden-W%C3%BCrttemberg.svg/200px-Grosses_Landeswappen_Baden-W%C3%BCrttemberg.svg.png',
  BY: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Coat_of_arms_of_Bavaria.svg/200px-Coat_of_arms_of_Bavaria.svg.png',
  BE: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Coat_of_arms_of_Berlin.svg/200px-Coat_of_arms_of_Berlin.svg.png',
  BB: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Brandenburg_Wappen.svg/200px-Brandenburg_Wappen.svg.png',
  HB: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Bremen_Wappen%28Mittel%29.svg/200px-Bremen_Wappen%28Mittel%29.svg.png',
  HH: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Coat_of_arms_of_Hamburg.svg/200px-Coat_of_arms_of_Hamburg.svg.png',
  HE: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Coat_of_arms_of_Hesse.svg/200px-Coat_of_arms_of_Hesse.svg.png',
  MV: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Coat_of_arms_of_Mecklenburg-Western_Pomerania_%28great%29.svg/200px-Coat_of_arms_of_Mecklenburg-Western_Pomerania_%28great%29.svg.png',
  NI: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Coat_of_arms_of_Lower_Saxony.svg/200px-Coat_of_arms_of_Lower_Saxony.svg.png',
  NW: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Coat_of_arms_of_North_Rhine-Westphalia.svg/200px-Coat_of_arms_of_North_Rhine-Westphalia.svg.png',
  RP: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Coat_of_arms_of_Rhineland-Palatinate.svg/200px-Coat_of_arms_of_Rhineland-Palatinate.svg.png',
  SL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Wappen_des_Saarlands.svg/200px-Wappen_des_Saarlands.svg.png',
  SN: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Coat_of_arms_of_Saxony.svg/200px-Coat_of_arms_of_Saxony.svg.png',
  ST: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Wappen_Sachsen-Anhalt.svg/200px-Wappen_Sachsen-Anhalt.svg.png',
  SH: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Landeswappen_Schleswig-Holstein.svg/200px-Landeswappen_Schleswig-Holstein.svg.png',
  TH: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Coat_of_arms_of_Thuringia.svg/200px-Coat_of_arms_of_Thuringia.svg.png'
};
