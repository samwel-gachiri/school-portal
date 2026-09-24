import { DatabaseConnection } from "../config/database";
import { smsService } from "./smsService";
import logger from "../utils/logger";

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

  // Get all streams
  async getStreams() {
    const db = DatabaseConnection.getInstance();
    const streams = await db.query(`
      SELECT stream_id, name, class 
      FROM stream 
      ORDER BY name ASC
    `);
    return streams || [];
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
      let newBalance = Number(student.balance) + data.amount;

      // Insert into charges
      const [chargeResult] = await conn.query(`
        INSERT INTO charges (adm, name, amount, balance, term, year_ass, date_ass)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [adm, data.name.replace(/\s+/g, '_').toUpperCase(), data.amount, newBalance, data.term, data.yearAss, data.dateAss]);

      const chargeId = (chargeResult as any).insertId;

      // Update student balance from ledger recalculation
      await conn.query(`
        UPDATE student s 
        SET s.balance = (
          COALESCE((SELECT SUM(c.amount) FROM charges c WHERE c.adm = s.adm), 0)    
          -     
          COALESCE((SELECT SUM(p.amount) FROM payment p WHERE p.adm = s.adm), 0)
        )
        WHERE s.adm = ?
      `, [adm]);

      const [updatedStudent] = await conn.query(`SELECT balance FROM student WHERE adm = ?`, [adm]);
      newBalance = Number((updatedStudent as any)?.[0]?.balance ?? 0);

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
      // 1. Fetch the students in the class
      const [studentsResult] = await conn.query(`
        SELECT adm, balance FROM student WHERE class = ?
      `, [classId]);
      
      const students = studentsResult as any[];
      if (!students || students.length === 0) {
        throw new Error("No students found in this class");
      }

      // 2. Bulk insert into charges
      const chargeName = data.name.replace(/\s+/g, '_').toUpperCase();
      const chargesValues = students.map(student => [
        student.adm,
        chargeName,
        data.amount,
        Number(student.balance) + data.amount,
        data.term,
        data.yearAss,
        data.dateAss
      ]);

      await conn.query(`
        INSERT INTO charges (adm, name, amount, balance, term, year_ass, date_ass)
        VALUES ?
      `, [chargesValues]);

      // 3. Recalculate student balances from ledger source of truth
      await conn.query(`
        UPDATE student s SET s.balance = (
          COALESCE((SELECT SUM(c.amount) FROM charges c WHERE c.adm = s.adm), 0)    
          -     
          COALESCE((SELECT SUM(p.amount) FROM payment p WHERE p.adm = s.adm), 0)
        )
        WHERE s.class = ?
      `, [classId]);

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
  },

  async updateCharge(
    chargeId: number,
    data: { name: string; amount: number; term: string; yearAss: number; dateAss: string; reason?: string },
    userId: number,
    username: string = 'admin'
  ) {
    const db = DatabaseConnection.getInstance();

    if (data.amount <= 0) {
      throw new Error("Charge amount must be positive");
    }

    const existingCharges = await db.query(
      `SELECT * FROM charges WHERE charge_id = ?`,
      [chargeId]
    );
    if (!existingCharges || existingCharges.length === 0) {
      throw new Error("Charge not found");
    }
    const currentCharge = existingCharges[0];

    const studentResult = await db.query(
      `SELECT adm, name1, name2, name3, class, balance FROM student WHERE adm = ?`,
      [currentCharge.adm]
    );
    if (!studentResult || studentResult.length === 0) {
      throw new Error("Student not found");
    }
    const student = studentResult[0];

    const amountDiff = data.amount - Number(currentCharge.amount);
    const chargeName = data.name.replace(/\s+/g, '_').toUpperCase();

    return db.transaction(async (conn) => {
      // 1. Update the charge record
      await conn.query(
        `
        UPDATE charges 
        SET name = ?, amount = ?, term = ?, year_ass = ?, date_ass = ? 
        WHERE charge_id = ?
      `,
        [chargeName, data.amount, data.term, data.yearAss, data.dateAss, chargeId]
      );

      // 2. Recalculate student balance from ledger source of truth
      await conn.query(
        `
        UPDATE student s 
        SET s.balance = (
          COALESCE((SELECT SUM(c.amount) FROM charges c WHERE c.adm = s.adm), 0)    
          -     
          COALESCE((SELECT SUM(p.amount) FROM payment p WHERE p.adm = s.adm), 0)
        )
        WHERE s.adm = ?
      `,
        [currentCharge.adm]
      );

      // 3. Fetch exact recalculated student balance
      const [updatedStudent] = await conn.query(
        `SELECT balance FROM student WHERE adm = ?`,
        [currentCharge.adm]
      );
      const newStudentBalance = Number((updatedStudent as any)?.[0]?.balance ?? 0);

      // 4. Update running balance on charges table for this record
      await conn.query(
        `UPDATE charges SET balance = ? WHERE charge_id = ?`,
        [newStudentBalance, chargeId]
      );

      // 5. Update class balance
      if (student.class) {
        await conn.query(
          `UPDATE class SET balance = balance + ? WHERE class_id = ?`,
          [amountDiff, student.class]
        );
      }

      // 6. Log transaction into processing_log
      await conn.query(
        `
        INSERT INTO processing_log (user_id, action_type, details)
        VALUES (?, 'update', ?)
      `,
        [
          userId,
          JSON.stringify({
            action: "edit_charge",
            charge_id: chargeId,
            adm: currentCharge.adm,
            old: {
              name: currentCharge.name,
              amount: currentCharge.amount,
              term: currentCharge.term,
              yearAss: currentCharge.year_ass,
              dateAss: currentCharge.date_ass,
            },
            new: {
              name: chargeName,
              amount: data.amount,
              term: data.term,
              yearAss: data.yearAss,
              dateAss: data.dateAss,
            },
            amountDiff,
            newBalance: newStudentBalance,
            reason: data.reason || null,
          }),
        ]
      );

      // 7. Dispatch SMS notification asynchronously (non-blocking)
      smsService
        .notifyChargeModified({
          chargeId,
          adm: currentCharge.adm,
          studentName: `${student.name1} ${student.name2} ${student.name3 || ''}`.trim(),
          username,
          reason: data.reason,
          oldAmount: Number(currentCharge.amount),
          newAmount: Number(data.amount),
          chargeName,
          newBalance: newStudentBalance,
        })
        .catch((smsErr) => {
          logger.error(`Error sending charge modified SMS alert: ${smsErr.message || smsErr}`);
        });

      return {
        chargeId,
        adm: currentCharge.adm,
        name: chargeName,
        amount: data.amount,
        newBalance: newStudentBalance,
      };
    });
  },

  async deleteCharge(
    chargeId: number,
    userId: number,
    username: string = 'admin',
    reason?: string
  ) {
    const db = DatabaseConnection.getInstance();

    const existingCharges = await db.query(
      `SELECT * FROM charges WHERE charge_id = ?`,
      [chargeId]
    );
    if (!existingCharges || existingCharges.length === 0) {
      throw new Error("Charge not found");
    }
    const currentCharge = existingCharges[0];

    const studentResult = await db.query(
      `SELECT adm, name1, name2, name3, class, balance FROM student WHERE adm = ?`,
      [currentCharge.adm]
    );
    if (!studentResult || studentResult.length === 0) {
      throw new Error("Student not found");
    }
    const student = studentResult[0];

    return db.transaction(async (conn) => {
      // 1. Delete the charge record FIRST so it is excluded from SUM(charges)
      await conn.query(
        `DELETE FROM charges WHERE charge_id = ?`,
        [chargeId]
      );

      // 2. Recalculate student balance from ledger source of truth
      await conn.query(
        `
        UPDATE student s 
        SET s.balance = (
          COALESCE((SELECT SUM(c.amount) FROM charges c WHERE c.adm = s.adm), 0)    
          -     
          COALESCE((SELECT SUM(p.amount) FROM payment p WHERE p.adm = s.adm), 0)
        )
        WHERE s.adm = ?
      `,
        [currentCharge.adm]
      );

      // 3. Fetch exact recalculated student balance
      const [updatedStudent] = await conn.query(
        `SELECT balance FROM student WHERE adm = ?`,
        [currentCharge.adm]
      );
      const reversedBalance = Number((updatedStudent as any)?.[0]?.balance ?? 0);

      // 4. Update class balance (remove charge amount from class balance)
      if (student.class) {
        await conn.query(
          `UPDATE class SET balance = balance - ? WHERE class_id = ?`,
          [currentCharge.amount, student.class]
        );
      }

      // 5. Log deletion into processing_log
      await conn.query(
        `
        INSERT INTO processing_log (user_id, action_type, details)
        VALUES (?, 'update', ?)
      `,
        [
          userId,
          JSON.stringify({
            action: "delete_charge",
            charge_id: chargeId,
            adm: currentCharge.adm,
            name: currentCharge.name,
            amount: currentCharge.amount,
            term: currentCharge.term,
            yearAss: currentCharge.year_ass,
            dateAss: currentCharge.date_ass,
            reversedBalance,
            reason: reason || null,
          }),
        ]
      );

      // 6. Dispatch SMS notification asynchronously (non-blocking)
      smsService
        .notifyChargeDeleted({
          chargeId,
          adm: currentCharge.adm,
          studentName: `${student.name1} ${student.name2} ${student.name3 || ''}`.trim(),
          username,
          reason,
          amount: Number(currentCharge.amount),
          chargeName: currentCharge.name,
          newBalance: reversedBalance,
        })
        .catch((smsErr) => {
          logger.error(`Error sending charge deleted SMS alert: ${smsErr.message || smsErr}`);
        });

      return {
        chargeId,
        adm: currentCharge.adm,
        deletedAmount: currentCharge.amount,
        newBalance: reversedBalance,
      };
    });
  }
};
