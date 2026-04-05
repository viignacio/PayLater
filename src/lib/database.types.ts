export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar: string | null
          qr_code: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          avatar?: string | null
          qr_code?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar?: string | null
          qr_code?: string | null
          deleted_at?: string | null
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          name: string
          description: string | null
          currency: string
          start_date: string | null
          end_date: string | null
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          currency?: string
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          currency?: string
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      trip_members: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          role: Database['public']['Enums']['trip_role']
          joined_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          role?: Database['public']['Enums']['trip_role']
          joined_at?: string
        }
        Update: {
          role?: Database['public']['Enums']['trip_role']
        }
      }
      trip_invites: {
        Row: {
          id: string
          trip_id: string
          invited_by: string
          email: string
          role: Database['public']['Enums']['trip_role']
          status: Database['public']['Enums']['invite_status']
          token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          invited_by: string
          email: string
          role?: Database['public']['Enums']['trip_role']
          status?: Database['public']['Enums']['invite_status']
          token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          status?: Database['public']['Enums']['invite_status']
        }
      }
      expenses: {
        Row: {
          id: string
          trip_id: string
          title: string
          description: string | null
          amount: number
          currency: string
          date: string
          paid_by: string
          split_type: Database['public']['Enums']['split_type']
          is_settled: boolean
          receipt_url: string | null
          ocr_data: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          title: string
          description?: string | null
          amount: number
          currency?: string
          date?: string
          paid_by: string
          split_type?: Database['public']['Enums']['split_type']
          is_settled?: boolean
          receipt_url?: string | null
          ocr_data?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          amount?: number
          currency?: string
          date?: string
          paid_by?: string
          split_type?: Database['public']['Enums']['split_type']
          is_settled?: boolean
          receipt_url?: string | null
          ocr_data?: Record<string, unknown> | null
          updated_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          amount: number
          created_at?: string
        }
        Update: {
          amount?: number
        }
      }
      settlements: {
        Row: {
          id: string
          trip_id: string
          paid_by: string
          paid_to: string
          amount: number
          currency: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          paid_by: string
          paid_to: string
          amount: number
          currency?: string
          note?: string | null
          created_at?: string
        }
        Update: {
          note?: string | null
        }
      }
    }
    Enums: {
      trip_role: 'CREATOR' | 'ADMIN' | 'MEMBER'
      split_type: 'EQUAL' | 'PERCENTAGE' | 'EXACT' | 'SHARES' | 'TEMPLATE'
      invite_status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
    }
  }
}
