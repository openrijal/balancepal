import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '@/lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
        return new Response('Missing tokens', { status: 400 });
    }

    // Use SSR client to set session - this sets cookies in the correct format
    // that the middleware expects (sb-<project-ref>-auth-token pattern)
    const supabase = createSupabaseServerClient(cookies);
    const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
    });

    if (error) {
        console.error('Error setting session:', error.message);
        return new Response('Failed to set session', { status: 500 });
    }

    return new Response('Signed in', { status: 200 });
};
