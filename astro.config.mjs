// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://willbadart.com',
  trailingSlash: 'always',
  markdown: {
    shikiConfig: {
      themes: {
        dark: 'github-dark',
        light: 'github-light',
      },
      defaultColor: false,
    },
  },
  vite: {
    ssr: {
      noExternal: ['open-props'],
    },
  },
});
