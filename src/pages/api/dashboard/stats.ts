import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { BalanceService } from '@/services/balances';
import { GroupService } from '@/services/groups';

export const GET: APIRoute = async ({ cookies }) => {
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
        // Get all user's groups
        const groups = await GroupService.getUserGroups(user.id);

        let youOwe = 0;
        let youreOwed = 0;

        // Calculate totals across all groups
        for (const group of groups) {
            const balances = await BalanceService.getGroupBalances(group.id);

            for (const balance of balances) {
                if (balance.fromUserId === user.id) {
                    youOwe += balance.amount;
                } else if (balance.toUserId === user.id) {
                    youreOwed += balance.amount;
                }
            }
        }

        return new Response(JSON.stringify({
            youOwe,
            youreOwed,
            activeGroups: groups.length,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('Failed to fetch dashboard stats', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
