import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const POST: APIRoute = async ({ cookies, redirect }) => {
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });

    // Also sign out from Supabase server-side if needed
    // But removing cookies is the primary mechanism for our SSR auth

    return redirect('/login');
};
