// src/types/supabase.ts

export interface Database {
    public: {
      Tables: {
        user_profiles: {
          Row: {
            id: string
            full_name: string
            email: string
            user_type: 'individual' | 'organisation'
            phone?: string | null
            profile_picture?: string | null
            preferences?: Record<string, any> | null
            is_active: boolean
            created_at: string
            updated_at?: string | null
            organisation_id?: string | null
          }
          Insert: {
            id: string
            full_name: string
            email: string
            user_type: 'individual' | 'organisation'
            phone?: string | null
            profile_picture?: string | null
            preferences?: Record<string, any> | null
            is_active?: boolean
            organisation_id?: string | null
          }
          Update: {
            id?: string
            full_name?: string
            email?: string
            user_type?: 'individual' | 'organisation'
            phone?: string | null
            profile_picture?: string | null
            preferences?: Record<string, any> | null
            is_active?: boolean
            organisation_id?: string | null
          }
          Relationships: []
        }
        goals: {
          Row: {
            id: string
            user_id: string
            name: string
            target_amount: number
            current_amount: number
            deadline: string
            category: string
            color: string
            status: string
            created_at: string
            updated_at?: string | null
          }
          Insert: {
            id?: string
            user_id: string
            name: string
            target_amount: number
            current_amount: number
            deadline: string
            category: string
            color: string
            status: string
          }
          Update: {
            user_id?: string
            name?: string
            target_amount?: number
            current_amount?: number
            deadline?: string
            category?: string
            color?: string
            status?: string
          }
          Relationships: []
        }
        goals_history: {
          Row: {
            id: string
            goal_id: string
            user_id: string
            name: string
            target_amount: number
            current_amount: number
            deadline: string
            category: string
            color: string
            status: string
            event_type: string
            event_timestamp: string
            metadata?: Record<string, any> | null
          }
          Insert: {
            id?: string
            goal_id: string
            user_id: string
            name: string
            target_amount: number
            current_amount: number
            deadline: string
            category: string
            color: string
            status: string
            event_type: string
            event_timestamp?: string
            metadata?: Record<string, any> | null
          }
          Update: {
            goal_id?: string
            user_id?: string
            name?: string
            target_amount?: number
            current_amount?: number
            deadline?: string
            category?: string
            color?: string
            status?: string
            event_type?: string
            event_timestamp?: string
            metadata?: Record<string, any> | null
          }
          Relationships: []
        }
        transactions: {
          Row: {
            id: string
            user_id: string
            statement_id: string
            transaction_date: string
            description: string
            amount: number
            type: 'credit' | 'debit'
            balance: number
            category?: string | null
            created_at: string
            updated_at?: string | null
          }
          Insert: {
            id?: string
            user_id: string
            statement_id: string
            transaction_date: string
            description: string
            amount: number
            type: 'credit' | 'debit'
            balance: number
            category?: string | null
          }
          Update: {
            id?: string
            user_id?: string
            statement_id?: string
            transaction_date?: string
            description?: string
            amount?: number
            type?: 'credit' | 'debit'
            balance?: number
            category?: string | null
          }
          Relationships: []
        }
        calculator_history: {
          Row: {
            id: string
            user_id: string
            calculator_type: 'personal_loan' | 'vehicle_finance' | 'mortgage'
            inputs: Record<string, any>
            outputs: Record<string, any>
            metadata?: Record<string, any>
            created_at: string
          }
          Insert: {
            id?: string
            user_id: string
            calculator_type: 'personal_loan' | 'vehicle_finance' | 'mortgage'
            inputs: Record<string, any>
            outputs: Record<string, any>
            metadata?: Record<string, any>
          }
          Update: {
            calculator_type?: 'personal_loan' | 'vehicle_finance' | 'mortgage'
            inputs?: Record<string, any>
            outputs?: Record<string, any>
            metadata?: Record<string, any>
          }
          Relationships: []
        }
      }
      Views: {
        [_ in never]: never
      }
      Functions: {
        add_goal_contribution: {
          Args: {
            p_goal_id: string
            p_amount: number
          }
          Returns: {
            id: string
            name: string
            target_amount: number
            current_amount: number
            deadline: string
            category: string
            color: string
            status: string
            created_at: string
            updated_at: string | null
          }
        }
      }
      Enums: {
        [_ in never]: never
      }
    }
  }
