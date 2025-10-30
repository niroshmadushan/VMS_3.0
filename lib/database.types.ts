export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          phone: string | null
          role: 'admin' | 'reception' | 'employee'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          phone?: string | null
          role?: 'admin' | 'reception' | 'employee'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          email?: string | null
          phone?: string | null
          role?: 'admin' | 'reception' | 'employee'
          is_active?: boolean
          updated_at?: string
        }
      }
    }
  }
}