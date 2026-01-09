import { DatabaseConnection } from '../config/database';
import logger from '../utils/logger';

interface EquityTransaction {
  transaction_ref: string;
  transaction_date: string;
  amount: number;
  currency: string;
  depositor_name?: string;
  depositor_mobile?: string;
  payment_description?: string;
  narration?: string;
}

interface MatchResult {
  matched: boolean;
  student?: {
    adm: number;
    name: string;
    class_id: number;
    balance: number;
  };
  confidence: 'high' | 'medium' | 'low';
  matchMethod: string;
  suggestions?: Array<{
    adm: number;
    name: string;
    class_id: number;
    reason: string;
  }>;
}

export class EquityTransactionService {
  private db = DatabaseConnection.getInstance();

  /**
   * Store new transaction from webhook
   */
  async storeTransaction(transaction: EquityTransaction): Promise<number> {
    try {
      // Check if transaction already exists
      const existing = await this.db.query(
        'SELECT transaction_id FROM equity_transactions WHERE transaction_ref = ?',
        [transaction.transaction_ref]
      );

      if (existing.length > 0) {
        logger.info(`Transaction ${transaction.transaction_ref} already exists`);
        return existing[0].transaction_id;
      }

      // Insert new transaction
      const result = await this.db.query(
        `INSERT INTO equity_transactions 
        (transaction_ref, transaction_date, amount, currency, depositor_name, 
         depositor_mobile, payment_description, narration, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          transaction.transaction_ref,
          transaction.transaction_date,
          transaction.amount,
          transaction.currency,
          transaction.depositor_name,
          transaction.depositor_mobile,
          transaction.payment_description,
          transaction.narration,
        ]
      );

      logger.info(`Stored transaction ${transaction.transaction_ref}`);
      return (result as any).insertId;
    } catch (error: any) {
      logger.error('Failed to store transaction:', error.message);
      throw error;
    }
  }

  /**
   * Auto-match transaction to student
   */
  async autoMatchTransaction(transactionId: number): Promise<MatchResult> {
    try {
      // Get transaction details
      const transactions = await this.db.query(
        `SELECT * FROM equity_transactions WHERE transaction_id = ?`,
        [transactionId]
      );

      if (transactions.length === 0) {
        throw new Error('Transaction not found');
      }

      const transaction = transactions[0];
      let matchResult: MatchResult = {
        matched: false,
        confidence: 'low',
        matchMethod: 'none',
        suggestions: [],
      };

      // Method 1: Match by depositor mobile number
      if (transaction.depositor_mobile) {
        const mobileMatch = await this.matchByMobile(transaction.depositor_mobile);
        if (mobileMatch.matched) {
          matchResult = mobileMatch;
          matchResult.matchMethod = 'mobile_number';
          matchResult.confidence = 'high';
        }
      }

      // Method 2: Match by class and depositor name
      if (!matchResult.matched && transaction.payment_description) {
        const classMatch = await this.matchByClassAndName(
          transaction.payment_description,
          transaction.depositor_name
        );
        if (classMatch.matched) {
          matchResult = classMatch;
          matchResult.matchMethod = 'class_and_name';
          matchResult.confidence = classMatch.suggestions && classMatch.suggestions.length === 1 ? 'high' : 'medium';
        }
      }

      // Method 3: Search suggestions by name only
      if (!matchResult.matched && transaction.depositor_name) {
        const nameMatch = await this.searchByName(transaction.depositor_name);
        if (nameMatch.suggestions && nameMatch.suggestions.length > 0) {
          matchResult = nameMatch;
          matchResult.matchMethod = 'name_similarity';
          matchResult.confidence = 'low';
        }
      }

      // If high confidence match, auto-update the transaction
      if (matchResult.matched && matchResult.confidence === 'high' && matchResult.student) {
        await this.db.query(
          `UPDATE equity_transactions 
           SET status = 'matched', matched_student_adm = ?, matched_at = NOW()
           WHERE transaction_id = ?`,
          [matchResult.student.adm, transactionId]
        );
        logger.info(`Auto-matched transaction ${transaction.transaction_ref} to student ${matchResult.student.adm}`);
      }

      return matchResult;
    } catch (error: any) {
      logger.error('Auto-match failed:', error.message);
      throw error;
    }
  }

  /**
   * Match by mobile number in stuphone table
   */
  private async matchByMobile(mobile: string): Promise<MatchResult> {
    // Clean mobile number (remove country code if present)
    const cleanMobile = mobile.replace(/^254/, '0').replace(/\D/g, '');
    const mobileVariants = [
      mobile,
      cleanMobile,
      '254' + cleanMobile.substring(1),
      '0' + cleanMobile.substring(cleanMobile.length - 9),
    ];

    const students = await this.db.query(
      `SELECT DISTINCT s.adm, CONCAT(s.name1, ' ', s.name2, ' ', s.name3) as name, 
              s.class as class_id, s.balance
       FROM stuphone sp
       JOIN student s ON sp.adm = s.adm
       WHERE sp.phone IN (?, ?, ?, ?)
       LIMIT 1`,
      mobileVariants
    );

    if (students.length > 0) {
      return {
        matched: true,
        student: students[0],
        confidence: 'high',
        matchMethod: 'mobile_number',
      };
    }

    return { matched: false, confidence: 'low', matchMethod: 'mobile_number' };
  }

  /**
   * Match by class code and depositor name
   */
  private async matchByClassAndName(
    classCode: string,
    depositorName?: string
  ): Promise<MatchResult> {
    if (!depositorName) {
      return { matched: false, confidence: 'low', matchMethod: 'class_and_name' };
    }

    // Parse class code (e.g., "PP2", "Grade 5")
    const classMatch = classCode.match(/\b(PP[12]|Grade\s*(\d+)|Form\s*([1-4]))\b/i);
    if (!classMatch) {
      return { matched: false, confidence: 'low', matchMethod: 'class_and_name' };
    }

    // Search for students by name in the specified class
    const nameParts = depositorName.split(/\s+/);
    const nameConditions = nameParts.map(() => `(s.name1 LIKE ? OR s.name2 LIKE ? OR s.name3 LIKE ?)`).join(' AND ');
    const nameParams = nameParts.flatMap(part => [`%${part}%`, `%${part}%`, `%${part}%`]);

    const students = await this.db.query(
      `SELECT s.adm, CONCAT(s.name1, ' ', s.name2, ' ', s.name3) as name,
              s.class as class_id, s.balance, c.class as class_name
       FROM student s
       JOIN class c ON s.class = c.class
       WHERE ${nameConditions}
       AND c.class LIKE ?
       LIMIT 5`,
      [...nameParams, `%${classCode}%`]
    );

    if (students.length === 1) {
      return {
        matched: true,
        student: students[0],
        confidence: 'high',
        matchMethod: 'class_and_name',
      };
    } else if (students.length > 1) {
      return {
        matched: false,
        confidence: 'medium',
        matchMethod: 'class_and_name',
        suggestions: students.map((s: any) => ({
          adm: s.adm,
          name: s.name,
          class_id: s.class_id,
          reason: `Found in class ${s.class_name}`,
        })),
      };
    }

    return { matched: false, confidence: 'low', matchMethod: 'class_and_name' };
  }

  /**
   * Search students by name similarity
   */
  private async searchByName(name: string): Promise<MatchResult> {
    const nameParts = name.split(/\s+/);
    const nameConditions = nameParts.map(() => `(s.name1 LIKE ? OR s.name2 LIKE ? OR s.name3 LIKE ?)`).join(' OR ');
    const nameParams = nameParts.flatMap(part => [`%${part}%`, `%${part}%`, `%${part}%`]);

    const students = await this.db.query(
      `SELECT s.adm, CONCAT(s.name1, ' ', s.name2, ' ', s.name3) as name,
              s.class as class_id, s.balance, c.class as class_name
       FROM student s
       JOIN class c ON s.class = c.class
       WHERE ${nameConditions}
       LIMIT 10`,
      nameParams
    );

    return {
      matched: false,
      confidence: 'low',
      matchMethod: 'name_similarity',
      suggestions: students.map((s: any) => ({
        adm: s.adm,
        name: s.name,
        class_id: s.class_id,
        reason: `Name similarity - ${s.class_name}`,
      })),
    };
  }

  /**
   * Get pending transactions
   */
  async getPendingTransactions(limit: number = 50) {
    return await this.db.query(
      `SELECT * FROM equity_transactions 
       WHERE status IN ('pending', 'matched')
       ORDER BY transaction_date DESC
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Manually match transaction to student
   */
  async manualMatchTransaction(
    transactionId: number,
    studentAdm: number,
    userId: number
  ): Promise<void> {
    await this.db.query(
      `UPDATE equity_transactions 
       SET status = 'matched', matched_student_adm = ?, 
           matched_by_user_id = ?, matched_at = NOW()
       WHERE transaction_id = ?`,
      [studentAdm, userId, transactionId]
    );
    logger.info(`Manually matched transaction ${transactionId} to student ${studentAdm}`);
  }

  /**
   * Post matched transaction as payment
   */
  async postTransaction(transactionId: number, userId: number): Promise<number> {
    try {
      const transactions = await this.db.query(
        `SELECT et.*, s.name1, s.name2, s.name3, s.balance
         FROM equity_transactions et
         JOIN student s ON et.matched_student_adm = s.adm
         WHERE et.transaction_id = ? AND et.status = 'matched'`,
        [transactionId]
      );

      if (transactions.length === 0) {
        throw new Error('Transaction not found or not matched');
      }

      const transaction = transactions[0];

      // Insert payment record
      const paymentResult = await this.db.query(
        `INSERT INTO recvd (adm, paid, recdate, bank, transno, processedby)
         VALUES (?, ?, ?, 'EQUITY_DIRECT', ?, ?)`,
        [
          transaction.matched_student_adm,
          transaction.amount,
          transaction.transaction_date,
          transaction.transaction_ref,
          userId,
        ]
      );

      // Update student balance
      const newBalance = transaction.balance - transaction.amount;
      await this.db.query(
        `UPDATE student SET balance = ? WHERE adm = ?`,
        [newBalance, transaction.matched_student_adm]
      );

      // Update transaction status
      await this.db.query(
        `UPDATE equity_transactions 
         SET status = 'posted', posted_payment_id = ?
         WHERE transaction_id = ?`,
        [(paymentResult as any).insertId, transactionId]
      );

      logger.info(`Posted transaction ${transactionId} as payment ${(paymentResult as any).insertId}`);
      return (paymentResult as any).insertId;
    } catch (error: any) {
      logger.error('Failed to post transaction:', error.message);
      throw error;
    }
  }

  /**
   * Reject transaction
   */
  async rejectTransaction(
    transactionId: number,
    reason: string,
    userId: number
  ): Promise<void> {
    await this.db.query(
      `UPDATE equity_transactions 
       SET status = 'rejected', rejection_reason = ?, matched_by_user_id = ?
       WHERE transaction_id = ?`,
      [reason, userId, transactionId]
    );
    logger.info(`Rejected transaction ${transactionId}: ${reason}`);
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats() {
    const stats = await this.db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'matched' THEN 1 ELSE 0 END) as matched,
        SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as posted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'posted' THEN amount ELSE 0 END) as total_posted_amount
      FROM equity_transactions
      WHERE DATE(transaction_date) = CURDATE()
    `);

    return stats[0];
  }
}

export const equityTransactionService = new EquityTransactionService();
