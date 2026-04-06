// Transforms Supabase row shapes (snake_case) to the camelCase shapes
// consumed by UI components and the balance calculator.

export interface Profile {
  id: string
  name: string
  avatar: string | null
  qrCode: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TripMember {
  id: string
  tripId: string
  userId: string
  role: 'CREATOR' | 'ADMIN' | 'MEMBER'
  joinedAt: string
  user?: Profile
}

export interface Trip {
  id: string
  name: string
  description: string | null
  currency: string
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  creator?: Profile
  members?: TripMember[]
  expenses?: Expense[]
}

export interface ExpenseSplit {
  id: string
  expenseId: string
  userId: string
  amount: number
  createdAt: string
  user?: Profile
}

export interface Expense {
  id: string
  tripId: string
  title: string
  description: string | null
  amount: number
  currency: string
  date: string
  paidBy: string
  splitType: string
  isSettled: boolean
  receiptUrl: string | null
  createdAt: string
  updatedAt: string
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
  createdAt: string
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
  expiresAt: string
  createdAt: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProfile(row: any): Profile {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar ?? null,
    qrCode: row.qr_code ?? null,
    deletedAt: row.deleted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toTripMember(row: any): TripMember {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    user: row.user ? toProfile(row.user) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toExpenseSplit(row: any): ExpenseSplit {
  return {
    id: row.id,
    expenseId: row.expense_id,
    userId: row.user_id,
    amount: Number(row.amount),
    createdAt: row.created_at,
    user: row.user ? toProfile(row.user) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toExpense(row: any): Expense {
  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title,
    description: row.description ?? null,
    amount: Number(row.amount),
    currency: row.currency,
    date: row.date,
    paidBy: row.paid_by,
    splitType: row.split_type,
    isSettled: row.is_settled,
    receiptUrl: row.receipt_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    creator: row.creator ? toProfile(row.creator) : undefined,
    members: row.members ? row.members.map(toTripMember) : undefined,
    expenses: row.expenses ? row.expenses.map(toExpense) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toSettlement(row: any): Settlement {
  return {
    id: row.id,
    tripId: row.trip_id,
    paidBy: row.paid_by,
    paidTo: row.paid_to,
    amount: Number(row.amount),
    currency: row.currency,
    note: row.note ?? null,
    createdAt: row.created_at,
    payer: row.payer ? toProfile(row.payer) : undefined,
    receiver: row.receiver ? toProfile(row.receiver) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toTripInvite(row: any): TripInvite {
  return {
    id: row.id,
    tripId: row.trip_id,
    invitedBy: row.invited_by,
    email: row.email,
    role: row.role,
    status: row.status,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }
}
