/**
 * Type-safe injection keys for Vue dependency injection
 */
import type { InjectionKey, Ref } from 'vue';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Supabase Client Injection Key
export const supabaseKey: InjectionKey<SupabaseClient> = Symbol('supabase');

// Auth State Injection Key
export interface AuthState {
  user: Ref<User | null>;
  loading: Ref<boolean>;
  isAuthenticated: Ref<boolean>;
}

export const authKey: InjectionKey<AuthState> = Symbol('auth');
