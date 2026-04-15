import { pgTable, text, timestamp, boolean, uuid, numeric, pgEnum, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const tripRoleEnum = pgEnum('trip_role', ['CREATOR', 'ADMIN', 'MEMBER'])
export const splitTypeEnum = pgEnum('split_type', ['EQUAL', 'PERCENTAGE', 'EXACT', 'SHARES', 'TEMPLATE'])
export const inviteStatusEnum = pgEnum('invite_status', ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'])

// Profiles (linked to Clerk userId)
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // Clerk userId
  name: text('name').notNull(),
  avatar: text('avatar'),
  qrCode: text('qr_code'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Trips
export const trips = pgTable('trips', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  currency: text('currency').default('PHP'),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  createdBy: text('created_by').references(() => profiles.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Trip members
export const tripMembers = pgTable('trip_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  role: tripRoleEnum('role').default('MEMBER'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.tripId, t.userId),
}))

// Trip invites
export const tripInvites = pgTable('trip_invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
  invitedBy: text('invited_by').references(() => profiles.id).notNull(),
  email: text('email').notNull(),
  role: tripRoleEnum('role').default('MEMBER'),
  status: inviteStatusEnum('status').default('PENDING'),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.tripId, t.email),
}))

// Expenses
export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  amount: numeric('amount').notNull(),
  currency: text('currency').default('PHP'),
  date: timestamp('date', { withTimezone: true }).defaultNow(),
  paidBy: text('paid_by').references(() => profiles.id).notNull(),
  splitType: splitTypeEnum('split_type').default('EQUAL'),
  isSettled: boolean('is_settled').default(false),
  receiptUrl: text('receipt_url'),
  ocrData: text('ocr_data'), // Storing json as text or use jsonb if supported by driver
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Expense splits
export const expenseSplits = pgTable('expense_splits', {
  id: uuid('id').defaultRandom().primaryKey(),
  expenseId: uuid('expense_id').references(() => expenses.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.expenseId, t.userId),
}))

// Settlements
export const settlements = pgTable('settlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
  paidBy: text('paid_by').references(() => profiles.id).notNull(),
  paidTo: text('paid_to').references(() => profiles.id).notNull(),
  amount: numeric('amount').notNull(),
  currency: text('currency').default('PHP'),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  trips: many(trips),
  memberships: many(tripMembers),
}))

export const tripsRelations = relations(trips, ({ one, many }) => ({
  creator: one(profiles, { fields: [trips.createdBy], references: [profiles.id] }),
  members: many(tripMembers),
  expenses: many(expenses),
}))

export const tripMembersRelations = relations(tripMembers, ({ one }) => ({
  trip: one(trips, { fields: [tripMembers.tripId], references: [trips.id] }),
  user: one(profiles, { fields: [tripMembers.userId], references: [profiles.id] }),
}))

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  trip: one(trips, { fields: [expenses.tripId], references: [trips.id] }),
  payer: one(profiles, { fields: [expenses.paidBy], references: [profiles.id] }),
  splits: many(expenseSplits),
}))

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, { fields: [expenseSplits.expenseId], references: [expenses.id] }),
  user: one(profiles, { fields: [expenseSplits.userId], references: [profiles.id] }),
}))

export const settlementsRelations = relations(settlements, ({ one }) => ({
  trip: one(trips, { fields: [settlements.tripId], references: [trips.id] }),
  payer: one(profiles, { fields: [settlements.paidBy], references: [profiles.id], relationName: 'payer' }),
  receiver: one(profiles, { fields: [settlements.paidTo], references: [profiles.id], relationName: 'receiver' }),
}))
