import { db } from '@/db';
import { groups, groupMembers, invitations, type memberRoleEnum } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export interface CreateGroupData {
    name: string;
    description?: string;
    currency?: string; // We might want to store this in the future, for now schema doesn't have it but plan mentioned it. Schema has 'currency' on expenses, not groups. I will stick to schema.
}

export class GroupService {
    static async createGroup(userId: string, data: CreateGroupData) {
        return await db.transaction(async (tx) => {
            // 1. Create the group
            const [newGroup] = await tx
                .insert(groups)
                .values({
                    name: data.name,
                    description: data.description,
                    createdBy: userId,
                })
                .returning();

            if (!newGroup) {
                throw new Error('Failed to create group');
            }

            // 2. Add creator as admin member
            await tx.insert(groupMembers).values({
                groupId: newGroup.id,
                userId: userId,
                role: 'admin',
            });

            return newGroup;
        });
    }

    static async getUserGroups(userId: string) {
        // Fetch groups where the user is a member
        // We can use the relations or a join.
        // Using query builder for type safety with relations is often cleaner if properly set up,
        // otherwise direct join.
        // Given the schema relations: groupMembers has one 'group'.

        const memberships = await db.query.groupMembers.findMany({
            where: eq(groupMembers.userId, userId),
            with: {
                group: {
                    with: {
                        members: true,
                    }
                },
            },
            orderBy: (groupMembers) => desc(groupMembers.joinedAt),
        });

        return memberships.map((m) => ({
            ...m.group,
            memberCount: m.group.members?.length || 0,
        }));
    }

    static async getGroupDetails(groupId: string) {
        const group = await db.query.groups.findFirst({
            where: eq(groups.id, groupId),
            with: {
                members: {
                    with: {
                        user: true
                    }
                }
            }
        });
        return group;
    }

    static async createInvitation(groupId: string, invitedByUserId: string, email: string) {
        const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
        const [invitation] = await db.insert(invitations).values({
            groupId,
            email,
            invitedBy: invitedByUserId,
            token,
            status: 'pending'
        }).returning();
        return invitation;
    }
}
