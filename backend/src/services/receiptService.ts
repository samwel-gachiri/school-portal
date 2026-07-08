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
  class?: string;
  stream?: string;
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
      SELECT 
        CONCAT_WS(' ', st.name1, st.name2, st.name3) as name,
        pt.adm, 
        pt.payment_id, 
        pt.term, 
        pt.year_paid, 
        pt.amount, 
        pt.balance, 
        pt.dop, 
        pt.bank, 
        pt.ref, 
        s.section,
        st.class,
        st.stream
      FROM payment pt
      JOIN student st ON pt.adm = st.adm
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
      SELECT 
        CONCAT_WS(' ', st.name1, st.name2, st.name3) as name,
        pt.adm, 
        pt.payment_id, 
        pt.term, 
        pt.year_paid, 
        pt.amount, 
        pt.balance, 
        pt.dop, 
        pt.bank, 
        pt.ref, 
        s.section,
        st.class,
        st.stream
      FROM payment pt
      JOIN student st ON pt.adm = st.adm
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
      SELECT 
        CONCAT_WS(' ', st.name1, st.name2, st.name3) as name,
        pt.adm, 
        pt.payment_id, 
        pt.term, 
        pt.year_paid, 
        pt.amount, 
        pt.balance, 
        pt.dop, 
        pt.bank, 
        pt.ref, 
        s.section,
        st.class,
        st.stream
      FROM payment pt
      JOIN student st ON pt.adm = st.adm
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
  async getPreviousReceipts(
    limit: number = 100, 
    options: { classId?: string; term?: string; year?: string; startDate?: string; endDate?: string } = {}
  ): Promise<ReceiptData[]> {
    let query = `
      SELECT 
        CONCAT_WS(' ', st.name1, st.name2, st.name3) as name,
        pt.adm, 
        pt.payment_id, 
        pt.term, 
        pt.year_paid, 
        pt.amount, 
        pt.balance, 
        pt.dop, 
        pt.bank, 
        pt.ref, 
        s.section,
        st.class,
        st.stream,
        p_status.printed as is_printed
      FROM payment pt
      JOIN student st ON pt.adm = st.adm
      LEFT JOIN (SELECT section FROM school LIMIT 1) s ON 1=1
      LEFT JOIN (SELECT receiptNO, MAX(printed) as printed FROM printtable GROUP BY receiptNO) p_status ON pt.payment_id = p_status.receiptNO
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    if (options.classId) {
      query += ` AND st.class = ?`;
      queryParams.push(options.classId);
    }
    if (options.term) {
      query += ` AND pt.term = ?`;
      queryParams.push(options.term);
    }
    if (options.year) {
      query += ` AND pt.year_paid = ?`;
      queryParams.push(options.year);
    }
    if (options.startDate) {
      query += ` AND pt.dop >= ?`;
      queryParams.push(options.startDate);
    }
    if (options.endDate) {
      query += ` AND pt.dop <= ?`;
      queryParams.push(options.endDate);
    }

    query += ` ORDER BY pt.payment_id DESC LIMIT ${limit}`;

    const receipts = await this.db.query(query, queryParams);
    return receipts as ReceiptData[];
  }

  async printReceipts(receiptNumbers: number[]): Promise<void> {
    if (!receiptNumbers || receiptNumbers.length === 0) return;

    const placeholders = receiptNumbers.map(() => '?').join(',');
    const query = `
      SELECT 
        st.name1, st.name2, st.name3,
        pt.adm, 
        pt.payment_id as receiptNO,
        coalesce(c.name, '') as class,
        coalesce(s.name, '') as stream,
        pt.dop,
        pt.term,
        pt.year_paid as year,
        pt.amount,
        pt.balance,
        pt.name as item
      FROM payment pt
      JOIN student st ON pt.adm = st.adm
      JOIN class c on st.class = c.class_id
      LEFT JOIN stream s on st.stream = s.stream_id
      WHERE pt.payment_id IN (${placeholders})
      ORDER BY FIELD(pt.payment_id, ${placeholders})
    `;
    
    const receipts = await this.db.query(query, [...receiptNumbers, ...receiptNumbers]);
    
    if (!receipts || (receipts as any[]).length === 0) return;
    
    console.log(receipts)
    const updateQuery = `UPDATE printtable SET printed = 'yes' WHERE printed = 'no'`;
    await this.db.queryRaw(updateQuery);

    const insertQuery = `
      INSERT INTO printtable 
      (name1, name2, name3, adm, receiptNO, class, stream, dop, term, year, amount, balance, item, print_time, printed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name1=VALUES(name1), name2=VALUES(name2), name3=VALUES(name3), 
        adm=VALUES(adm), class=VALUES(class), stream=VALUES(stream), 
        dop=VALUES(dop), term=VALUES(term), year=VALUES(year), 
        amount=VALUES(amount), balance=VALUES(balance), item=VALUES(item),
        print_time=now(), 
        printed=VALUES(printed)
    `;
    const baseTime = new Date();

    const values = (receipts as any[]).map((r, index) => {
      const printTime = new Date(baseTime.getTime() + index * 1000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

      return [
        r.name1 || '',
        r.name2 || '',
        r.name3 || '',
        r.adm || 0,
        r.receiptNO || 0,
        r.class ? r.class.toString() : '',
        r.stream ? r.stream.toString() : '',
        r.dop ? new Date(r.dop).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        r.term || '',
        r.year || new Date().getFullYear(),
        r.amount?.toString() || '0',
        r.balance?.toString() || '0',
        r.item || '',
        printTime,
        'no'
      ];
    });

    for (const val of values) {
      await this.db.query(insertQuery, val);
    }
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
   * Note: The logo is stored in the 'images' table with name='logo' and image as blob
   */
  async getSchoolLogo(): Promise<Buffer | null> {
    try {
      // Get logo from images table where name='logo'
      const imageResult = await this.db.query('SELECT image FROM images WHERE name = ? LIMIT 1', ['logo']);
      if (imageResult && imageResult.length > 0) {
        return (imageResult[0] as any).image;
      }
    } catch (error) {
      console.log('Images table not available or logo not found:', error);
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