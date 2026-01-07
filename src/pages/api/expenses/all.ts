import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { GroupService } from '@/services/groups';
import { ExpenseService } from '@/services/expenses';
import { SettlementService } from '@/services/settlements';

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
        // 1. Get all user's groups
        const groups = await GroupService.getUserGroups(user.id);

        const allActivities: any[] = [];

        // 2. Fetch expenses and settlements for each group
        await Promise.all(groups.map(async (group) => {
            const [expenses, settlements] = await Promise.all([
                ExpenseService.getGroupExpenses(group.id),
                SettlementService.getGroupSettlements(group.id),
            ]);

            expenses.forEach(exp => {
                allActivities.push({
                    ...exp,
                    type: 'expense',
                    groupName: group.name,
                });
            });

            settlements.forEach(settle => {
                allActivities.push({
                    ...settle,
                    type: 'settlement',
                    groupName: group.name,
                });
            });
        }));

        // 3. Sort by date descending
        allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return new Response(JSON.stringify(allActivities), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('Failed to fetch all expenses', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
