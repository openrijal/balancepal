import { db } from '@/db';
import { profiles, groupMembers, expenses, groups as groupsTable } from '@/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { BalanceService } from './balances';

export interface SharedGroup {
    id: string;
    name: string;
    description: string | null;
}

export interface FriendDetails {
    id: string;
    name: string;
    email: string;
    profilePictureUrl: string | null;
    sharedGroups: SharedGroup[];
}

export interface FriendBalanceBreakdown {
    groupId: string;
    groupName: string;
    amount: number;  // positive = they owe you
}

export interface FriendBalance {
    friendId: string;
    netBalance: number;  // positive = they owe you
    breakdown: FriendBalanceBreakdown[];
}

export interface SharedExpense {
    id: string;
    description: string;
    amount: string;
    date: Date;
    groupId: string;
    groupName: string;
    paidByUserId: string;
    paidByName: string;
    category: string;
    userSplit?: string;
    friendSplit?: string;
}

export interface FriendListItem {
    id: string;
    name: string;
    email: string;
    profilePictureUrl: string | null;
    sharedGroupCount: number;
    netBalance: number;
}

export class FriendsService {
    /**
     * Get all friends for a user (users who share at least one group)
     */
    static async getAllFriends(userId: string): Promise<FriendListItem[]> {
        // 1. Get all groups user is in
        const userMemberships = await db.query.groupMembers.findMany({
            where: eq(groupMembers.userId, userId),
        });
        const userGroupIds = userMemberships.map(m => m.groupId);

        if (userGroupIds.length === 0) {
            return [];
        }

        // 2. Get all members of those groups except current user
        const allMembers = await db.query.groupMembers.findMany({
            where: inArray(groupMembers.groupId, userGroupIds),
            with: {
                user: true,
            },
        });

        // 3. Build friend map with shared group counts
        const friendMap = new Map<string, {
            user: typeof allMembers[0]['user'];
            sharedGroupIds: Set<string>;
        }>();

        for (const member of allMembers) {
            if (member.userId === userId) continue;

            if (!friendMap.has(member.userId)) {
                friendMap.set(member.userId, {
                    user: member.user,
                    sharedGroupIds: new Set([member.groupId]),
                });
            } else {
                friendMap.get(member.userId)!.sharedGroupIds.add(member.groupId);
            }
        }

        // 4. Calculate net balance for each friend
        const friends: FriendListItem[] = [];

        for (const [friendId, data] of friendMap) {
            let netBalance = 0;

            // Calculate balance across all shared groups
            for (const groupId of data.sharedGroupIds) {
                try {
                    const debts = await BalanceService.getGroupBalances(groupId);
                    for (const debt of debts) {
                        if (debt.fromUserId === userId && debt.toUserId === friendId) {
                            netBalance -= debt.amount;
                        } else if (debt.fromUserId === friendId && debt.toUserId === userId) {
                            netBalance += debt.amount;
                        }
                    }
                } catch {
                    // Skip if balance calculation fails
                }
            }

            friends.push({
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                profilePictureUrl: data.user.profilePictureUrl,
                sharedGroupCount: data.sharedGroupIds.size,
                netBalance,
            });
        }

        // Sort by name
        return friends.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Get shared group IDs between two users
     */
    private static async getSharedGroupIds(userId: string, friendId: string): Promise<string[]> {
        // Get groups where user is a member
        const userMemberships = await db.query.groupMembers.findMany({
            where: eq(groupMembers.userId, userId),
        });
        const userGroupIds = new Set(userMemberships.map(m => m.groupId));

        // Get groups where friend is a member
        const friendMemberships = await db.query.groupMembers.findMany({
            where: eq(groupMembers.userId, friendId),
        });

        // Find intersection (shared groups)
        return friendMemberships
            .map(m => m.groupId)
            .filter(gid => userGroupIds.has(gid));
    }

    /**
     * Get friend profile details and shared groups
     */
    static async getFriendDetails(userId: string, friendId: string): Promise<FriendDetails | null> {
        // Get friend profile
        const friend = await db.query.profiles.findFirst({
            where: eq(profiles.id, friendId),
        });

        if (!friend) {
            return null;
        }

        // Get shared group IDs
        const sharedGroupIds = await this.getSharedGroupIds(userId, friendId);

        if (sharedGroupIds.length === 0) {
            // They're not really friends if they don't share any groups
            return null;
        }

        // Fetch the shared groups with details
        const sharedGroupsData = await db.query.groups.findMany({
            where: inArray(groupsTable.id, sharedGroupIds),
        });

        return {
            id: friend.id,
            name: friend.name,
            email: friend.email,
            profilePictureUrl: friend.profilePictureUrl,
            sharedGroups: sharedGroupsData.map(g => ({
                id: g.id,
                name: g.name,
                description: g.description,
            })),
        };
    }

    /**
     * Calculate net balance between current user and friend across all shared groups
     */
    static async getFriendBalance(userId: string, friendId: string): Promise<FriendBalance> {
        const sharedGroupIds = await this.getSharedGroupIds(userId, friendId);

        const breakdown: FriendBalanceBreakdown[] = [];
        let netBalance = 0;

        for (const groupId of sharedGroupIds) {
            const debts = await BalanceService.getGroupBalances(groupId);

            // Find debt between these two users in this group
            for (const debt of debts) {
                if (debt.fromUserId === userId && debt.toUserId === friendId) {
                    // I owe friend (negative for me)
                    const amount = -debt.amount;
                    netBalance += amount;

                    // Get group name
                    const group = await db.query.groups.findFirst({
                        where: eq(groupsTable.id, groupId),
                    });

                    breakdown.push({
                        groupId,
                        groupName: group?.name || 'Unknown',
                        amount,
                    });
                } else if (debt.fromUserId === friendId && debt.toUserId === userId) {
                    // Friend owes me (positive for me)
                    const amount = debt.amount;
                    netBalance += amount;

                    // Get group name
                    const group = await db.query.groups.findFirst({
                        where: eq(groupsTable.id, groupId),
                    });

                    breakdown.push({
                        groupId,
                        groupName: group?.name || 'Unknown',
                        amount,
                    });
                }
            }
        }

        return {
            friendId,
            netBalance,
            breakdown,
        };
    }

    /**
     * Get expenses that involve both the current user and the friend
     */
    static async getSharedExpenses(
        userId: string,
        friendId: string,
        limit = 20,
        offset = 0
    ): Promise<SharedExpense[]> {
        const sharedGroupIds = await this.getSharedGroupIds(userId, friendId);

        if (sharedGroupIds.length === 0) {
            return [];
        }

        // Get expenses in shared groups
        const expensesData = await db.query.expenses.findMany({
            where: inArray(expenses.groupId, sharedGroupIds),
            with: {
                paidBy: true,
                splits: {
                    with: {
                        user: true,
                    },
                },
                group: true,
            },
            orderBy: desc(expenses.date),
            limit: limit + offset,
        });

        // Filter to only expenses that involve both users
        const sharedExpenses: SharedExpense[] = [];

        for (const exp of expensesData) {
            const splitUserIds = exp.splits.map(s => s.userId);
            const userInvolved = exp.paidByUserId === userId || splitUserIds.includes(userId);
            const friendInvolved = exp.paidByUserId === friendId || splitUserIds.includes(friendId);

            if (userInvolved && friendInvolved && sharedExpenses.length < limit) {
                const userSplit = exp.splits.find(s => s.userId === userId);
                const friendSplit = exp.splits.find(s => s.userId === friendId);

                sharedExpenses.push({
                    id: exp.id,
                    description: exp.description,
                    amount: exp.amount,
                    date: exp.date,
                    groupId: exp.groupId,
                    groupName: exp.group.name,
                    paidByUserId: exp.paidByUserId,
                    paidByName: exp.paidBy.name,
                    category: exp.category,
                    userSplit: userSplit?.amount,
                    friendSplit: friendSplit?.amount,
                });
            }
        }

        return sharedExpenses.slice(offset);
    }
}
