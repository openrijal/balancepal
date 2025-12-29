/**
 * Supabase Database Type Definitions
 * Auto-generated types for database tables
 */

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    name: string;
                    profile_picture_url: string | null;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    name: string;
                    profile_picture_url?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string;
                    profile_picture_url?: string | null;
                    created_at?: string;
                };
            };
            groups: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    image_url: string | null;
                    created_by: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    image_url?: string | null;
                    created_by: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    image_url?: string | null;
                    created_by?: string;
                    created_at?: string;
                };
            };
            group_members: {
                Row: {
                    id: string;
                    group_id: string;
                    user_id: string;
                    role: 'admin' | 'member';
                    joined_at: string;
                };
                Insert: {
                    id?: string;
                    group_id: string;
                    user_id: string;
                    role?: 'admin' | 'member';
                    joined_at?: string;
                };
                Update: {
                    id?: string;
                    group_id?: string;
                    user_id?: string;
                    role?: 'admin' | 'member';
                    joined_at?: string;
                };
            };
            expenses: {
                Row: {
                    id: string;
                    group_id: string;
                    description: string;
                    amount: number;
                    currency: string;
                    paid_by_user_id: string;
                    date: string;
                    category: string;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    group_id: string;
                    description: string;
                    amount: number;
                    currency?: string;
                    paid_by_user_id: string;
                    date: string;
                    category: string;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    group_id?: string;
                    description?: string;
                    amount?: number;
                    currency?: string;
                    paid_by_user_id?: string;
                    date?: string;
                    category?: string;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            expense_splits: {
                Row: {
                    id: string;
                    expense_id: string;
                    user_id: string;
                    amount: number;
                    paid: boolean;
                };
                Insert: {
                    id?: string;
                    expense_id: string;
                    user_id: string;
                    amount: number;
                    paid?: boolean;
                };
                Update: {
                    id?: string;
                    expense_id?: string;
                    user_id?: string;
                    amount?: number;
                    paid?: boolean;
                };
            };
            receipts: {
                Row: {
                    id: string;
                    expense_id: string;
                    image_url: string;
                    uploaded_at: string;
                };
                Insert: {
                    id?: string;
                    expense_id: string;
                    image_url: string;
                    uploaded_at?: string;
                };
                Update: {
                    id?: string;
                    expense_id?: string;
                    image_url?: string;
                    uploaded_at?: string;
                };
            };
            settlements: {
                Row: {
                    id: string;
                    group_id: string;
                    from_user_id: string;
                    to_user_id: string;
                    amount: number;
                    payment_method: string;
                    reference: string | null;
                    proof_image_url: string | null;
                    verified: boolean;
                    date: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    group_id: string;
                    from_user_id: string;
                    to_user_id: string;
                    amount: number;
                    payment_method: string;
                    reference?: string | null;
                    proof_image_url?: string | null;
                    verified?: boolean;
                    date: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    group_id?: string;
                    from_user_id?: string;
                    to_user_id?: string;
                    amount?: number;
                    payment_method?: string;
                    reference?: string | null;
                    proof_image_url?: string | null;
                    verified?: boolean;
                    date?: string;
                    created_at?: string;
                };
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    type: string;
                    title: string;
                    message: string;
                    data: Record<string, unknown> | null;
                    read: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type: string;
                    title: string;
                    message: string;
                    data?: Record<string, unknown> | null;
                    read?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    type?: string;
                    title?: string;
                    message?: string;
                    data?: Record<string, unknown> | null;
                    read?: boolean;
                    created_at?: string;
                };
            };
            invitations: {
                Row: {
                    id: string;
                    group_id: string;
                    email: string;
                    invited_by: string;
                    token: string;
                    status: 'pending' | 'accepted' | 'declined' | 'expired';
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    group_id: string;
                    email: string;
                    invited_by: string;
                    token?: string;
                    status?: 'pending' | 'accepted' | 'declined' | 'expired';
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    group_id?: string;
                    email?: string;
                    invited_by?: string;
                    token?: string;
                    status?: 'pending' | 'accepted' | 'declined' | 'expired';
                    created_at?: string;
                };
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: {
            member_role: 'admin' | 'member';
            expense_category: 'food' | 'transport' | 'entertainment' | 'utilities' | 'shopping' | 'other';
            payment_method: 'cash' | 'venmo' | 'paypal' | 'zelle' | 'bank_transfer' | 'other';
            invitation_status: 'pending' | 'accepted' | 'declined' | 'expired';
        };
    };
}
