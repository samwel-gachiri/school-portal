import { DatabaseConnection } from "../config/database";

export interface ChargeData {
  name: string;
  amount: number;
  term: string;
  yearAss: number;
  dateAss: string;
}

export const chargeService = {
  // Get all classes for the dropdown
  async getClasses() {
    const db = DatabaseConnection.getInstance();
    const classes = await db.query(`
      SELECT class_id, name, fees, balance 
      FROM class 
      ORDER BY position ASC, name ASC
    `);
    return classes || [];
  },

  // Get current term and year from school table
  async getCurrentTermYear() {
    const db = DatabaseConnection.getInstance();
    const result = await db.query(`
      SELECT term, year FROM school 
      ORDER BY year DESC, term DESC 
      LIMIT 1
    `);
    return result[0] || { term: "ONE", year: new Date().getFullYear() };
  },

  // Get student charge history
  async getStudentCharges(adm: number) {
    const db = DatabaseConnection.getInstance();
    const charges = await db.query(`
      SELECT charge_id as chargeId, name, amount, balance, term, year_ass as yearAss, date_ass as dateAss
      FROM charges
      WHERE adm = ?
      ORDER BY date_ass DESC, charge_id DESC
    `, [adm]);
    return charges || [];
  },

  // Search for students (reuses logic similar to manual fees)
  async searchStudents(query: string) {
    const db = DatabaseConnection.getInstance();
    const students = await db.query(`
      SELECT 
        s.adm, s.name1, s.name2, s.name3, s.balance, s.class as class_id,
        c.name as class_name
      FROM student s
      LEFT JOIN class c ON s.class = c.class_id
      WHERE s.adm = ? OR s.name1 LIKE ? OR s.name2 LIKE ? OR s.name3 LIKE ?
      ORDER BY s.name1, s.name2
      LIMIT 20
    `, [parseInt(query) || 0, `%${query}%`, `%${query}%`, `%${query}%`]);
    return students || [];
  },

  // Add a single charge to a student
  async createStudentCharge(adm: number, data: ChargeData, userId: number) {
    const db = DatabaseConnection.getInstance();
    
    // Validate amount
    if (data.amount <= 0) {
      throw new Error("Charge amount must be positive");
    }

    return db.transaction(async (conn) => {
      // Get student to check balance
      const [studentResult] = await conn.query(`SELECT balance, class FROM student WHERE adm = ?`, [adm]);
      const rows = studentResult as any[];
      if (!rows || rows.length === 0) {
        throw new Error("Student not found");
      }
      const student = rows[0];

      // A charge INCREASES the balance
      const newBalance = student.balance + data.amount;

      // Insert into charges
      const [chargeResult] = await conn.query(`
        INSERT INTO charges (adm, name, amount, balance, term, year_ass, date_ass)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [adm, data.name.replace(/\s+/g, '_').toUpperCase(), data.amount, newBalance, data.term, data.yearAss, data.dateAss]);

      const chargeId = (chargeResult as any).insertId;

      // Update student balance
      await conn.query(`
        UPDATE student 
        SET balance = ?
        WHERE adm = ?
      `, [newBalance, adm]);

      // Log transaction
      await conn.query(`
        INSERT INTO processing_log (user_id, action_type, details)
        VALUES (?, ?, ?)
      `, [userId, "insert", JSON.stringify({
        type: "CHARGE",
        chargeId,
        adm,
        name: data.name,
        amount: data.amount,
        newBalance
      })]);

      return {
        chargeId,
        adm,
        name: data.name,
        amount: data.amount,
        newBalance,
        term: data.term,
        yearAss: data.yearAss
      };
    });
  },

  // Add charge to entire class
  async createClassCharge(classId: number, data: ChargeData, userId: number) {
    const db = DatabaseConnection.getInstance();

    if (data.amount <= 0) {
      throw new Error("Charge amount must be positive");
    }

    // We don't even need to fetch students first, we can do bulk operations
    return db.transaction(async (conn) => {
      // 1. Bulk update all student balances in the class
      await conn.query(`
        UPDATE student 
        SET balance = balance + ? 
        WHERE class = ?
      `, [data.amount, classId]);

      // 2. Fetch the updated students to insert into charges and logs
      const [studentsResult] = await conn.query(`
        SELECT adm, balance FROM student WHERE class = ?
      `, [classId]);
      
      const students = studentsResult as any[];
      if (!students || students.length === 0) {
        throw new Error("No students found in this class");
      }

      // 3. Bulk insert into charges
      const chargeName = data.name.replace(/\s+/g, '_').toUpperCase();
      const chargesValues = students.map(student => [
        student.adm,
        chargeName,
        data.amount,
        student.balance,
        data.term,
        data.yearAss,
        data.dateAss
      ]);

      await conn.query(`
        INSERT INTO charges (adm, name, amount, balance, term, year_ass, date_ass)
        VALUES ?
      `, [chargesValues]);

      // 4. Bulk insert into processing_log
      const logValues = students.map(student => [
        userId,
        "insert",
        JSON.stringify({
          type: "CLASS_CHARGE",
          classId,
          adm: student.adm,
          amount: data.amount
        })
      ]);

      await conn.query(`
        INSERT INTO processing_log (user_id, action_type, details)
        VALUES ?
      `, [logValues]);

      return { success: true, count: students.length };
    });
  }
};
