import { defineConfig } from 'astro/config';
import glsl from 'vite-plugin-glsl';
import { BASE_URL } from './src/scripts/const';

// https://astro.build/config
export default defineConfig({
  site: 'https://robpataki.github.io',
  base: BASE_URL,
  server: {
    host: true,
  },
  vite: {
    plugins: [glsl()],
    build: {
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          assetFileNames: '[ext]/[name][extname]',
          entryFileNames: 'script/entry.js',
        },
      },
      cssCodeSplit: false,
    },
  },
});