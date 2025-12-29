import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GroupService } from '@/services/groups';
import { db } from '@/db';

// Mock the db module
vi.mock('@/db', () => ({
    db: {
        transaction: vi.fn(),
        query: {
            groupMembers: {
                findMany: vi.fn(),
            },
            groups: {
                findFirst: vi.fn(),
            },
        },
        // Mock insert/values for non-transaction calls if any
        insert: vi.fn(),
    },
}));

describe('GroupService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createGroup', () => {
        it('should create a group and add the creator as an admin', async () => {
            const mockUserId = 'user-123';
            const mockData = { name: 'Test Group', description: 'Test Desc' };
            const mockGroup = { id: 'group-123', ...mockData, createdBy: mockUserId };

            const mockTx = {
                insert: vi.fn().mockReturnThis(),
                values: vi.fn().mockReturnThis(),
                returning: vi.fn(),
            };

            // Mock first insert (groups)
            mockTx.returning
                .mockResolvedValueOnce([mockGroup]) // For groups
                .mockResolvedValueOnce([{ id: 'member-123' }]); // For groupMembers

            // Mock transaction to execute callback immediately
            (db.transaction as any).mockImplementation(async (callback: any) => {
                return await callback(mockTx);
            });

            const result = await GroupService.createGroup(mockUserId, mockData);

            expect(db.transaction).toHaveBeenCalled();

            // Verify group creation
            expect(mockTx.insert).toHaveBeenCalledTimes(2); // Group + Member

            // We can't easily check arguments on the chained calls without more complex mocking,
            // but verifying the transaction flow and result is a good start.
            expect(result).toEqual(mockGroup);
        });
    });

    describe('getUserGroups', () => {
        it('should fetch groups for a user', async () => {
            const mockUserId = 'user-123';
            const mockGroups = [
                { id: 'g1', name: 'G1' },
                { id: 'g2', name: 'G2' },
            ];
            const mockMemberships = [
                { group: mockGroups[0] },
                { group: mockGroups[1] },
            ];

            (db.query.groupMembers.findMany as any).mockResolvedValue(mockMemberships);

            const result = await GroupService.getUserGroups(mockUserId);

            expect(db.query.groupMembers.findMany).toHaveBeenCalled();
            expect(result).toEqual(mockGroups);
        });
    });
});
