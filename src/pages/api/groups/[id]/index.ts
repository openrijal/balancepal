import type { APIRoute } from 'astro';
import { GroupService } from '@/services/groups';
import { BalanceService } from '@/services/balances';
import { db } from '@/db';
import { groupMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export const PUT: APIRoute = async ({ request, params, locals }) => {
  try {
    const { id: groupId } = params;
    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Group ID required' }), { status: 400 });
    }

    const user = locals.user!;
    const body = await request.json();

    // Check if user is a member of the group
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)),
    });

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Validate input
    if (!body.name?.trim()) {
      return new Response(JSON.stringify({ error: 'Group name is required' }), { status: 400 });
    }

    const updated = await GroupService.updateGroup(groupId, {
      name: body.name.trim(),
      description: body.description?.trim() || null,
    });

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { id: groupId } = params;
    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Group ID required' }), { status: 400 });
    }

    const user = locals.user!;

    // Check if user is an admin of the group
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)),
    });

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    if (membership.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can delete a group' }), {
        status: 403,
      });
    }

    // Check if there are any outstanding balances
    const hasOutstanding = await BalanceService.hasOutstandingBalances(groupId);
    if (hasOutstanding) {
      return new Response(
        JSON.stringify({
          error: 'Cannot delete group with outstanding balances. All members must settle up first.',
        }),
        { status: 400 }
      );
    }

    // Delete the group
    const deleted = await GroupService.deleteGroup(groupId);

    return new Response(JSON.stringify({ success: true, deleted }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
