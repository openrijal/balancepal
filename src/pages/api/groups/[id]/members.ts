import type { APIRoute } from 'astro';
import { GroupService } from '@/services/groups';
import { BalanceService } from '@/services/balances';
import { db } from '@/db';
import { groupMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, params, locals }) => {
  try {
    const { id: groupId } = params;
    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Group ID required' }), { status: 400 });
    }

    const user = locals.user!;
    const body = await request.json();

    if (!body.userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    // 1. Check if the current user is an admin of the group (optional, but good practice)
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)),
    });

    if (!membership || membership.role !== 'admin') {
      // return new Response(JSON.stringify({ error: 'Only admins can add members directly' }), { status: 403 });
      // Actually, for simplicity in this app, maybe anyone can add friends. Let's stick to any member for now.
      if (!membership) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // 2. Check if the target user is already a member
    const existingMembership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, body.userId)),
    });

    if (existingMembership) {
      return new Response(JSON.stringify({ error: 'User is already a member of this group' }), {
        status: 400,
      });
    }

    // 3. Add the member
    const newMember = await GroupService.addMember(groupId, body.userId);

    return new Response(JSON.stringify(newMember), { status: 201 });
  } catch (error) {
    console.error('Error adding member:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params, locals }) => {
  try {
    const { id: groupId } = params;
    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Group ID required' }), { status: 400 });
    }

    const user = locals.user!;
    const body = await request.json();
    const targetUserId = body.userId;

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    // Check if current user is a member
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)),
    });

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Check if target user is a member
    const targetMembership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)),
    });

    if (!targetMembership) {
      return new Response(JSON.stringify({ error: 'User is not a member of this group' }), {
        status: 400,
      });
    }

    // Don't allow removing the only admin (prevent orphaned groups)
    if (targetMembership.role === 'admin') {
      const adminCount = await db.query.groupMembers.findMany({
        where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.role, 'admin')),
      });
      if (adminCount.length <= 1) {
        return new Response(
          JSON.stringify({ error: 'Cannot remove the only admin. Transfer admin role first.' }),
          { status: 400 }
        );
      }
    }

    // Check if the target user has any outstanding balance
    const balanceInfo = await BalanceService.getMemberOutstandingBalance(groupId, targetUserId);
    if (balanceInfo.hasBalance) {
      const balanceStr =
        balanceInfo.balance > 0
          ? `is owed $${balanceInfo.balance.toFixed(2)}`
          : `owes $${Math.abs(balanceInfo.balance).toFixed(2)}`;
      return new Response(
        JSON.stringify({
          error: `Cannot remove member who ${balanceStr}. Settle up first.`,
          balance: balanceInfo.balance,
          debts: balanceInfo.debts,
        }),
        { status: 400 }
      );
    }

    // Remove the member
    const removed = await GroupService.removeMember(groupId, targetUserId);

    return new Response(JSON.stringify({ success: removed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
