/**
 * ZivonPay Node.js SDK
 * Official SDK for ZivonPay Payment Aggregator
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';

// Types
export interface ZivonPayConfig {
  keyId: string;
  keySecret: string;
  environment?: 'sandbox' | 'production';
  timeout?: number;
  maxRetries?: number;
}

export interface CustomerInfo {
  name: string;
  mobile: string;
  email?: string;
}

export interface OrderCreateRequest {
  amount: number;
  currency?: string;
  receipt: string;
  customer: CustomerInfo;
  notes?: Record<string, any>;
}

export interface Order {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
  upi_intent_url?: string;
  qr_code_url?: string;
  notes: Record<string, any>;
  created_at: number;
  expires_at?: number;
  paid_at?: number;
}

export interface Payment {
  id: string;
  entity: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  payer_vpa?: string;
  rrn?: string;
  transaction_id?: string;
  bank_name?: string;
  error_code?: string;
  error_description?: string;
  created_at: number;
  captured_at?: number;
}

export interface ZivonPayError {
  code: string;
  description: string;
  source: string;
  step?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

// Main SDK Class
export class ZivonPay {
  private client: AxiosInstance;
  private keyId: string;
  private keySecret: string;
  private baseURL: string;

  constructor(config: ZivonPayConfig) {
    this.keyId = config.keyId;
    this.keySecret = config.keySecret;

    // Determine base URL
    this.baseURL =
      config.environment === 'production'
        ? 'https://api.zivonpay.com/v1'
        : 'https://sandbox.api.zivonpay.com/v1';

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config.timeout || 30000,
      auth: {
        username: this.keyId,
        password: this.keySecret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configure retries
    axiosRetry(this.client, {
      retries: config.maxRetries || 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          error.response?.status === 429
        );
      },
    });
  }

  // Orders
  orders = {
    create: async (data: OrderCreateRequest, idempotencyKey?: string): Promise<Order> => {
      try {
        const headers: Record<string, string> = {};
        if (idempotencyKey) {
          headers['X-Idempotency-Key'] = idempotencyKey;
        }

        const response = await this.client.post('/orders', data, { headers });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    fetch: async (orderId: string): Promise<Order> => {
      try {
        const response = await this.client.get(`/orders/${orderId}`);
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    list: async (skip: number = 0, limit: number = 10): Promise<{ entity: string; count: number; data: Order[] }> => {
      try {
        const response = await this.client.get('/orders', {
          params: { skip, limit },
        });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },
  };

  // Payments
  payments = {
    fetch: async (paymentId: string): Promise<Payment> => {
      try {
        const response = await this.client.get(`/payments/${paymentId}`);
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    list: async (skip: number = 0, limit: number = 10): Promise<{ entity: string; count: number; data: Payment[] }> => {
      try {
        const response = await this.client.get('/payments', {
          params: { skip, limit },
        });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },
  };

  // Webhook verification
  verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: number,
    secret: string,
    tolerance: number = 300
  ): boolean {
    const crypto = require('crypto');

    // Check timestamp tolerance
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestamp) > tolerance) {
      return false;
    }

    // Create expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Error handling
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error: ZivonPayError }>;

      if (axiosError.response?.data?.error) {
        const zpError = axiosError.response.data.error;
        const message = `${zpError.code}: ${zpError.description}`;
        const err = new Error(message);
        (err as any).code = zpError.code;
        (err as any).details = zpError;
        return err;
      }

      return new Error(axiosError.message);
    }

    return error;
  }
}

// Export types and main class
export default ZivonPay;
