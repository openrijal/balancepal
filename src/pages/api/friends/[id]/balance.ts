import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { FriendsService } from '@/services/friends';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET: APIRoute = async ({ cookies, params }) => {
    const { id: friendId } = params;

    if (!friendId || !uuidRegex.test(friendId)) {
        return new Response(JSON.stringify({ error: 'Invalid friend ID' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { data: { user }, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    if (error || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const balance = await FriendsService.getFriendBalance(user.id, friendId);

        return new Response(JSON.stringify(balance), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('Failed to fetch friend balance', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
