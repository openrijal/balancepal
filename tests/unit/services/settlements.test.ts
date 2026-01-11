import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettlementService } from '@/services/settlements';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(),
    query: {
      settlements: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe('SettlementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSettlement', () => {
    it('should create a settlement with all provided data', async () => {
      const mockGroupId = 'group-123';
      const mockData = {
        fromUserId: 'user-1',
        toUserId: 'user-2',
        amount: 50,
        paymentMethod: 'venmo' as const,
        reference: 'Payment for dinner',
      };

      const mockSettlement = {
        id: 'settlement-123',
        groupId: mockGroupId,
        fromUserId: mockData.fromUserId,
        toUserId: mockData.toUserId,
        amount: '50',
        paymentMethod: 'venmo',
        reference: 'Payment for dinner',
        verified: false,
        date: new Date(),
      };

      const mockChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSettlement]),
      };

      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

      const result = await SettlementService.createSettlement(mockGroupId, mockData);

      expect(db.insert).toHaveBeenCalled();
      expect(result).toEqual(mockSettlement);
      expect(result.fromUserId).toBe(mockData.fromUserId);
      expect(result.toUserId).toBe(mockData.toUserId);
      expect(result.amount).toBe('50');
      expect(result.paymentMethod).toBe('venmo');
    });

    it('should create a settlement without reference when not provided', async () => {
      const mockGroupId = 'group-123';
      const mockData = {
        fromUserId: 'user-1',
        toUserId: 'user-2',
        amount: 100,
        paymentMethod: 'cash' as const,
      };

      const mockSettlement = {
        id: 'settlement-456',
        groupId: mockGroupId,
        fromUserId: mockData.fromUserId,
        toUserId: mockData.toUserId,
        amount: '100',
        paymentMethod: 'cash',
        reference: undefined,
        verified: false,
        date: new Date(),
      };

      const mockChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSettlement]),
      };

      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

      const result = await SettlementService.createSettlement(mockGroupId, mockData);

      expect(result.reference).toBeUndefined();
    });

    it('should default verified to false', async () => {
      const mockGroupId = 'group-123';
      const mockData = {
        fromUserId: 'user-1',
        toUserId: 'user-2',
        amount: 25,
        paymentMethod: 'zelle' as const,
      };

      const mockSettlement = {
        id: 'settlement-789',
        groupId: mockGroupId,
        fromUserId: mockData.fromUserId,
        toUserId: mockData.toUserId,
        amount: '25',
        paymentMethod: 'zelle',
        verified: false,
        date: new Date(),
      };

      const mockChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockSettlement]),
      };

      (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

      const result = await SettlementService.createSettlement(mockGroupId, mockData);

      expect(result.verified).toBe(false);
    });
  });

  describe('getGroupSettlements', () => {
    it('should fetch all settlements for a group with user info', async () => {
      const mockGroupId = 'group-123';
      const mockSettlements = [
        {
          id: 'settlement-1',
          groupId: mockGroupId,
          fromUserId: 'user-1',
          toUserId: 'user-2',
          amount: '50',
          paymentMethod: 'venmo',
          fromUser: { id: 'user-1', name: 'Alice' },
          toUser: { id: 'user-2', name: 'Bob' },
          date: new Date('2024-01-15'),
        },
        {
          id: 'settlement-2',
          groupId: mockGroupId,
          fromUserId: 'user-2',
          toUserId: 'user-3',
          amount: '30',
          paymentMethod: 'cash',
          fromUser: { id: 'user-2', name: 'Bob' },
          toUser: { id: 'user-3', name: 'Charlie' },
          date: new Date('2024-01-10'),
        },
      ];

      (db.query.settlements.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSettlements
      );

      const result = await SettlementService.getGroupSettlements(mockGroupId);

      expect(db.query.settlements.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockSettlements);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no settlements exist', async () => {
      const mockGroupId = 'group-456';

      (db.query.settlements.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await SettlementService.getGroupSettlements(mockGroupId);

      expect(result).toEqual([]);
    });
  });
});
