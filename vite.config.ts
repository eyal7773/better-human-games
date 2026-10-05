import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const page = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * The site's version — the single source of truth, derived from git so every
 * deploy (a push to main) gets a new number without anyone bumping it:
 * `<commits on main>.<short sha>`, e.g. "57.cecca6e".
 */
function version(dev: boolean) {
  try {
    const git = (args: string) => execSync(`git ${args}`, { encoding: 'utf8' }).trim();
    return `${git('rev-list --count HEAD')}.${git('rev-parse --short HEAD')}${dev ? '-dev' : ''}`;
  } catch {
    return 'dev';
  }
}

export default defineConfig(({ command }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(version(command === 'serve')),
  },
  // GitHub Pages serves the site from /better-human-games/
  base: '/better-human-games/',
  build: {
    target: 'es2020',
    // three.js alone is ~600kB (≈150kB gzip); it only loads on the Catch Me page.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        main: page('./index.html'),
        boilingPoint: page('./boiling-point/index.html'),
        catchMe: page('./catch-me/index.html'),
        catchMe3d: page('./catch-me-3d/index.html'),
        wordsInFlight: page('./words-in-flight/index.html'),
        shadowWall: page('./shadow-wall/index.html'),
        fortress: page('./fortress/index.html'),
        island: page('./island/index.html'),
        angryNow: page('./angry-now/index.html'),
      },
    },
  },
}));
