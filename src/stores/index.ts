/**
 * Pinia Stores - Central export for all stores
 */
import { createPinia } from 'pinia';

// Singleton Pinia instance shared across all Vue islands
export const pinia = createPinia();

export { useAuthStore } from './authStore';
export { useGroupsStore } from './groupsStore';
export { useUIStore } from './uiStore';
