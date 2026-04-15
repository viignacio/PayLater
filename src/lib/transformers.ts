// Transformers for the UI to consume.
// Now updated to work with Drizzle's camelCase return objects.

export interface Profile {
  id: string
  name: string
  avatar: string | null
  qrCode: string | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface TripMember {
  id: string
  tripId: string
  userId: string
  role: 'CREATOR' | 'ADMIN' | 'MEMBER'
  joinedAt: Date
  user?: Profile
}

export interface Trip {
  id: string
  name: string
  description: string | null
  currency: string
  startDate: Date | null
  endDate: Date | null
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
  creator?: Profile
  members?: TripMember[]
  expenses?: Expense[]
}

export interface ExpenseSplit {
  id: string
  expenseId: string
  userId: string
  amount: number
  createdAt: Date
  user?: Profile
}

export interface Expense {
  id: string
  tripId: string
  title: string
  description: string | null
  amount: number
  currency: string
  date: Date
  paidBy: string
  splitType: string
  isSettled: boolean
  receiptUrl: string | null
  createdAt: Date
  updatedAt: Date
  payer?: Profile
  splits?: ExpenseSplit[]
}

export interface Settlement {
  id: string
  tripId: string
  paidBy: string
  paidTo: string
  amount: number
  currency: string
  note: string | null
  createdAt: Date
  payer?: Profile
  receiver?: Profile
}

export interface TripInvite {
  id: string
  tripId: string
  invitedBy: string
  email: string
  role: 'CREATOR' | 'ADMIN' | 'MEMBER'
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
  token: string
  expiresAt: Date
  createdAt: Date
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProfile(row: any): Profile {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar ?? null,
    qrCode: row.qrCode ?? null,
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toTripMember(row: any): TripMember {
  return {
    id: row.id,
    tripId: row.tripId,
    userId: row.userId,
    role: row.role,
    joinedAt: new Date(row.joinedAt),
    user: row.user ? toProfile(row.user) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toExpenseSplit(row: any): ExpenseSplit {
  return {
    id: row.id,
    expenseId: row.expenseId,
    userId: row.userId,
    amount: Number(row.amount),
    createdAt: new Date(row.createdAt),
    user: row.user ? toProfile(row.user) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toExpense(row: any): Expense {
  return {
    id: row.id,
    tripId: row.tripId,
    title: row.title,
    description: row.description ?? null,
    amount: Number(row.amount),
    currency: row.currency,
    date: new Date(row.date),
    paidBy: row.paidBy,
    splitType: row.splitType,
    isSettled: row.isSettled,
    receiptUrl: row.receiptUrl ?? null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    payer: row.payer ? toProfile(row.payer) : undefined,
    splits: row.splits ? row.splits.map(toExpenseSplit) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toTrip(row: any): Trip {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    currency: row.currency,
    startDate: row.startDate ? new Date(row.startDate) : null,
    endDate: row.endDate ? new Date(row.endDate) : null,
    isActive: row.isActive,
    createdBy: row.createdBy,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    creator: row.creator ? toProfile(row.creator) : undefined,
    members: row.members ? row.members.map(toTripMember) : undefined,
    expenses: row.expenses ? row.expenses.map(toExpense) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toSettlement(row: any): Settlement {
  return {
    id: row.id,
    tripId: row.tripId,
    paidBy: row.paidBy,
    paidTo: row.paidTo,
    amount: Number(row.amount),
    currency: row.currency,
    note: row.note ?? null,
    createdAt: new Date(row.createdAt),
    payer: row.payer ? toProfile(row.payer) : undefined,
    receiver: row.receiver ? toProfile(row.receiver) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toTripInvite(row: any): TripInvite {
  return {
    id: row.id,
    tripId: row.tripId,
    invitedBy: row.invitedBy,
    email: row.email,
    role: row.role,
    status: row.status,
    token: row.token,
    expiresAt: new Date(row.expiresAt),
    createdAt: new Date(row.createdAt),
  }
}
