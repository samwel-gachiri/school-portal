import { DatabaseConnection } from '../config/database';

export interface ReceiptData {
  name: string;
  adm: number;
  payment_id: number;
  term: string;
  year_paid: number;
  amount: number;
  balance: number;
  dop: string;
  bank: string;
  ref: string;
  section?: string;
}

export interface PrintConfig {
  dataname: string;
  font_name: string;
  font_size: number;
  font_color: string;
  locationX: number;
  locationY: number;
}

export interface PrintVar {
  name: string;
  value: string;
}

class ReceiptService {
  private db = DatabaseConnection.getInstance();

  /**
   * Get all unprinted receipts
   */
  async getUnprintedReceipts(): Promise<ReceiptData[]> {
    const query = `
      SELECT pt.name, pt.adm, pt.payment_id, pt.term, pt.year_paid, pt.amount, pt.balance, pt.dop, pt.bank, pt.ref, s.section
      FROM payment pt
      JOIN school s ON 1=1
      ORDER BY pt.dop ASC
    `;

    const receipts = await this.db.query(query);
    return receipts as ReceiptData[];
  }

  /**
   * Get receipts for a specific student
   */
  async getReceiptsByStudent(adm: number): Promise<ReceiptData[]> {
    const query = `
      SELECT pt.name, pt.adm, pt.payment_id, pt.term, pt.year_paid, pt.amount, pt.balance, pt.dop, pt.bank, pt.ref, s.section
      FROM payment pt
      JOIN school s ON 1=1
      WHERE pt.adm = ?
      ORDER BY pt.dop DESC
    `;

    const receipts = await this.db.query(query, [adm]);
    return receipts as ReceiptData[];
  }

  /**
   * Get receipts for a specific term
   */
  async getReceiptsByTerm(term: string, year: number): Promise<ReceiptData[]> {
    const query = `
      SELECT pt.name, pt.adm, pt.payment_id, pt.term, pt.year_paid, pt.amount, pt.balance, pt.dop, pt.bank, pt.ref, s.section
      FROM payment pt
      JOIN school s ON 1=1
      WHERE pt.term = ? AND pt.year_paid = ?
      ORDER BY pt.dop ASC
    `;

    const receipts = await this.db.query(query, [term, year]);
    return receipts as ReceiptData[];
  }

  /**
   * Get receipts for a specific class
   */
  async getReceiptsByClass(className: string): Promise<ReceiptData[]> {
    // Payment table doesn't have class column, return empty array
    return [];
  }

  /**
   * Get previous receipts (already printed)
   */
  async getPreviousReceipts(limit: number = 100): Promise<ReceiptData[]> {
    const query = `
      SELECT pt.name, pt.adm, pt.payment_id, pt.term, pt.year_paid, pt.amount, pt.balance, pt.dop, pt.bank, pt.ref, s.section
      FROM payment pt
      JOIN school s ON 1=1
      ORDER BY pt.dop DESC
      LIMIT ${limit}
    `;

    const receipts = await this.db.queryRaw(query);
    return receipts as ReceiptData[];
  }

  /**
   * Mark receipts as printed
   */
  async markReceiptsAsPrinted(receiptNumbers: number[]): Promise<void> {
    // Payment table doesn't have printed column, skip marking
    console.log(`Would mark ${receiptNumbers.length} payments as printed, but no printed column exists`);
  }

  /**
   * Get print configuration data
   */
  async getPrintConfig(): Promise<Record<string, PrintConfig>> {
    const configs = await this.db.query('SELECT * FROM printdata');

    const configMap: Record<string, PrintConfig> = {};
    (configs as PrintConfig[]).forEach(config => {
      configMap[config.dataname] = config;
    });

    return configMap;
  }

  /**
   * Get print variables
   */
  async getPrintVars(): Promise<Record<string, string>> {
    const vars = await this.db.query('SELECT * FROM printvar');

    const varMap: Record<string, string> = {};
    (vars as PrintVar[]).forEach(v => {
      varMap[v.name] = v.value;
    });

    return varMap;
  }

  /**
   * Get school logo (if exists)
   * Note: The original Java code looked for an 'images' table that doesn't exist
   * We'll need to handle logo differently - perhaps from a file or base64 data
   */
  async getSchoolLogo(): Promise<Buffer | null> {
    try {
      // Try to get from images table if it exists
      const imageResult = await this.db.query('SELECT image_data FROM images LIMIT 1');
      if (imageResult && imageResult.length > 0) {
        return (imageResult[0] as any).image_data;
      }
    } catch (error) {
      // Images table doesn't exist or has different structure
      console.log('Images table not available for logo');
    }

    return null;
  }

  /**
   * Get school information
   */
  async getSchoolInfo(): Promise<any> {
    const schoolInfo = await this.db.query('SELECT * FROM school LIMIT 1');
    return schoolInfo[0] || {};
  }

  /**
   * Get available classes for receipt filtering
   */
  async getAvailableClasses(): Promise<string[]> {
    // Payment table doesn't have class column, return empty array
    return [];
  }

  /**
   * Get available terms for receipt filtering
   */
  async getAvailableTerms(): Promise<{term: string, year: number}[]> {
    const terms = await this.db.query('SELECT DISTINCT term, year_paid as year FROM payment WHERE term IS NOT NULL AND year_paid IS NOT NULL ORDER BY year_paid DESC, term DESC');
    return terms as {term: string, year: number}[];
  }
}

export default new ReceiptService();