import type { APIRoute } from 'astro';
import { SettlementService } from '@/services/settlements';
import { GroupService } from '@/services/groups';
import { getUser } from '@/lib/auth';

export const POST: APIRoute = async ({ request, cookies, params }) => {
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

    const body = await request.json();

    // Validation
    if (!body.toUserId || !body.amount) {
      return new Response(JSON.stringify({ error: 'Recipient and amount are required' }), {
        status: 400,
      });
    }

    const settlement = await SettlementService.createSettlement(groupId, {
      fromUserId: body.fromUserId || user.id, // Allow specifying payer, defaults to current user
      toUserId: body.toUserId,
      amount: body.amount,
      paymentMethod: body.paymentMethod || 'cash',
      reference: body.reference,
    });

    return new Response(JSON.stringify(settlement), { status: 201 });
  } catch (error) {
    console.error('Error creating settlement:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
