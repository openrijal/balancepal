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

        const youOweDetails: Record<string, { userId: string; name: string; amount: number }> = {};
        const youreOwedDetails: Record<string, { userId: string; name: string; amount: number }> = {};

        // Calculate totals across all groups
        for (const group of groups) {
            const balances = await BalanceService.getGroupBalances(group.id);

            for (const balance of balances) {
                if (balance.fromUserId === user.id) {
                    youOwe += balance.amount;
                    const b = balance as any; // Debt interface might not have names in some calls, but BalanceService.getGroupBalances usually populates them
                    const toUserId = balance.toUserId;
                    const toUserName = b.toUser?.name || 'Unknown';

                    if (!youOweDetails[toUserId]) {
                        youOweDetails[toUserId] = { userId: toUserId, name: toUserName, amount: 0 };
                    }
                    youOweDetails[toUserId].amount += balance.amount;
                } else if (balance.toUserId === user.id) {
                    youreOwed += balance.amount;
                    const b = balance as any;
                    const fromUserId = balance.fromUserId;
                    const fromUserName = b.fromUser?.name || 'Unknown';

                    if (!youreOwedDetails[fromUserId]) {
                        youreOwedDetails[fromUserId] = { userId: fromUserId, name: fromUserName, amount: 0 };
                    }
                    youreOwedDetails[fromUserId].amount += balance.amount;
                }
            }
        }

        return new Response(JSON.stringify({
            youOwe,
            youreOwed,
            activeGroups: groups.length,
            youOweDetails: Object.values(youOweDetails),
            youreOwedDetails: Object.values(youreOwedDetails),
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('Failed to fetch dashboard stats', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
