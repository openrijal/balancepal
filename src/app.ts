import type { App } from 'vue';
import { createPinia } from 'pinia';

/**
 * Vue app configuration for Astro integration
 * This file is loaded by @astrojs/vue for each island
 */
export default (app: App) => {
  const pinia = createPinia();
  app.use(pinia);
};
