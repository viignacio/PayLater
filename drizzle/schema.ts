import { pgTable, foreignKey, unique, uuid, text, numeric, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const inviteStatus = pgEnum("invite_status", ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'])
export const splitType = pgEnum("split_type", ['EQUAL', 'PERCENTAGE', 'EXACT', 'SHARES', 'TEMPLATE'])
export const tripRole = pgEnum("trip_role", ['CREATOR', 'ADMIN', 'MEMBER'])


export const expenseSplits = pgTable("expense_splits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	expenseId: uuid("expense_id").notNull(),
	userId: text("user_id").notNull(),
	amount: numeric().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.expenseId],
			foreignColumns: [expenses.id],
			name: "expense_splits_expense_id_expenses_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "expense_splits_user_id_profiles_id_fk"
		}).onDelete("cascade"),
	unique("expense_splits_expense_id_user_id_unique").on(table.expenseId, table.userId),
]);

export const trips = pgTable("trips", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	currency: text().default('PHP'),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	isActive: boolean("is_active").default(true),
	createdBy: text("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "trips_created_by_profiles_id_fk"
		}),
]);

export const settlements = pgTable("settlements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tripId: uuid("trip_id").notNull(),
	paidBy: text("paid_by").notNull(),
	paidTo: text("paid_to").notNull(),
	amount: numeric().notNull(),
	currency: text().default('PHP'),
	note: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tripId],
			foreignColumns: [trips.id],
			name: "settlements_trip_id_trips_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.paidBy],
			foreignColumns: [profiles.id],
			name: "settlements_paid_by_profiles_id_fk"
		}),
	foreignKey({
			columns: [table.paidTo],
			foreignColumns: [profiles.id],
			name: "settlements_paid_to_profiles_id_fk"
		}),
]);

export const tripMembers = pgTable("trip_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tripId: uuid("trip_id").notNull(),
	userId: text("user_id").notNull(),
	role: tripRole().default('MEMBER'),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tripId],
			foreignColumns: [trips.id],
			name: "trip_members_trip_id_trips_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "trip_members_user_id_profiles_id_fk"
		}).onDelete("cascade"),
	unique("trip_members_trip_id_user_id_unique").on(table.tripId, table.userId),
]);

export const tripInvites = pgTable("trip_invites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tripId: uuid("trip_id").notNull(),
	invitedBy: text("invited_by").notNull(),
	email: text().notNull(),
	role: tripRole().default('MEMBER'),
	status: inviteStatus().default('PENDING'),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tripId],
			foreignColumns: [trips.id],
			name: "trip_invites_trip_id_trips_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [profiles.id],
			name: "trip_invites_invited_by_profiles_id_fk"
		}),
	unique("trip_invites_trip_id_email_unique").on(table.tripId, table.email),
	unique("trip_invites_token_unique").on(table.token),
]);

export const expenses = pgTable("expenses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tripId: uuid("trip_id").notNull(),
	title: text().notNull(),
	description: text(),
	amount: numeric().notNull(),
	currency: text().default('PHP'),
	date: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	paidBy: text("paid_by").notNull(),
	splitType: splitType("split_type").default('EQUAL'),
	isSettled: boolean("is_settled").default(false),
	receiptUrl: text("receipt_url"),
	ocrData: text("ocr_data"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tripId],
			foreignColumns: [trips.id],
			name: "expenses_trip_id_trips_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.paidBy],
			foreignColumns: [profiles.id],
			name: "expenses_paid_by_profiles_id_fk"
		}),
]);

export const profiles = pgTable("profiles", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	avatar: text(),
	qrCode: text("qr_code"),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
