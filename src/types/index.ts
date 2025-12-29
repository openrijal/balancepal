/**
 * Balance Pal - TypeScript Type Definitions
 */

// ============================================
// User & Profile Types
// ============================================

export interface User {
    id: string;
    email: string;
    name: string;
    profilePictureUrl?: string;
    createdAt: string;
}

export interface Profile {
    id: string;
    email: string;
    name: string;
    profile_picture_url?: string;
    created_at: string;
}

// ============================================
// Group Types
// ============================================

export interface Group {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    createdBy: string;
    createdAt: string;
}

export type MemberRole = 'admin' | 'member';

export interface GroupMember {
    id: string;
    groupId: string;
    userId: string;
    role: MemberRole;
    joinedAt: string;
    user?: User;
}

// ============================================
// Expense Types
// ============================================

export type ExpenseCategory =
    | 'food'
    | 'transport'
    | 'entertainment'
    | 'utilities'
    | 'shopping'
    | 'other';

export interface Expense {
    id: string;
    groupId: string;
    description: string;
    amount: number;
    currency: string;
    paidByUserId: string;
    date: string;
    category: ExpenseCategory;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    paidBy?: User;
    splits?: ExpenseSplit[];
    receipts?: Receipt[];
}

export type SplitType = 'equal' | 'percentage' | 'amount' | 'shares';

export interface ExpenseSplit {
    id: string;
    expenseId: string;
    userId: string;
    amount: number;
    percentage?: number;
    shares?: number;
    paid: boolean;
    user?: User;
}

export interface Receipt {
    id: string;
    expenseId: string;
    imageUrl: string;
    uploadedAt: string;
}

// ============================================
// Balance & Settlement Types
// ============================================

export interface Balance {
    userId: string;
    user?: User;
    totalSpent: number;
    totalOwed: number;
    netBalance: number;
}

export interface Debt {
    fromUserId: string;
    toUserId: string;
    amount: number;
    fromUser?: User;
    toUser?: User;
}

export type PaymentMethod =
    | 'cash'
    | 'venmo'
    | 'paypal'
    | 'zelle'
    | 'bank_transfer'
    | 'other';

export interface Settlement {
    id: string;
    groupId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    proofImageUrl?: string;
    verified: boolean;
    date: string;
    createdAt: string;
    fromUser?: User;
    toUser?: User;
}

// ============================================
// Notification Types
// ============================================

export type NotificationType =
    | 'group_invite'
    | 'expense_added'
    | 'settlement_recorded'
    | 'balance_reminder'
    | 'member_joined';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    read: boolean;
    createdAt: string;
}

// ============================================
// Invitation Types
// ============================================

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface Invitation {
    id: string;
    groupId: string;
    email: string;
    invitedBy: string;
    token: string;
    status: InvitationStatus;
    createdAt: string;
}

// ============================================
// Form Types
// ============================================

export interface CreateExpenseForm {
    description: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    paidByUserId: string;
    notes?: string;
    splitType: SplitType;
    splits: {
        userId: string;
        amount?: number;
        percentage?: number;
        shares?: number;
        included: boolean;
    }[];
}

export interface CreateGroupForm {
    name: string;
    description?: string;
    image?: File;
}

export interface RecordSettlementForm {
    fromUserId: string;
    toUserId: string;
    amount: number;
    date: string;
    paymentMethod: PaymentMethod;
    reference?: string;
    proofImage?: File;
}
