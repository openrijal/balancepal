import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { BalanceService } from '@/services/balances';

export const GET: APIRoute = async ({ params, cookies }) => {
    const { id: groupId } = params;

    if (!groupId) {
        return new Response(JSON.stringify({ error: 'Group ID is required' }), { status: 400 });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Set session with tokens to enable proper auth
    const { data: { user }, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    if (error || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const memberBalances = await BalanceService.getGroupMemberBalances(groupId);
        return new Response(JSON.stringify(memberBalances), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('Failed to fetch member balances', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
