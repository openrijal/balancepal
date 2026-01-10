import type { APIRoute } from 'astro';
import { BalanceService } from '@/services/balances';
import { GroupService } from '@/services/groups';
import { getUser } from '@/lib/auth';

export const GET: APIRoute = async ({ cookies, params }) => {
  try {
    const { id: groupId } = params;
    if (!groupId)
      return new Response(JSON.stringify({ error: 'Group ID is required' }), { status: 400 });

    const user = await getUser(cookies);
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const group = await GroupService.getGroupDetails(groupId);
    if (!group) return new Response(JSON.stringify({ error: 'Group not found' }), { status: 404 });

    const isMember = group.members.some((m) => m.user.id === user.id);
    if (!isMember) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

    const stats = await BalanceService.getGroupStats(groupId, user.id);

    return new Response(JSON.stringify(stats), { status: 200 });
  } catch (error) {
    console.error('Error fetching group stats:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
