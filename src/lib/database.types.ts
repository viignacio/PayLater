export type Database = {
  public: {
    Tables: {
      profiles: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      trips: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      trip_members: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      trip_invites: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      expenses: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      expense_splits: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      settlements: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
    }
    Enums: {
      trip_role: 'CREATOR' | 'ADMIN' | 'MEMBER'
      split_type: 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'SHARES' | 'TEMPLATE'
      invite_status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
    }
  }
}
