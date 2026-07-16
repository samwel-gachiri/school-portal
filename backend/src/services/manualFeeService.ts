import { DatabaseConnection } from "../config/database";

interface PaymentData {
  adm: number;
  bank: string;
  ref?: string;
  amount: number;
  date: string;
  processedBy: number;
}

interface Student {
  adm: number;
  name: string;
  balance: number;
  class_id: number;
  paycount: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const manualFeeService = {
  // Bank reference validation rules
  BANK_RULES: {
    EQUITY: { length: 12, allowLetters: false },
    EQUITY_DIRECT: { length: 10, allowLetters: true },
    KCB: { length: 12, allowLetters: false },
    CHEQUE: { length: 6, allowLetters: true },
    NCBA: { length: 13, allowLetters: false },
    BANK_OF_AFRICA: { length: 7, allowLetters: false },
    SIM_PAY: { length: 10, allowLetters: false },
  },

  processingRefs: new Set<string>(),

  ADMIN_USERS: ["peter", "jane", "admin"],

  async searchStudents(query: string) {
    const db = DatabaseConnection.getInstance();

    // Search by admission number or name
    const students = await db.query(
      `
      SELECT 
        s.adm,
        s.name1,
        s.name2,
        s.name3,
        s.balance,
        s.class,
        s.paycount,
        c.name as class_name
      FROM student s
      LEFT JOIN class c ON s.class = c.class_id
      WHERE 
        s.adm = ? OR
        s.name1 LIKE ? OR
        s.name2 LIKE ? OR
        s.name3 LIKE ?
      ORDER BY s.name1, s.name2
      LIMIT 20
    `,
      [parseInt(query) || 0, `%${query}%`, `%${query}%`, `%${query}%`]
    );

    return students || [];
  },

  async getStudentDetails(adm: number) {
    const db = DatabaseConnection.getInstance();

    const result = await db.query(
      `
      SELECT 
        s.adm,
        s.name1,
        s.name2,
        s.name3,
        s.balance,
        s.class,
        s.paycount,
        c.name as class_name
      FROM student s
      LEFT JOIN class c ON s.class = c.class_id
      WHERE s.adm = ?
    `,
      [adm]
    );

    if (!result || result.length === 0) {
      throw new Error("Student not found");
    }

    return result[0];
  },

  async getPaymentHistory(adm: number) {
    const db = DatabaseConnection.getInstance();

    const payments = await db.query(
      `
      SELECT 
        p.payment_id as id,
        p.bank,
        p.ref,
        p.amount,
        p.dop as date,
        p.balance,
        p.term,
        p.year_paid as year,
        p.date_ass as created_at
      FROM payment p
      WHERE p.adm = ?
      ORDER BY p.date_ass DESC
      LIMIT 10
    `,
      [adm]
    );

    return payments || [];
  },

  validateReference(bank: string, ref: string): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [] };

    if (!ref || ref.trim() === "") {
      result.valid = false;
      result.errors.push("Reference number is required");
      return result;
    }

    const rules = this.BANK_RULES[bank as keyof typeof this.BANK_RULES];
    if (!rules) {
      result.valid = false;
      result.errors.push("Invalid bank selected");
      return result;
    }

    // Check length
    if (ref.length !== rules.length) {
      result.valid = false;
      result.errors.push(
        `${bank} reference must be exactly ${rules.length} characters`
      );
    }

    // Check for letters if not allowed
    if (!rules.allowLetters && /[a-zA-Z]/.test(ref)) {
      result.valid = false;
      result.errors.push(`${bank} reference cannot contain letters`);
    }

    // Check if only digits (for non-letter banks)
    if (!rules.allowLetters && !/^\d+$/.test(ref)) {
      result.valid = false;
      result.errors.push(`${bank} reference must contain only digits`);
    }

