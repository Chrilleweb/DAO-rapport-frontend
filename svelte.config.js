import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      env: {
        port: 'PORT',       // Use the 'PORT' environment variable
        host: '0.0.0.0'     // Listen on all network interfaces
      }
    }),
    alias: {
      $components: './src/lib/components',
      $lib: './src/lib',
    }
  }
};

export default config;
