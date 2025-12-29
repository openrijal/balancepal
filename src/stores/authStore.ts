/**
 * Auth Store - Manages user authentication state
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  name: string;
  profilePictureUrl: string | null;
  createdAt: string;
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const profile = ref<Profile | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const userId = computed(() => user.value?.id ?? null);
  const userEmail = computed(() => user.value?.email ?? profile.value?.email ?? null);
  const userName = computed(
    () => profile.value?.name ?? user.value?.email?.split('@')[0] ?? 'User'
  );
  const userAvatar = computed(() => profile.value?.profilePictureUrl ?? null);

  // Actions
  function setUser(newUser: User | null) {
    user.value = newUser;
    loading.value = false;
  }

  function setProfile(newProfile: Profile | null) {
    profile.value = newProfile;
  }

  function setLoading(isLoading: boolean) {
    loading.value = isLoading;
  }

  function setError(newError: string | null) {
    error.value = newError;
  }

  function clearAuth() {
    user.value = null;
    profile.value = null;
    error.value = null;
  }

  return {
    // State
    user,
    profile,
    loading,
    error,
    // Getters
    isAuthenticated,
    userId,
    userEmail,
    userName,
    userAvatar,
    // Actions
    setUser,
    setProfile,
    setLoading,
    setError,
    clearAuth,
  };
});
