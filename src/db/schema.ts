import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  decimal,
  boolean,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// Enums
// ============================================

export const memberRoleEnum = pgEnum('member_role', ['admin', 'member']);

export const expenseCategoryEnum = pgEnum('expense_category', [
  'food',
  'transport',
  'entertainment',
  'utilities',
  'shopping',
  'other',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'venmo',
  'paypal',
  'zelle',
  'bank_transfer',
  'other',
]);

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'declined',
  'expired',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'group_invite',
  'expense_added',
  'settlement_recorded',
  'balance_reminder',
  'member_joined',
]);

// ============================================
// Tables
// ============================================

/**
 * User profiles - linked to Supabase Auth users
 */
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // References auth.users.id
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  profilePictureUrl: text('profile_picture_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Expense groups
 */
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Group membership with roles
 */
export const groupMembers = pgTable(
  'group_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').default('member').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('group_members_group_id_idx').on(table.groupId),
    index('group_members_user_id_idx').on(table.userId),
  ]
);

/**
 * Expense records
 */
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 500 }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    paidByUserId: uuid('paid_by_user_id')
      .notNull()
      .references(() => profiles.id),
    date: timestamp('date', { withTimezone: true }).notNull(),
    category: expenseCategoryEnum('category').default('other').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('expenses_group_id_date_idx').on(table.groupId, table.date),
    index('expenses_paid_by_user_id_idx').on(table.paidByUserId),
  ]
);

/**
 * How expenses are split among members
 */
export const expenseSplits = pgTable(
  'expense_splits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseId: uuid('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    paid: boolean('paid').default(false).notNull(),
  },
  (table) => [
    index('expense_splits_expense_id_idx').on(table.expenseId),
    index('expense_splits_user_id_idx').on(table.userId),
  ]
);

/**
 * Receipt images for expenses
 */
export const receipts = pgTable(
  'receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseId: uuid('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    imageUrl: text('image_url').notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('receipts_expense_id_idx').on(table.expenseId)]
);

/**
 * Settlement/payment records
 */
export const settlements = pgTable(
  'settlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    fromUserId: uuid('from_user_id')
      .notNull()
      .references(() => profiles.id),
    toUserId: uuid('to_user_id')
      .notNull()
      .references(() => profiles.id),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    reference: varchar('reference', { length: 255 }),
    proofImageUrl: text('proof_image_url'),
    verified: boolean('verified').default(false).notNull(),
    date: timestamp('date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('settlements_group_id_idx').on(table.groupId),
    index('settlements_from_user_id_idx').on(table.fromUserId),
    index('settlements_to_user_id_idx').on(table.toUserId),
  ]
);

/**
 * User notifications
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    data: jsonb('data'),
    read: boolean('read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('notifications_user_id_read_idx').on(table.userId, table.read)]
);

/**
 * Group invitations
 */
export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => profiles.id),
    token: varchar('token', { length: 64 }).notNull().unique(),
    status: invitationStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('invitations_group_id_idx').on(table.groupId),
    index('invitations_email_idx').on(table.email),
    index('invitations_token_idx').on(table.token),
  ]
);

// ============================================
// Relations (for Drizzle query builder)
// ============================================

export const profilesRelations = relations(profiles, ({ many }) => ({
  groups: many(groupMembers),
  expenses: many(expenses),
  notifications: many(notifications),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  createdByUser: one(profiles, {
    fields: [groups.createdBy],
    references: [profiles.id],
  }),
  members: many(groupMembers),
  expenses: many(expenses),
  settlements: many(settlements),
  invitations: many(invitations),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(profiles, {
    fields: [groupMembers.userId],
    references: [profiles.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  group: one(groups, {
    fields: [expenses.groupId],
    references: [groups.id],
  }),
  paidBy: one(profiles, {
    fields: [expenses.paidByUserId],
    references: [profiles.id],
  }),
  splits: many(expenseSplits),
  receipts: many(receipts),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
  user: one(profiles, {
    fields: [expenseSplits.userId],
    references: [profiles.id],
  }),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  expense: one(expenses, {
    fields: [receipts.expenseId],
    references: [expenses.id],
  }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  group: one(groups, {
    fields: [settlements.groupId],
    references: [groups.id],
  }),
  fromUser: one(profiles, {
    fields: [settlements.fromUserId],
    references: [profiles.id],
  }),
  toUser: one(profiles, {
    fields: [settlements.toUserId],
    references: [profiles.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  group: one(groups, {
    fields: [invitations.groupId],
    references: [groups.id],
  }),
  invitedByUser: one(profiles, {
    fields: [invitations.invitedBy],
    references: [profiles.id],
  }),
}));
