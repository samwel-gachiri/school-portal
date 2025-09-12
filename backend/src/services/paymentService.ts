import { DatabaseConnection } from '../config/database';
import { PaymentRecord, ExtractedPayment, StudentMatch } from '../types';
import mysql from 'mysql2/promise';

export interface PaymentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  calculatedBalance: number;
  overpayment: number;
}

export interface BatchPaymentResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  results: PaymentProcessingResult[];
  summary: {
    totalAmount: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
  };
}

export interface PaymentProcessingResult {
  paymentId: string;
  admissionNumber: number;
  success: boolean;
  error?: string;
  paymentRecordId?: number;
  paycountRecordId?: number;
  newBalance: number;
}

export class PaymentService {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  public async validatePayment(
    payment: ExtractedPayment,
    student: StudentMatch
  ): Promise<PaymentValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate payment amount
      if (payment.amount <= 0) {
        errors.push('Payment amount must be positive');
      }

      // Validate transaction reference
      if (!payment.transactionRef || payment.transactionRef.trim().length === 0) {
        errors.push('Transaction reference is required');
      }

      // Check for duplicate transaction reference
      const existingPayments = await this.db.query(
        'SELECT COUNT(*) as count FROM payment WHERE ref = ?',
        [payment.transactionRef]
      );

      if (existingPayments[0]?.count > 0) {
        errors.push(`Transaction reference ${payment.transactionRef} already exists`);
      }

      // Get current student balance and fee structure
      const currentBalance = student.currentBalance || 0;
      const calculatedBalance = Math.max(0, currentBalance - payment.amount);
      const overpayment = payment.amount > currentBalance ? payment.amount - currentBalance : 0;

      // Warnings for overpayments
      if (overpayment > 0) {
        warnings.push(`Payment exceeds current balance by ${overpayment}`);
      }

