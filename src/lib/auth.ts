/**
 * Server-side authentication helpers
 */
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

/**
 * Create a Supabase client for server-side operations with cookie handling
 */
export function createSupabaseServerClient(cookies: AstroCookies) {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return parseCookieHeader(cookies.get('sb-access-token')?.value ?? '');
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    cookies.set(name, value, options);
                });
            },
        },
    });
}

/**
 * Get the current user session
 */
export async function getSession(cookies: AstroCookies) {
    const supabase = createSupabaseServerClient(cookies);
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Error getting session:', error.message);
        return null;
    }

    return session;
}

/**
 * Get the current user
 */
export async function getUser(cookies: AstroCookies) {
    const supabase = createSupabaseServerClient(cookies);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Error getting user:', error.message);
        return null;
    }

    return user;
}

/**
 * Check if request is authenticated, redirect to login if not
 */
export async function requireAuth(cookies: AstroCookies, redirectTo = '/login') {
    const user = await getUser(cookies);

    if (!user) {
        return { redirect: redirectTo, user: null };
    }

    return { redirect: null, user };
}

/**
 * Sign out the current user
 */
export async function signOut(cookies: AstroCookies) {
    const supabase = createSupabaseServerClient(cookies);
    await supabase.auth.signOut();
}
