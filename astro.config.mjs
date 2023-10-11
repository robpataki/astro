import { defineConfig } from 'astro/config';
import glsl from 'vite-plugin-glsl';

// https://astro.build/config
export default defineConfig({
  site: 'https://robpataki.github.io',
  base: '/threejs-astro-demos',
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
