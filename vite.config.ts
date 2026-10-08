import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import Avatar from 'boring-avatars';
import fs from 'node:fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { defineConfig } from 'vite';

// Вкажіть правильний шлях до вашого конфігу версії
import { APP_VERSION_CONFIG } from './src/version';

// Палітра Tailwind Zinc (від чорного до білого)
const ZINC_BW_PALETTE = ['#09090b', '#27272a', '#52525b', '#a1a1aa', '#fafafa'];

function generateBadgeSvg(codename: string, version: string): string {
  // ESM / CJS сумісність для Node
  // @ts-ignore
  const AvatarComponent = Avatar?.default || Avatar;

  // 1. Отримуємо офіційний SVG від Boring Avatars
  let svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(AvatarComponent, {
      size: 100,
      name: `${codename}-${version}`, // зміна версії чи імені дає новий візерунок
      variant: 'ring', // варіанти: 'bauhaus' | 'sunset' | 'beam' | 'marble' | 'pixel' | 'ring'
      colors: ZINC_BW_PALETTE,
      square: false, // true = квадрат зі скругленням, false = кругла аватарка
    })
  );

  // 2. Робимо кути заокругленими (Squircle) замість гострого квадрата
  //svg = svg.replace('<rect width="80" height="80"', '<rect width="80" height="80" rx="20"');

  // 3. Опціонально: літера по центру (якщо потрібен чистий аватар — поставте false)
  const SHOW_LETTER = false;

  if (SHOW_LETTER) {
    const char = codename.trim().charAt(0).toUpperCase();
    const letterOverlay = `
      <!-- Тонкий контур -->
      <rect width="78" height="78" x="1" y="1" rx="19" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.5" />
      <!-- Літера моноширинного шрифту з тінню для читабельності -->
      <text 
        x="40" 
        y="39.5" 
        font-family="'IBM Plex Mono', 'JetBrainsMono Nerd Font', 'JetBrains Mono', monospace" 
        font-weight="500" 
        font-size="46" 
        fill="#ffffff" 
        text-anchor="middle" 
        dominant-baseline="central" 
        style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.9))">${char}</text>
    `;

    svg = svg.replace('</svg>', `${letterOverlay}</svg>`);
  }

  return svg;
}

// Плагін генерації badge.svg
function versionBadgePlugin() {
  return {
    name: 'vite-plugin-version-badge',
    buildStart() {
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const svgContent = generateBadgeSvg(
        APP_VERSION_CONFIG.codename,
        APP_VERSION_CONFIG.version
      );

      fs.writeFileSync(path.join(publicDir, 'badge.svg'), svgContent, 'utf-8');
      console.log(`\x1b[32m✔ [Boring Avatars] Generated badge.svg (${APP_VERSION_CONFIG.version})\x1b[0m`);
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      versionBadgePlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});