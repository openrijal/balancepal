import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FriendsService } from '@/services/friends';
import { db } from '@/db';
import { BalanceService } from '@/services/balances';

// Mock the db module
vi.mock('@/db', () => ({
    db: {
        query: {
            groupMembers: {
                findMany: vi.fn(),
            },
            profiles: {
                findFirst: vi.fn(),
            },
            groups: {
                findMany: vi.fn(),
                findFirst: vi.fn(),
            },
            expenses: {
                findMany: vi.fn(),
            },
        },
    },
}));

// Mock BalanceService
vi.mock('@/services/balances', () => ({
    BalanceService: {
        getGroupBalances: vi.fn(),
    },
}));

describe('FriendsService', () => {
    const mockUserId = 'user-123';
    const mockFriendId = 'friend-456';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getFriendDetails', () => {
        it('should return null if friend not found', async () => {
            (db.query.profiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

            const result = await FriendsService.getFriendDetails(mockUserId, mockFriendId);

            expect(result).toBeNull();
        });

        it('should return null if no shared groups', async () => {
            // Friend exists
            (db.query.profiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
                id: mockFriendId,
                name: 'Friend Name',
                email: 'friend@example.com',
                profilePictureUrl: null,
            });

            // User has groups
            (db.query.groupMembers.findMany as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce([{ groupId: 'group-1' }])  // User's groups
                .mockResolvedValueOnce([{ groupId: 'group-2' }]); // Friend's groups (different)

            const result = await FriendsService.getFriendDetails(mockUserId, mockFriendId);

            expect(result).toBeNull();
        });

        it('should return friend details with shared groups', async () => {
            const mockFriend = {
                id: mockFriendId,
                name: 'Friend Name',
                email: 'friend@example.com',
                profilePictureUrl: 'https://example.com/pic.jpg',
            };

            const mockSharedGroups = [
                { id: 'group-1', name: 'Shared Group 1', description: 'Test' },
            ];

            (db.query.profiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockFriend);
            (db.query.groupMembers.findMany as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce([{ groupId: 'group-1' }])  // User's groups
                .mockResolvedValueOnce([{ groupId: 'group-1' }]); // Friend's groups (same)
            (db.query.groups.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockSharedGroups);

            const result = await FriendsService.getFriendDetails(mockUserId, mockFriendId);

            expect(result).toEqual({
                id: mockFriendId,
                name: 'Friend Name',
                email: 'friend@example.com',
                profilePictureUrl: 'https://example.com/pic.jpg',
                sharedGroups: mockSharedGroups,
            });
        });
    });

    describe('getFriendBalance', () => {
        it('should return zero balance when no shared groups', async () => {
            (db.query.groupMembers.findMany as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce([])  // User's groups
                .mockResolvedValueOnce([]); // Friend's groups

            const result = await FriendsService.getFriendBalance(mockUserId, mockFriendId);

            expect(result).toEqual({
                friendId: mockFriendId,
                netBalance: 0,
                breakdown: [],
            });
        });

        it('should calculate positive balance (friend owes user)', async () => {
            (db.query.groupMembers.findMany as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce([{ groupId: 'group-1' }])
                .mockResolvedValueOnce([{ groupId: 'group-1' }]);

            (BalanceService.getGroupBalances as ReturnType<typeof vi.fn>).mockResolvedValue([
                { fromUserId: mockFriendId, toUserId: mockUserId, amount: 50 },
            ]);

            (db.query.groups.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
                name: 'Test Group',
            });

            const result = await FriendsService.getFriendBalance(mockUserId, mockFriendId);

            expect(result.netBalance).toBe(50);
            expect(result.breakdown).toHaveLength(1);
            expect(result.breakdown[0].amount).toBe(50);
        });

        it('should calculate negative balance (user owes friend)', async () => {
            (db.query.groupMembers.findMany as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce([{ groupId: 'group-1' }])
                .mockResolvedValueOnce([{ groupId: 'group-1' }]);

            (BalanceService.getGroupBalances as ReturnType<typeof vi.fn>).mockResolvedValue([
                { fromUserId: mockUserId, toUserId: mockFriendId, amount: 30 },
            ]);

            (db.query.groups.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
                name: 'Test Group',
            });

            const result = await FriendsService.getFriendBalance(mockUserId, mockFriendId);

            expect(result.netBalance).toBe(-30);
            expect(result.breakdown[0].amount).toBe(-30);
        });
    });

    describe('getSharedExpenses', () => {
        it('should return empty array when no shared groups', async () => {
            (db.query.groupMembers.findMany as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const result = await FriendsService.getSharedExpenses(mockUserId, mockFriendId);

            expect(result).toEqual([]);
        });

        it('should return expenses involving both users', async () => {
            (db.query.groupMembers.findMany as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce([{ groupId: 'group-1' }])
                .mockResolvedValueOnce([{ groupId: 'group-1' }]);

            const mockExpense = {
                id: 'expense-1',
                description: 'Lunch',
                amount: '20.00',
                date: new Date('2024-01-15'),
                groupId: 'group-1',
                paidByUserId: mockUserId,
                category: 'food',
                paidBy: { name: 'User' },
                group: { name: 'Test Group' },
                splits: [
                    { userId: mockUserId, amount: '10.00', user: { name: 'User' } },
                    { userId: mockFriendId, amount: '10.00', user: { name: 'Friend' } },
                ],
            };

            (db.query.expenses.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockExpense]);

            const result = await FriendsService.getSharedExpenses(mockUserId, mockFriendId);

            expect(result).toHaveLength(1);
            expect(result[0].description).toBe('Lunch');
            expect(result[0].userSplit).toBe('10.00');
            expect(result[0].friendSplit).toBe('10.00');
        });

        it('should filter out expenses not involving both users', async () => {
            (db.query.groupMembers.findMany as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce([{ groupId: 'group-1' }])
                .mockResolvedValueOnce([{ groupId: 'group-1' }]);

            const mockExpenses = [
                {
                    id: 'expense-1',
                    description: 'Solo expense',
                    amount: '20.00',
                    date: new Date('2024-01-15'),
                    groupId: 'group-1',
                    paidByUserId: mockUserId,
                    category: 'food',
                    paidBy: { name: 'User' },
                    group: { name: 'Test Group' },
                    splits: [
                        { userId: mockUserId, amount: '20.00', user: { name: 'User' } },
                    ],
                },
            ];

            (db.query.expenses.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockExpenses);

            const result = await FriendsService.getSharedExpenses(mockUserId, mockFriendId);

            expect(result).toHaveLength(0);
        });
    });
});
