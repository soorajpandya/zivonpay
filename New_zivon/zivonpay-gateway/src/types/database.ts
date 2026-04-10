export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          legal_business_name: string;
          business_type: string | null;
          customer_facing_business_name: string | null;
          type: string | null;
          reference_id: string | null;
          contact_name: string | null;
          profile: Record<string, any> | null;
          legal_info: Record<string, any> | null;
          brand: Record<string, any> | null;
          status: string | null;
          notes: Record<string, any> | null;
          created_at: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          contact: string | null;
          type: string | null;
          reference_id: string | null;
          active: boolean;
          notes: Record<string, any> | null;
          created_at: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          contact: string | null;
          gstin: string | null;
          notes: Record<string, any> | null;
          created_at: string;
        };
      };
      disputes: {
        Row: {
          id: string;
          payment_id: string | null;
          amount: number;
          currency: string;
          amount_deducted: number;
          reason_code: string | null;
          status: string;
          phase: string | null;
          created_at: string;
        };
      };
      fund_accounts: {
        Row: {
          id: string;
          contact_id: string | null;
          account_type: string;
          active: boolean;
          bank_account: Record<string, any> | null;
          vpa: Record<string, any> | null;
          card: Record<string, any> | null;
          wallet: Record<string, any> | null;
          created_at: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          type: string;
          status: string;
          description: string | null;
          customer_id: string | null;
          amount: number | null;
          currency: string;
          short_url: string | null;
          partial_payment: boolean;
          expire_by: number | null;
          sms_notify: number;
          email_notify: number;
          line_items: Record<string, any> | null;
          notes: Record<string, any> | null;
          created_at: string;
        };
      };
      merchants: {
        Row: {
          id: string;
          name: string;
          bank_account: string | null;
          risk_score: number;
          is_trusted: boolean;
          email: string | null;
          contact: string | null;
          created_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          amount: number;
          currency: string;
          receipt: string | null;
          status: string;
          merchant_id: string | null;
          payment_capture: number | null;
          notes: Record<string, any> | null;
          amount_paid: number;
          amount_due: number | null;
          created_at: string;
        };
      };
      payment_links: {
        Row: {
          id: string;
          amount: number;
          currency: string;
          accept_partial: boolean;
          first_min_partial_amount: number | null;
          status: string;
          description: string | null;
          reference_id: string | null;
          short_url: string | null;
          customer: Record<string, any> | null;
          expire_by: number | null;
          upi_link: boolean;
          options: Record<string, any> | null;
          notes: Record<string, any> | null;
          callback_url: string | null;
          callback_method: string | null;
          created_at: string;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string | null;
          amount: number;
          currency: string;
          status: string;
          method: string | null;
          bank: string | null;
          gateway_ref: string | null;
          notes: Record<string, any> | null;
          metadata: Record<string, any> | null;
          created_at: string;
        };
      };
      payouts: {
        Row: {
          id: string;
          merchant_id: string | null;
          fund_account_id: string | null;
          amount: number;
          currency: string;
          status: string;
          mode: string;
          purpose: string | null;
          reference_id: string | null;
          narration: string | null;
          notes: Record<string, any> | null;
          idempotency_key: string | null;
          created_at: string;
        };
      };
      qr_codes: {
        Row: {
          id: string;
          type: string;
          name: string | null;
          usage: string;
          fixed_amount: boolean;
          payment_amount: number | null;
          description: string | null;
          customer_id: string | null;
          image_url: string | null;
          close_by: number | null;
          status: string;
          payments_amount_received: number;
          payments_count_received: number;
          notes: Record<string, any> | null;
          created_at: string;
        };
      };
      refunds: {
        Row: {
          id: string;
          payment_id: string | null;
          amount: number;
          status: string;
          speed: string;
          receipt: string | null;
          notes: Record<string, any> | null;
          created_at: string;
        };
      };
      settlements: {
        Row: {
          id: string;
          payment_id: string | null;
          vendor_amount: number;
          platform_fee: number;
          status: string;
          created_at: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience type aliases
export type Account = Database['public']['Tables']['accounts']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type PayoutRow = Database['public']['Tables']['payouts']['Row'];
export type QRCode = Database['public']['Tables']['qr_codes']['Row'];
export type Settlement = Database['public']['Tables']['settlements']['Row'];
export type Merchant = Database['public']['Tables']['merchants']['Row'];
export type Refund = Database['public']['Tables']['refunds']['Row'];
export type Dispute = Database['public']['Tables']['disputes']['Row'];
export type PaymentLink = Database['public']['Tables']['payment_links']['Row'];
