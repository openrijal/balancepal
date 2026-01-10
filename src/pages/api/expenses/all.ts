import type { APIRoute } from 'astro';
import { GroupService } from '@/services/groups';
import { ExpenseService } from '@/services/expenses';
import { SettlementService } from '@/services/settlements';

export const GET: APIRoute = async ({ locals, request }) => {
  // User is attached by middleware (401 already handled by middleware)
  const user = locals.user!;

  // Parse optional groupIds filter from query params
  const url = new URL(request.url);
  const groupIdsParam = url.searchParams.get('groupIds');
  const filterGroupIds = groupIdsParam ? groupIdsParam.split(',').filter(Boolean) : null;

  try {
    // 1. Get all user's groups
    let groups = await GroupService.getUserGroups(user.id);

    // Filter to specific groups if requested
    if (filterGroupIds && filterGroupIds.length > 0) {
      groups = groups.filter((g) => filterGroupIds.includes(g.id));
    }

    const allActivities: any[] = [];

    // 2. Fetch expenses and settlements for each group
    await Promise.all(
      groups.map(async (group) => {
        const [expenses, settlements] = await Promise.all([
          ExpenseService.getGroupExpenses(group.id),
          SettlementService.getGroupSettlements(group.id),
        ]);

        expenses.forEach((exp) => {
          allActivities.push({
            ...exp,
            type: 'expense',
            groupName: group.name,
          });
        });

        settlements.forEach((settle) => {
          allActivities.push({
            ...settle,
            type: 'settlement',
            groupName: group.name,
          });
        });
      })
    );

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
