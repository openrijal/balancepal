/**
 * Server-side authentication helpers
 */
import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from 'astro:env/server';

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

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
        const codeVerifierName = `sb-${projectRef}-auth-token-code-verifier`;

        // Helper to get main cookie and all its chunks
        const getCookieWithChunks = (baseName: string) => {
          const cookiesFound: { name: string; value: string }[] = [];

          // Check main cookie
          const main = cookies.get(baseName);
          if (main?.value) {
            cookiesFound.push({ name: baseName, value: main.value });
          }

          // Check chunks (usually up to a reasonable limit, checking until missing is safer but max 20 prevents infinite)
          for (let i = 0; i < 20; i++) {
            const chunkName = `${baseName}.${i}`;
            const chunk = cookies.get(chunkName);
            if (chunk?.value) {
              cookiesFound.push({ name: chunkName, value: chunk.value });
            } else {
              // Usually chunks are sequential, but we can't always guarantee it if deletion happened weirdly.
              // But for getAll, break on first missing is standard unless we want to be very thorough.
              // Let's break to be efficient.
              break;
            }
          }
          return cookiesFound;
        };

        const authCookies = getCookieWithChunks(authTokenName);
        const verifierCookies = getCookieWithChunks(codeVerifierName);

        allCookies.push(...authCookies);
        allCookies.push(...verifierCookies);

        return allCookies;
      },
      setAll(cookiesToSet) {
        console.log(
          '[Auth] Setting cookies:',
          cookiesToSet.map((c) => `${c.name} (SameSite=${c.options?.sameSite})`)
        );
        cookiesToSet.forEach(({ name, value, options }) => {
          let sameSite: boolean | 'lax' | 'strict' | 'none' | undefined = undefined;
          if (typeof options?.sameSite === 'string') {
            sameSite = options.sameSite.toLowerCase() as 'lax' | 'strict' | 'none';
          } else if (typeof options?.sameSite === 'boolean') {
            sameSite = options.sameSite;
          }

          cookies.set(name, value, {
            ...options,
            sameSite,
          });
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
