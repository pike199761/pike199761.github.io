// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://pike199761.github.io',
  redirects: {
    '/blog/这个博客居然真做出来了/': '/blog/现在的小霸王/',
  },
  integrations: [mdx(), sitemap()],
});
