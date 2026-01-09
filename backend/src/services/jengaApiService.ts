import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import logger from '../utils/logger';

interface JengaAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface JengaTransaction {
  transactionReference: string;
  transactionDate: string;
  amount: number;
  currency: string;
  narration: string;
  depositorName?: string;
  depositorMobile?: string;
  paymentDescription?: string;
}

export class JengaApiService {
  private apiClient: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  
  private readonly baseURL: string;
  private readonly apiKey: string;
  private readonly merchantCode: string;
  private readonly accountNumber: string;

  constructor() {
    this.baseURL = config.jenga.baseUrl || 'https://uat.jengahq.io';
    this.apiKey = config.jenga.apiKey;
    this.merchantCode = config.jenga.merchantCode;
    this.accountNumber = config.jenga.accountNumber;

    this.apiClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Authenticate with Jenga API and get access token
   */
  private async authenticate(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.accessToken && Date.now() < this.tokenExpiresAt) {
        return this.accessToken;
      }

      logger.info('Authenticating with Jenga API...');

      const response = await this.apiClient.post<JengaAuthResponse>(
        '/identity/v2/token',
        {
          merchantCode: this.merchantCode,
          apiKey: this.apiKey,
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;

      logger.info('Jenga API authentication successful');
      return this.accessToken!;
    } catch (error: any) {
      logger.error('Jenga API authentication failed:', error.message);
      throw new Error(`Jenga API authentication failed: ${error.message}`);
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<{ balance: number; currency: string }> {
    try {
      const token = await this.authenticate();

      const response = await this.apiClient.get(
        `/account/v2/accounts/balances/${this.accountNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        balance: response.data.balance,
        currency: response.data.currency,
      };
    } catch (error: any) {
      logger.error('Failed to get account balance:', error.message);
      throw error;
    }
  }

  /**
   * Get account transactions for a date range
   */
  async getAccountTransactions(
    startDate: string,
    endDate: string
  ): Promise<JengaTransaction[]> {
    try {
      const token = await this.authenticate();

      const response = await this.apiClient.post(
        `/account/v2/accounts/transactions`,
        {
          accountNumber: this.accountNumber,
          startDate,
          endDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.transactions || [];
    } catch (error: any) {
      logger.error('Failed to get account transactions:', error.message);
      throw error;
    }
  }

  /**
   * Get mini statement (last 10 transactions)
   */
  async getMiniStatement(): Promise<JengaTransaction[]> {
    try {
      const token = await this.authenticate();

      const response = await this.apiClient.get(
        `/account/v2/accounts/ministatement/${this.accountNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.transactions || [];
    } catch (error: any) {
      logger.error('Failed to get mini statement:', error.message);
      throw error;
    }
  }

  /**
   * Query specific transaction by reference
   */
  async getTransactionByReference(
    reference: string
  ): Promise<JengaTransaction | null> {
    try {
      const token = await this.authenticate();

      const response = await this.apiClient.get(
        `/account/v2/transactions/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get transaction ${reference}:`, error.message);
      return null;
    }
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implement webhook signature verification based on Jenga's specs
    // This is a placeholder - actual implementation depends on Jenga's signature algorithm
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.apiKey)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  /**
   * Parse transaction narration to extract class info
   */
  parseTransactionNarration(narration: string): {
    className?: string;
    additionalInfo?: string;
  } {
    // Extract class from narration (e.g., "PP2", "Grade 5", "Form 3")
    const classMatch = narration.match(/\b(PP[12]|Grade\s*\d+|Form\s*[1-4]|Class\s*\d+)\b/i);
    
    return {
      className: classMatch ? classMatch[1] : undefined,
      additionalInfo: narration,
    };
  }
}

export const jengaApiService = new JengaApiService();
