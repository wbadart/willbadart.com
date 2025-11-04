// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://willbadart.com',
  trailingSlash: 'always',
  vite: {
    ssr: {
      noExternal: ['open-props'],
    },
  },
});
