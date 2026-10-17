import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://WELT5350.github.io',
  integrations: [
    sitemap({
      // 梦境层是隐藏内容，不出现在站点地图中
      filter: (page) => !new URL(page).pathname.startsWith('/dream'),
    }),
  ],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
