/**
 * Server-side authentication helpers
 */
import { createServerClient } from '@supabase/ssr';
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
        const allCookies: { name: string; value: string }[] = [];

        // Supabase auth cookies follow the pattern: sb-<project-ref>-auth-token
        // We need to get all cookies from Astro and filter for Supabase ones
        const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase/)?.[1] || '';
        const authTokenName = `sb-${projectRef}-auth-token`;

        // Get the main auth token cookie
        const authToken = cookies.get(authTokenName);
        if (authToken?.value) {
          allCookies.push({ name: authTokenName, value: authToken.value });
        }

        // Also check for code verifier cookie (used in PKCE flow)
        const codeVerifierName = `sb-${projectRef}-auth-token-code-verifier`;
        const codeVerifier = cookies.get(codeVerifierName);
        if (codeVerifier?.value) {
          allCookies.push({ name: codeVerifierName, value: codeVerifier.value });
        }

        return allCookies;
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
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

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
