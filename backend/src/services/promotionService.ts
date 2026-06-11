import { DatabaseConnection } from '../config/database';
import logger from '../utils/logger';

interface ClassInfo {
  class_id: number;
  name: string;
  fees: number;
  balance: number;
  position: number;
  stream_count: number;
}

interface Student {
  adm: number;
  name1: string;
  name2: string;
  name3: string;
  fphone: string;
  mphone: string;
  dob: string;
  fees: number;
  balance: number;
  class: number;
  stream: number;
  paycount: number;
  fees_item: number;
}

interface PromotionResult {
  success: boolean;
  message: string;
  summary: {
    totalStudents: number;
    promoted: number;
    transferred: number;
    failed: number;
    errors: string[];
  };
}

export class PromotionService {
  private db = DatabaseConnection.getInstance();

  /**
   * Get all classes ordered by position
   */
  async getClassesByPosition(): Promise<ClassInfo[]> {
    const classes = await this.db.query(
      `SELECT class_id, name, fees, balance, position, stream_count 
       FROM class 
       ORDER BY position ASC`
    );
    return classes;
  }

  /**
   * Get the next class based on current class position
   */
  async getNextClass(currentClassId: number): Promise<ClassInfo | null> {
    const result = await this.db.query(
      `SELECT c2.class_id, c2.name, c2.fees, c2.balance, c2.position, c2.stream_count
       FROM class c1
       JOIN class c2 ON c2.position = c1.position + 1
       WHERE c1.class_id = ?
       LIMIT 1`,
      [currentClassId]
    );
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Check if a class is the highest (exit) class
   */
  async isExitClass(classId: number): Promise<boolean> {
    const result = await this.db.query(
      `SELECT c1.class_id
       FROM class c1
       WHERE c1.class_id = ?
       AND c1.position = (SELECT MAX(position) FROM class)`,
      [classId]
    );
    return result.length > 0;
  }

  /**
   * Get all students in a specific class
   */
  async getStudentsByClass(classId: number): Promise<Student[]> {
    return await this.db.query(
      `SELECT adm, name1, name2, name3, fphone, mphone, dob, fees, balance, 
              class, stream, paycount, fees_item
       FROM student 
       WHERE class = ?`,
      [classId]
    );
  }

  /**
   * Promote a single student to the next class
   */
  async promoteStudent(studentAdm: number, newClassId: number, newFees: number): Promise<void> {
    await this.db.query(
      `UPDATE student 
       SET class = ?, fees = ?, balance = balance + ?
       WHERE adm = ?`,
      [newClassId, newFees, newFees, studentAdm]
    );
    
    logger.info(`Promoted student ${studentAdm} to class ${newClassId}`);
  }

  /**
   * Transfer a graduating student to the transfer table
   */
  async transferStudent(student: Student): Promise<void> {
    // Start transaction
    await this.db.queryRaw('START TRANSACTION');

    try {
      // 1. Insert student into transfer table
      await this.db.query(
        `INSERT INTO transfer (adm, name1, name2, name3, fphone, mphone, dob, fees, balance, class, stream, paycount, fees_item)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student.adm,
          student.name1,
          student.name2,
          student.name3,
          student.fphone,
          student.mphone,
          student.dob,
          student.fees,
          student.balance,
          student.class,
          student.stream,
          student.paycount,
          student.fees_item
        ]
      );

      // 2. Move charges to transfer_charges
      await this.db.query(
        `INSERT INTO transfer_charges (name, amount, balance, term, year_ass, date_ass, adm)
         SELECT name, amount, balance, term, year_ass, date_ass, adm
         FROM charges WHERE adm = ?`,
        [student.adm]
      );

      // 3. Move payments to transfer_payment
      await this.db.query(
        `INSERT INTO transfer_payment (name, amount, balance, term, year_paid, date_ass, dop, bank, ref, adm)
         SELECT name, amount, balance, term, year_paid, date_ass, dop, bank, ref, adm
         FROM payment WHERE adm = ?`,
        [student.adm]
      );

      // 4. Move transport to transfer_transport
      await this.db.query(
        `INSERT INTO transfer_transport (adm, amount, place, way)
         SELECT adm, amount, place, way
         FROM transport WHERE adm = ?`,
        [student.adm]
      );

      // 5. Move transport_charges to transfer if needed (check if exists)
      // Note: There's no transfer_transport_charges table based on schema, 
      // so we'll just log a warning if student has transport charges

      // 6. Delete from original tables
      await this.db.query(`DELETE FROM charges WHERE adm = ?`, [student.adm]);
      await this.db.query(`DELETE FROM payment WHERE adm = ?`, [student.adm]);
      await this.db.query(`DELETE FROM transport WHERE adm = ?`, [student.adm]);
      await this.db.query(`DELETE FROM transport_charges WHERE adm = ?`, [student.adm]);
      await this.db.query(`DELETE FROM transport_payment WHERE adm = ?`, [student.adm]);
      await this.db.query(`DELETE FROM marks WHERE adm = ?`, [student.adm]);
      await this.db.query(`DELETE FROM paycount WHERE adm = ?`, [student.adm]);
      await this.db.query(`DELETE FROM sponsored WHERE adm = ?`, [student.adm]);
      await this.db.query(`DELETE FROM student WHERE adm = ?`, [student.adm]);

      await this.db.queryRaw('COMMIT');
      logger.info(`Transferred student ${student.adm} (${student.name1} ${student.name2}) to transfer table`);
    } catch (error) {
      await this.db.queryRaw('ROLLBACK');
      throw error;
    }
  }

  /**
   * Promote all students to the next class
   * Students in the highest class are transferred out
   */
  async promoteAllStudents(): Promise<PromotionResult> {
    const result: PromotionResult = {
      success: false,
      message: '',
      summary: {
        totalStudents: 0,
        promoted: 0,
        transferred: 0,
        failed: 0,
        errors: []
      }
    };

    try {
      // Get all classes ordered by position (highest first to avoid conflicts)
      const classes = await this.db.query(
        `SELECT class_id, name, fees, balance, position 
         FROM class 
         ORDER BY position DESC`
      );

      if (classes.length === 0) {
        result.message = 'No classes found in the system';
        return result;
      }

      console.log(`\n🎓 Starting student promotion process...`);
      console.log(`📚 Found ${classes.length} classes\n`);

      // Get the maximum position (exit class)
      const maxPosition = classes[0].position;

      // Process each class from highest to lowest
      for (const classInfo of classes) {
        const students = await this.getStudentsByClass(classInfo.class_id);
        console.log(`📖 Processing ${classInfo.name}: ${students.length} students`);

        for (const student of students) {
          result.summary.totalStudents++;

          try {
            if (classInfo.position === maxPosition) {
              // This is the exit class - transfer student
              await this.transferStudent(student);
              result.summary.transferred++;
              console.log(`  ✅ Transferred: ${student.name1} ${student.name2} (ADM: ${student.adm})`);
            } else {
              // Get next class
              const nextClass = await this.getNextClass(classInfo.class_id);
              
              if (nextClass) {
                await this.promoteStudent(student.adm, nextClass.class_id, nextClass.fees);
                result.summary.promoted++;
                console.log(`  ⬆️ Promoted: ${student.name1} ${student.name2} (ADM: ${student.adm}) → ${nextClass.name}`);
              } else {
                result.summary.failed++;
                result.summary.errors.push(`No next class found for student ${student.adm} in class ${classInfo.name}`);
              }
            }
          } catch (error: any) {
            result.summary.failed++;
            result.summary.errors.push(`Failed to process student ${student.adm}: ${error.message}`);
            console.error(`  ❌ Failed: ${student.name1} ${student.name2} - ${error.message}`);
          }
        }
      }

      // Update school statistics
      await this.updateSchoolStats();

      result.success = result.summary.failed === 0;
      result.message = `Promotion complete: ${result.summary.promoted} promoted, ${result.summary.transferred} transferred, ${result.summary.failed} failed`;

      console.log(`\n🎉 Promotion Summary:`);
      console.log(`   Total Students: ${result.summary.totalStudents}`);
      console.log(`   Promoted: ${result.summary.promoted}`);
      console.log(`   Transferred: ${result.summary.transferred}`);
      console.log(`   Failed: ${result.summary.failed}`);

      return result;
    } catch (error: any) {
      logger.error('Promotion process failed:', error);
      result.message = `Promotion failed: ${error.message}`;
      result.summary.errors.push(error.message);
      return result;
    }
  }

  /**
   * Preview promotion without making changes
   */
  async previewPromotion(): Promise<{
    classes: Array<{
      className: string;
      currentStudents: number;
      action: 'promote' | 'transfer';
      nextClass?: string;
    }>;
    totalToPromote: number;
    totalToTransfer: number;
  }> {
    const classes = await this.db.query(
      `SELECT c.class_id, c.name, c.position, COUNT(s.adm) as student_count
       FROM class c
       LEFT JOIN student s ON c.class_id = s.class
       GROUP BY c.class_id, c.name, c.position
       ORDER BY c.position ASC`
    );

    const maxPosition = Math.max(...classes.map((c: any) => c.position));
    const preview: Array<{
      className: string;
      currentStudents: number;
      action: 'promote' | 'transfer';
      nextClass?: string;
    }> = [];
    let totalToPromote = 0;
    let totalToTransfer = 0;

    for (const cls of classes) {
      const nextClass = await this.getNextClass(cls.class_id);
      const isExit = cls.position === maxPosition;
      
      preview.push({
        className: cls.name,
        currentStudents: cls.student_count,
        action: isExit ? 'transfer' as const : 'promote' as const,
        nextClass: nextClass?.name
      });

      if (isExit) {
        totalToTransfer += cls.student_count;
      } else {
        totalToPromote += cls.student_count;
      }
    }

    return {
      classes: preview,
      totalToPromote,
      totalToTransfer
    };
  }

  /**
   * Update school statistics after promotion
   */
  private async updateSchoolStats(): Promise<void> {
    try {
      // Update student count
      const studentCount = await this.db.query('SELECT COUNT(*) as count FROM student');
      const transferCount = await this.db.query('SELECT COUNT(*) as count FROM transfer');
      
      await this.db.query(
        `UPDATE school SET student_count = ?, transfer_count = ? WHERE school_id = 1`,
        [studentCount[0].count, transferCount[0].count]
      );
      
      logger.info('Updated school statistics after promotion');
    } catch (error) {
      logger.warn('Failed to update school statistics:', error);
    }
  }

  /**
   * Promote students from a specific class only
   */
  async promoteClassStudents(classId: number): Promise<PromotionResult> {
    const result: PromotionResult = {
      success: false,
      message: '',
      summary: {
        totalStudents: 0,
        promoted: 0,
        transferred: 0,
        failed: 0,
        errors: []
      }
    };

    try {
      const classInfo = await this.db.query(
        `SELECT class_id, name, position FROM class WHERE class_id = ?`,
        [classId]
      );

      if (classInfo.length === 0) {
        result.message = 'Class not found';
        return result;
      }

      const isExit = await this.isExitClass(classId);
      const students = await this.getStudentsByClass(classId);
      const nextClass = isExit ? null : await this.getNextClass(classId);

      console.log(`\n🎓 Promoting students from ${classInfo[0].name}...`);
      console.log(`   Students: ${students.length}`);
      console.log(`   Action: ${isExit ? 'Transfer (Exit Class)' : `Promote to ${nextClass?.name}`}\n`);

      for (const student of students) {
        result.summary.totalStudents++;

        try {
          if (isExit) {
            await this.transferStudent(student);
            result.summary.transferred++;
            console.log(`  ✅ Transferred: ${student.name1} ${student.name2}`);
          } else if (nextClass) {
            await this.promoteStudent(student.adm, nextClass.class_id, nextClass.fees);
            result.summary.promoted++;
            console.log(`  ⬆️ Promoted: ${student.name1} ${student.name2}`);
          }
        } catch (error: any) {
          result.summary.failed++;
          result.summary.errors.push(`Student ${student.adm}: ${error.message}`);
          console.error(`  ❌ Failed: ${student.name1} ${student.name2}`);
        }
      }

      await this.updateSchoolStats();

      result.success = result.summary.failed === 0;
      result.message = `Class promotion complete: ${result.summary.promoted} promoted, ${result.summary.transferred} transferred`;

      return result;
    } catch (error: any) {
      result.message = error.message;
      return result;
    }
  }
}

export const promotionService = new PromotionService();
