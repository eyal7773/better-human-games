import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // GitHub Pages serves the site from /better-human-games/
  base: '/better-human-games/',
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        main: page('./index.html'),
        boilingPoint: page('./boiling-point/index.html'),
      },
    },
  },
});
