import { relations } from "drizzle-orm/relations";
import { expenses, expenseSplits, profiles, trips, settlements, tripMembers, tripInvites } from "./schema";

export const expenseSplitsRelations = relations(expenseSplits, ({one}) => ({
	expense: one(expenses, {
		fields: [expenseSplits.expenseId],
		references: [expenses.id]
	}),
	profile: one(profiles, {
		fields: [expenseSplits.userId],
		references: [profiles.id]
	}),
}));

export const expensesRelations = relations(expenses, ({one, many}) => ({
	expenseSplits: many(expenseSplits),
	trip: one(trips, {
		fields: [expenses.tripId],
		references: [trips.id]
	}),
	profile: one(profiles, {
		fields: [expenses.paidBy],
		references: [profiles.id]
	}),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	expenseSplits: many(expenseSplits),
	trips: many(trips),
	settlements_paidBy: many(settlements, {
		relationName: "settlements_paidBy_profiles_id"
	}),
	settlements_paidTo: many(settlements, {
		relationName: "settlements_paidTo_profiles_id"
	}),
	tripMembers: many(tripMembers),
	tripInvites: many(tripInvites),
	expenses: many(expenses),
}));

export const tripsRelations = relations(trips, ({one, many}) => ({
	profile: one(profiles, {
		fields: [trips.createdBy],
		references: [profiles.id]
	}),
	settlements: many(settlements),
	tripMembers: many(tripMembers),
	tripInvites: many(tripInvites),
	expenses: many(expenses),
}));

export const settlementsRelations = relations(settlements, ({one}) => ({
	trip: one(trips, {
		fields: [settlements.tripId],
		references: [trips.id]
	}),
	profile_paidBy: one(profiles, {
		fields: [settlements.paidBy],
		references: [profiles.id],
		relationName: "settlements_paidBy_profiles_id"
	}),
	profile_paidTo: one(profiles, {
		fields: [settlements.paidTo],
		references: [profiles.id],
		relationName: "settlements_paidTo_profiles_id"
	}),
}));

export const tripMembersRelations = relations(tripMembers, ({one}) => ({
	trip: one(trips, {
		fields: [tripMembers.tripId],
		references: [trips.id]
	}),
	profile: one(profiles, {
		fields: [tripMembers.userId],
		references: [profiles.id]
	}),
}));

export const tripInvitesRelations = relations(tripInvites, ({one}) => ({
	trip: one(trips, {
		fields: [tripInvites.tripId],
		references: [trips.id]
	}),
	profile: one(profiles, {
		fields: [tripInvites.invitedBy],
		references: [profiles.id]
	}),
}));