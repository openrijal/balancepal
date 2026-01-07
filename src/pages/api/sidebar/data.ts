import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';
import { db } from '@/db';
import { groupMembers, profiles, groups as groupsTable } from '@/db/schema';
import { eq, inArray, and, ne } from 'drizzle-orm';

export const GET: APIRoute = async ({ cookies }) => {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Set session with tokens to enable proper auth
    const { data: { user: authUser }, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    if (error || !authUser) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        // 1. Get all groups user is in
        const userGroups = await db.query.groupMembers.findMany({
            where: eq(groupMembers.userId, authUser.id),
            with: {
                group: true,
            }
        });

        const groups = userGroups.map(gm => gm.group);
        const groupIds = groups.map(g => g.id);

        let friends: any[] = [];
        if (groupIds.length > 0) {
            // 2. Get all members of those groups except current user
            const members = await db.query.groupMembers.findMany({
                where: and(
                    inArray(groupMembers.groupId, groupIds),
                    ne(groupMembers.userId, authUser.id)
                ),
                with: {
                    user: true,
                }
            });

            // 3. Unique friends by profile ID
            const seen = new Set();
            friends = members
                .map(m => m.user)
                .filter(u => {
                    if (seen.has(u.id)) return false;
                    seen.add(u.id);
                    return true;
                });
        }

        return new Response(JSON.stringify({ groups, friends }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('Failed to fetch sidebar data', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
