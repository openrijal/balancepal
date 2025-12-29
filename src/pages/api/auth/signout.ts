import type { APIRoute } from 'astro';
import { signOut } from '@/lib/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
    // Use the shared auth helper to sign out and clear correct cookies
    await signOut(cookies);

    // Also manual cleanup of legacy/manual tokens if they exist, just in case
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });

    return redirect('/login');
};
