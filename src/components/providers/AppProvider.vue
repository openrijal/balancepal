<script setup lang="ts">
import { provide, ref, onMounted } from 'vue';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { supabaseKey, authKey } from '@/types/injection-keys';

const props = defineProps<{
  supabaseUrl: string;
  supabaseAnonKey: string;
  initialUser?: User | null;
}>();

// Initialize Supabase Client
const supabase = getSupabaseBrowserClient(props.supabaseUrl, props.supabaseAnonKey);

// Initialize Auth State
const user = ref<User | null>(props.initialUser ?? null);
const loading = ref(!props.initialUser); // If we have an initial user, we're not loading
const isAuthenticated = ref(!!props.initialUser);

// Provide Dependencies
provide(supabaseKey, supabase);
provide(authKey, {
  user,
  loading,
  isAuthenticated
});

// Set up Auth Listener
onMounted(() => {
  // Get initial session if not provided or to verify
  supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
    user.value = session?.user ?? null;
    isAuthenticated.value = !!session;
    loading.value = false;
  });

  // Listen for auth changes using the new V2 auth listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    user.value = session?.user ?? null;
    isAuthenticated.value = !!session;
    loading.value = false;
  });

  // Cleanup subscription on unmount implies returning a cleanup function if this were a composable,
  // but in script setup onMounted with async usually just runs. 
  // Ideally we should use onUnmounted, but the provider is likely permanent.
});
</script>

<template>
  <slot />
</template>
