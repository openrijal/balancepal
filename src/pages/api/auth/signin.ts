import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
        return new Response('Missing tokens', { status: 400 });
    }

    cookies.set('sb-access-token', access_token, {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
    });

    cookies.set('sb-refresh-token', refresh_token, {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
    });

    return new Response('Signed in', { status: 200 });
};
