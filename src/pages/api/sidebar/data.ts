import type { APIRoute } from 'astro';
import { db } from '@/db';
import { groupMembers, profiles, groups as groupsTable } from '@/db/schema';
import { eq, inArray, and, ne } from 'drizzle-orm';

export const GET: APIRoute = async ({ locals }) => {
  // User is attached by middleware (401 already handled by middleware)
  const authUser = locals.user!;

  try {
    // 1. Get all groups user is in
    const userGroups = await db.query.groupMembers.findMany({
      where: eq(groupMembers.userId, authUser.id),
      with: {
        group: true,
      },
    });

    const groups = userGroups.map((gm) => gm.group);
    const groupIds = groups.map((g) => g.id);

    let friends: any[] = [];
    if (groupIds.length > 0) {
      // 2. Get all members of those groups except current user
      const members = await db.query.groupMembers.findMany({
        where: and(inArray(groupMembers.groupId, groupIds), ne(groupMembers.userId, authUser.id)),
        with: {
          user: true,
        },
      });

      // 3. Unique friends by profile ID
      const seen = new Set();
      friends = members
        .map((m) => m.user)
        .filter((u) => {
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
