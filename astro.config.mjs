import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  site: 'https://ig2gi.github.io',
  srcDir: './src',
  outDir: './dist',
  publicDir: './public',
  trailingSlash: 'never',
});
