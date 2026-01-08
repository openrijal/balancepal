import type { APIRoute } from 'astro';
import { BalanceService } from '@/services/balances';

export const GET: APIRoute = async ({ params, locals }) => {
    const { id: groupId } = params;

    if (!groupId) {
        return new Response(JSON.stringify({ error: 'Group ID is required' }), { status: 400 });
    }

    // User is attached by middleware (401 already handled by middleware)
    const user = locals.user!;

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