    return result;
  },

  async checkReferenceUniqueness(bank: string, ref: string): Promise<boolean> {
    const db = DatabaseConnection.getInstance();

    const existing = await db.query(
      `
      SELECT payment_id FROM payment 
      WHERE bank = ? AND ref = ?
    `,
      [bank, ref]
    );

    return existing.length === 0;
  },

  async checkDuplicatePayment(
    adm: number,
    ref: string,
    bank: string
  ): Promise<any> {
    const db = DatabaseConnection.getInstance();

    const duplicate = await db.query(
      `
      SELECT * FROM payment 
      WHERE adm = ? AND ref = ? AND bank = ?
    `,
      [adm, ref, bank]
    );

    return duplicate[0] || null;
  },

  validateDate(dateStr: string): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [] };

    const date = new Date(dateStr);
    const today = new Date();

    // Check if valid date
    if (isNaN(date.getTime())) {
      result.valid = false;
      result.errors.push("Invalid date format");
      return result;
    }

    // Check if future date
    if (date > today) {
      result.valid = false;
      result.errors.push("Payment date cannot be in the future");
    }

    return result;
  },

  async isAdminUser(username: string): Promise<boolean> {
    return this.ADMIN_USERS.includes(username.toLowerCase());
  },

  async getCurrentTermYear(): Promise<{ term: number; year: number }> {
    const db = DatabaseConnection.getInstance();

    const result = await db.query(`
      SELECT term, year FROM school 
      ORDER BY year DESC, term DESC 
      LIMIT 1
    `);

    return result[0] || { term: 1, year: new Date().getFullYear() };
  },

  async createPayment(
    paymentData: PaymentData,
    username: string
  ): Promise<any> {
    const db = DatabaseConnection.getInstance();

    const refKey = paymentData.ref ? `${paymentData.bank}-${paymentData.ref}` : null;
    if (refKey && paymentData.bank !== "CHEQUE") {
      if (this.processingRefs.has(refKey)) {
        throw new Error("Payment with this reference is already being processed");
      }
      this.processingRefs.add(refKey);
    }

    try {
      // Get student details
      const student = await this.getStudentDetails(paymentData.adm);

    // Validate reference if provided
    if (paymentData.ref) {
      const refValidation = this.validateReference(
        paymentData.bank,
        paymentData.ref
      );
      if (!refValidation.valid) {
        throw new Error(refValidation.errors.join(", "));
      }

      // Check uniqueness
      const isUnique = await this.checkReferenceUniqueness(
        paymentData.bank,
        paymentData.ref
      );
      if (!isUnique) {
        // Check if it's a duplicate for same student (allowed for CHEQUE)
        if (paymentData.bank !== "CHEQUE") {
          throw new Error("Reference number already exists");
        }

        const duplicate = await this.checkDuplicatePayment(
          paymentData.adm,
          paymentData.ref,
          paymentData.bank
        );
        if (!duplicate) {
          throw new Error(
            "Reference number already exists for different student"
          );
        }
      }
    } else {
      // Check if user is admin (can create payments without reference)
      const isAdmin = await this.isAdminUser(username);
      if (!isAdmin) {
        throw new Error(
          "Only admin users can create payments without reference number"
        );
      }
    }

    // Validate date
    const dateValidation = this.validateDate(paymentData.date);
    if (!dateValidation.valid) {
      throw new Error(dateValidation.errors.join(", "));
    }

    // Validate amount
    if (paymentData.amount <= 0) {
      throw new Error("Payment amount must be positive");
    }

    // Get current term/year
    const { term, year } = await this.getCurrentTermYear();

    // Calculate new balance
    const newBalance = student.balance - paymentData.amount;

    // Start transaction
    await db.queryRaw("START TRANSACTION");

    try {
      // Insert payment record
      const paymentResult = await db.query(
        `
        INSERT INTO payment (adm, bank, ref, amount, dop, balance, term, year_paid, name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          paymentData.adm,
          paymentData.bank,
          paymentData.ref || null,
          paymentData.amount,
          paymentData.date,
          newBalance,
          term,
          year,
          'SCHOOL_FEES',
        ]
      );

      const paymentId = (paymentResult as any).insertId;

      // Update student balance and paycount
      await db.query(
        `
        UPDATE student 
        SET balance = ?, paycount = paycount + 1 
        WHERE adm = ?
      `,
        [newBalance, paymentData.adm]
      );

      // Update class balance
      await db.query(
        `
        UPDATE class 
        SET balance = balance - ? 
        WHERE class_id = ?
      `,
        [paymentData.amount, student.class]
      );

      // Update school totals (skip for now as table structure is different)
      // await db.query(
      //   `
      //   UPDATE school
      //   SET paid = paid + ?, balance = balance - ?
      //   WHERE year = ? AND term = ?
      //   `,
      //   [paymentData.amount, paymentData.amount, year, term]
      // );

      // Insert paycount record
      await db.query(
        `
        INSERT INTO paycount (adm, payment, amount, balance, term, year, bank, ref, dop, date_ass)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          paymentData.adm,
          paymentId,
          paymentData.amount,
          newBalance,
          term,
          year,
          paymentData.bank,
          paymentData.ref || null,
          paymentData.date,
          new Date().toISOString().split('T')[0], // date_ass
        ]
      );

      // Log the transaction
      await db.query(
        `
        INSERT INTO processing_log (user_id, action_type, details)
        VALUES (?, ?, ?)
      `,
        [
          paymentData.processedBy,
          "insert",
          JSON.stringify({
            payment_id: paymentId,
            adm: paymentData.adm,
            amount: paymentData.amount,
            bank: paymentData.bank,
            ref: paymentData.ref,
          }),
        ]
      );

      await db.queryRaw("COMMIT");

      return {
        id: paymentId,
        adm: paymentData.adm,
        studentName: `${student.name1} ${student.name2} ${student.name3}`.trim(),
        amount: paymentData.amount,
        bank: paymentData.bank,
        ref: paymentData.ref,
        date: paymentData.date,
        previousBalance: student.balance,
        newBalance: newBalance,
        term,
        year,
      };
    } catch (error) {
      await db.queryRaw("ROLLBACK");
      throw error;
    }
    
    } finally {
      const refKey = paymentData.ref ? `${paymentData.bank}-${paymentData.ref}` : null;
      if (refKey && paymentData.bank !== "CHEQUE") {
        this.processingRefs.delete(refKey);
      }
    }
  },

  async getBankTypes() {
    return [
      { id: "EQUITY", name: "Equity Bank", format: "12 digits" },
      { id: "EQUITY_DIRECT", name: "Equity Direct", format: "10 characters" },
      { id: "KCB", name: "KCB Bank", format: "12 digits" },
      { id: "CHEQUE", name: "Cheque", format: "6 characters" },
      { id: "NCBA", name: "NCBA Bank", format: "13 digits" },
      { id: "BANK_OF_AFRICA", name: "Bank of Africa", format: "7 digits" },
      { id: "SIM_PAY", name: "Sim Pay", format: "10 digits" },
    ];
  },
};
