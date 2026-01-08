import type { APIRoute } from 'astro';
import { GroupService } from '@/services/groups';
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
            where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id))
        });

        if (!membership || membership.role !== 'admin') {
            // return new Response(JSON.stringify({ error: 'Only admins can add members directly' }), { status: 403 });
            // Actually, for simplicity in this app, maybe anyone can add friends. Let's stick to any member for now.
            if (!membership) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        // 2. Check if the target user is already a member
        const existingMembership = await db.query.groupMembers.findFirst({
            where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, body.userId))
        });

        if (existingMembership) {
            return new Response(JSON.stringify({ error: 'User is already a member of this group' }), { status: 400 });
        }

        // 3. Add the member
        const newMember = await GroupService.addMember(groupId, body.userId);

        return new Response(JSON.stringify(newMember), { status: 201 });
    } catch (error) {
        console.error('Error adding member:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
