import { defineConfig } from 'vite';
import { seoPlugin } from './vite-plugins/seo.ts';

const VENDOR_CHUNKS = ['three', 'gsap', 'howler'] as const;

/** BASE_PATH lets GitHub Pages serve from /<repo>/ while dev stays at /. */
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [seoPlugin()],
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          return VENDOR_CHUNKS.find((name) => id.includes(`node_modules/${name}/`));
        },
      },
    },
  },
});
