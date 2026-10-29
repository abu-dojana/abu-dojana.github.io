import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://abu-dojana.github.io',
  output: 'static',
  trailingSlash: 'always',
  vite: { server: { fs: { strict: true } } },
});
