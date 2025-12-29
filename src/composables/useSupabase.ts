/**
 * Composable to inject Supabase client
 */
import { inject } from 'vue';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseKey } from '@/types/injection-keys';

export function useSupabase(): SupabaseClient {
    const supabase = inject(supabaseKey);

    if (!supabase) {
        throw new Error('useSupabase() must be used within an <AppProvider>');
    }

    return supabase;
}