      // Warning for very large payments
      if (payment.amount > 100000) { // Adjust threshold as needed
        warnings.push('Payment amount is unusually large');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        calculatedBalance,
        overpayment
      };

    } catch (error) {
      console.error('Payment validation error:', error);
      return {
        valid: false,
        errors: ['Failed to validate payment due to database error'],
        warnings: [],
        calculatedBalance: 0,
        overpayment: 0
      };
    }
  }

  public async processBatchPayments(
    paymentRecords: PaymentRecord[],
    userId: number
  ): Promise<BatchPaymentResult> {
    const results: PaymentProcessingResult[] = [];
    let processedCount = 0;
    let failedCount = 0;
    let totalAmount = 0;

    // Process each payment in a transaction
    for (const record of paymentRecords) {
      try {
        const result = await this.db.transaction(async (connection) => {
          return await this.processIndividualPayment(record, userId, connection);
        });

        results.push(result);
        
        if (result.success) {
          processedCount++;
          totalAmount += record.extractedPayment.amount;
        } else {
          failedCount++;
        }

      } catch (error) {
        console.error(`Failed to process payment ${record.extractedPayment.id}:`, error);
        
        results.push({
          paymentId: record.extractedPayment.id,
          admissionNumber: record.matchedStudent?.adm || 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          newBalance: 0
        });
        
        failedCount++;
      }
    }

    return {
      success: processedCount > 0,
      processedCount,
      failedCount,
      results,
      summary: {
        totalAmount,
        totalPayments: paymentRecords.length,
        successfulPayments: processedCount,
        failedPayments: failedCount
      }
    };
  }

  private async processIndividualPayment(
    record: PaymentRecord,
    userId: number,
    connection: mysql.PoolConnection
  ): Promise<PaymentProcessingResult> {
    const payment = record.extractedPayment;
    const student = record.matchedStudent;

    if (!student) {
      throw new Error('No student matched for this payment');
    }

    try {
      // Get current term and year from school settings
      const schoolSettings = await this.executeQuery(
        connection,
        'SELECT term, year FROM school LIMIT 1'
      );

      const currentTerm = schoolSettings[0]?.term || 'Term 1';
      const currentYear = schoolSettings[0]?.year || new Date().getFullYear();

      // Insert into payment table
      const paymentResult = await this.executeQuery(
        connection,
        `INSERT INTO payment (
          name, amount, balance, term, year_paid, date_ass, dop, bank, ref, adm
        ) VALUES (?, ?, ?, ?, ?, CURDATE(), CURDATE(), ?, ?, ?)`,
        [
          `${student.name1} ${student.name2}`.trim(),
          payment.amount,
          record.newBalance,
          currentTerm,
          currentYear,
          'Bank Transfer', // Default bank type
          payment.transactionRef,
          student.adm
        ]
      );

      const paymentId = (paymentResult as any).insertId;

      // Insert into paycount table
      const paycountResult = await this.executeQuery(
        connection,
        `INSERT INTO paycount (
          adm, payment, dop, date_ass, amount, balance, bank, ref, term, year
        ) VALUES (?, ?, CURDATE(), CURDATE(), ?, ?, ?, ?, ?, ?)`,
        [
          student.adm,
          paymentId,
          payment.amount,
          record.newBalance,
          'Bank Transfer',
          payment.transactionRef,
          currentTerm,
          currentYear
        ]
      );

      const paycountId = (paycountResult as any).insertId;

      // Update student balance
      await this.executeQuery(
        connection,
        'UPDATE student SET balance = ? WHERE adm = ?',
        [record.newBalance, student.adm]
      );

      // Update student paycount
      await this.executeQuery(
        connection,
        'UPDATE student SET paycount = paycount + 1 WHERE adm = ?',
        [student.adm]
      );

      // Log the transaction
      await this.executeQuery(
        connection,
        `INSERT INTO processing_log (user_id, action_type, details) 
         VALUES (?, 'insert', ?)`,
        [
          userId,
          JSON.stringify({
            paymentId: payment.id,
            admissionNumber: student.adm,
            amount: payment.amount,
            transactionRef: payment.transactionRef,
            newBalance: record.newBalance,
            overpayment: record.overpayment
          })
        ]
      );

      return {
        paymentId: payment.id,
        admissionNumber: student.adm,
        success: true,
        paymentRecordId: paymentId,
        paycountRecordId: paycountId,
        newBalance: record.newBalance
      };

    } catch (error) {
      console.error('Individual payment processing error:', error);
      throw error;
    }
  }

  private async executeQuery(
    connection: mysql.PoolConnection,
    sql: string,
    params?: any[]
  ): Promise<any> {
    const [result] = await connection.execute(sql, params);
    return result;
  }

  public async getPaymentHistory(
    userId?: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      // Ensure parameters are valid integers
      const validLimit = Math.max(1, Math.min(1000, Math.floor(limit))) || 50;
      const validOffset = Math.max(0, Math.floor(offset)) || 0;

      let sql = `
        SELECT 
          p.payment_id,
          p.name,
          p.amount,
          p.balance,
          p.term,
          p.year_paid,
          p.date_ass,
          p.dop,
          p.bank,
          p.ref,
          p.adm,
          s.name1,
          s.name2,
          s.name3
        FROM payment p
        LEFT JOIN student s ON p.adm = s.adm
      `;

      const params: any[] = [];

      if (userId && typeof userId === 'number' && userId > 0) {
        // If we had user tracking in payments, we'd filter here
        // For now, we'll return all payments
      }

      sql += ` ORDER BY p.dop DESC, p.payment_id DESC LIMIT ${validLimit} OFFSET ${validOffset}`;

      console.log('Payment history SQL:', sql);
      console.log('Payment history params:', params);

      return await this.db.query(sql, params);

    } catch (error) {
      console.error('Get payment history error:', error);
      throw new Error('Failed to retrieve payment history');
    }
  }

  public async getPaymentStatistics(
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      let sql = `
        SELECT 
          COUNT(*) as totalPayments,
          SUM(amount) as totalAmount,
          AVG(amount) as averageAmount,
          MIN(amount) as minAmount,
          MAX(amount) as maxAmount,
          COUNT(DISTINCT adm) as uniqueStudents
        FROM payment
        WHERE 1=1
      `;

      const params: any[] = [];

      if (startDate) {
        sql += ` AND dop >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        sql += ` AND dop <= ?`;
        params.push(endDate);
      }

      const stats = await this.db.query(sql, params);
      return stats[0] || {};

    } catch (error) {
      console.error('Get payment statistics error:', error);
      throw new Error('Failed to retrieve payment statistics');
    }
  }

  public async validateBatchPayments(
    paymentRecords: PaymentRecord[]
  ): Promise<{ valid: boolean; validationResults: any[] }> {
    const validationResults = [];
    let allValid = true;

    for (const record of paymentRecords) {
      if (!record.matchedStudent) {
        validationResults.push({
          paymentId: record.extractedPayment.id,
          valid: false,
          errors: ['No student matched for this payment'],
          warnings: []
        });
        allValid = false;
        continue;
      }

      const validation = await this.validatePayment(
        record.extractedPayment,
        record.matchedStudent
      );

      validationResults.push({
        paymentId: record.extractedPayment.id,
        admissionNumber: record.matchedStudent.adm,
        ...validation
      });

      if (!validation.valid) {
        allValid = false;
      }
    }

    return {
      valid: allValid,
      validationResults
    };
  }
}