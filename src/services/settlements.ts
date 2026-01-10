import { db } from '@/db';
import { settlements } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export interface CreateSettlementData {
  fromUserId: string;
  toUserId: string;
  amount: number;
  paymentMethod: 'cash' | 'venmo' | 'paypal' | 'zelle' | 'bank_transfer' | 'other';
  reference?: string;
}

export class SettlementService {
  static async createSettlement(groupId: string, data: CreateSettlementData) {
    const [newSettlement] = await db
      .insert(settlements)
      .values({
        groupId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        amount: data.amount.toString(),
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        verified: false, // Default to unverified until approved? Or auto-verify for now.
        // For MVP let's assume if I say I paid, it's recorded. Verification is a V2 feature.
        date: new Date(),
      })
      .returning();

    return newSettlement;
  }

  static async getGroupSettlements(groupId: string) {
    return await db.query.settlements.findMany({
      where: eq(settlements.groupId, groupId),
      with: {
        fromUser: true,
        toUser: true,
      },
      orderBy: [desc(settlements.date)],
    });
  }
}
