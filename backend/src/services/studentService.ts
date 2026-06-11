import { DatabaseConnection } from '../config/database';
import { StudentMatch } from '../types';

export interface StudentSearchResult {
  students: StudentMatch[];
  totalCount: number;
}

export interface MatchResult {
  student: StudentMatch;
  matchScore: number;
  matchReasons: string[];
}

export interface CreateStudentData {
  name1: string;
  name2: string;
  name3?: string;
  fphone?: string;
  dob?: string;
  classId: number;
  streamId?: number | null;
  applyAdmissionCharge: boolean;
  admissionChargeAmount?: number;
}

export interface UpdateStudentData {
  name1?: string;
  name2?: string;
  name3?: string;
  classId?: number;
  streamId?: number | null;
}

export class StudentService {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  public async searchStudents(
    query: string,
    searchType: 'name' | 'admission' | 'class' | 'all' = 'all',
    limit: number = 50
  ): Promise<StudentSearchResult> {
    try {
      // Ensure limit is a valid integer
      const validLimit = Math.max(1, Math.min(1000, Math.floor(limit))) || 50;

      let sql = `
        SELECT 
          s.adm,
          s.name1,
          s.name2,
          s.name3,
          s.class,
          s.stream,
          s.balance as currentBalance,
          c.name as className
        FROM student s
        LEFT JOIN class c ON s.class = c.class_id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      const conditions: string[] = [];

      // Build search conditions based on type
      if (searchType === 'admission' || searchType === 'all') {
        // If query is numeric, search by admission number
        if (/^\d+$/.test(query.trim())) {
          conditions.push('s.adm = ?');
          params.push(parseInt(query.trim()));
        }
      }

      if (searchType === 'name' || searchType === 'all') {
        const searchTerms = query.trim().split(/\s+/);
        if (searchTerms.length > 0) {
          const nameConditions: string[] = [];
          
          searchTerms.forEach(term => {
            nameConditions.push(`(s.name1 LIKE ? OR s.name2 LIKE ? OR s.name3 LIKE ?)`);
            params.push(`%${term}%`, `%${term}%`, `%${term}%`);
          });

          if (nameConditions.length > 0) {
            conditions.push(`(${nameConditions.join(' AND ')})`);
          }
        }
      }

      if (searchType === 'class' || searchType === 'all') {
        conditions.push('(c.name LIKE ? OR s.class = ?)');
        params.push(`%${query}%`);
        
        // Try to extract class number from query
        const classMatch = query.match(/(\d+)/);
        if (classMatch) {
          params.push(parseInt(classMatch[1]));
        } else {
          params.push(-1); // Won't match any class
        }
      }

      // Add conditions to SQL using OR logic for 'all' searches
      if (conditions.length > 0) {
        sql += ` AND (${conditions.join(' OR ')})`;
      }

      // Use string interpolation for LIMIT to avoid parameter issues
      sql += ` ORDER BY s.name1, s.name2 LIMIT ${validLimit}`;

      const students = await this.db.query<any>(sql, params);

      const mappedStudents: StudentMatch[] = students.map(student => ({
        adm: student.adm,
        name1: student.name1,
        name2: student.name2,
        name3: student.name3,
        class: student.class,
        stream: student.stream,
        currentBalance: student.currentBalance || 0,
        matchConfidence: 1.0 // Perfect match for direct search
      }));

      return {
        students: mappedStudents,
        totalCount: mappedStudents.length
      };

    } catch (error) {
      console.error('Student search error:', error);
      throw new Error('Failed to search students');
    }
  }

  public async findStudentMatches(
    studentName: string,
    className: string,
    limit: number = 10
  ): Promise<MatchResult[]> {
    try {
      // Get all students from the specified class or similar classes
      const classNumber = this.extractClassNumber(className);
      
      let sql = `
        SELECT 
          s.adm,
          s.name1,
          s.name2,
          s.name3,
          s.class,
          s.stream,
          s.balance as currentBalance,
          c.name as className
        FROM student s
        LEFT JOIN class c ON s.class = c.class_id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      // Add class filter if we found a class number
      if (classNumber !== null) {
        sql += ` AND s.class = ?`;
        params.push(classNumber);
      }

      sql += ` ORDER BY s.name1, s.name2`;

      const students = await this.db.query<any>(sql, params);

      // Calculate match scores for each student
      const matches: MatchResult[] = [];

      for (const student of students) {
        const matchResult = this.calculateMatchScore(studentName, className, student);
        
        if (matchResult.matchScore > 0.3) { // Only include matches above 30%
          matches.push(matchResult);
        }
      }

      // Sort by match score (highest first) and limit results
      matches.sort((a, b) => b.matchScore - a.matchScore);
      
      return matches.slice(0, limit);

    } catch (error) {
      console.error('Student matching error:', error);
      throw new Error('Failed to find student matches');
    }
  }

  private calculateMatchScore(
    searchName: string,
    searchClass: string,
    student: any
  ): MatchResult {
    let totalScore = 0;
    let maxScore = 0;
    const matchReasons: string[] = [];

    // Name matching (70% of total score)
    const nameScore = this.calculateNameScore(searchName, student);
    totalScore += nameScore.score * 0.7;
    maxScore += 0.7;
    if (nameScore.score > 0) {
      matchReasons.push(...nameScore.reasons);
    }

    // Class matching (30% of total score)
    const classScore = this.calculateClassScore(searchClass, student);
    totalScore += classScore.score * 0.3;
    maxScore += 0.3;
    if (classScore.score > 0) {
      matchReasons.push(...classScore.reasons);
    }

    const finalScore = maxScore > 0 ? totalScore / maxScore : 0;

    return {
      student: {
        adm: student.adm,
        name1: student.name1,
        name2: student.name2,
        name3: student.name3,
        class: student.class,
        stream: student.stream,
        currentBalance: student.currentBalance || 0,
        matchConfidence: finalScore
      },
      matchScore: finalScore,
      matchReasons
    };
  }

  private calculateNameScore(searchName: string, student: any): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    const searchParts = searchName.toLowerCase().trim().split(/\s+/);
    const studentNames = [
      student.name1?.toLowerCase() || '',
      student.name2?.toLowerCase() || '',
      student.name3?.toLowerCase() || ''
    ].filter(name => name.length > 0);

    // Exact name matches
    let exactMatches = 0;
    for (const searchPart of searchParts) {
      for (const studentName of studentNames) {
        if (studentName === searchPart) {
          exactMatches++;
          reasons.push(`Exact match: "${searchPart}"`);
          break;
        }
      }
    }

    // Partial name matches
    let partialMatches = 0;
    for (const searchPart of searchParts) {
      if (searchPart.length < 3) continue; // Skip very short names
      
      for (const studentName of studentNames) {
        if (studentName.includes(searchPart) || searchPart.includes(studentName)) {
          partialMatches++;
          reasons.push(`Partial match: "${searchPart}" ~ "${studentName}"`);
          break;
        }
      }
    }

    // Calculate score based on matches
    const totalSearchParts = searchParts.length;
    if (totalSearchParts > 0) {
      score = (exactMatches * 1.0 + partialMatches * 0.6) / totalSearchParts;
      score = Math.min(score, 1.0); // Cap at 1.0
    }

    return { score, reasons };
  }

  private calculateClassScore(searchClass: string, student: any): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    const searchClassNumber = this.extractClassNumber(searchClass);
    const studentClassNumber = student.class;

    if (searchClassNumber !== null && studentClassNumber !== null) {
      if (searchClassNumber === studentClassNumber) {
        score = 1.0;
        reasons.push(`Class match: ${searchClass} = Class ${studentClassNumber}`);
      } else if (Math.abs(searchClassNumber - studentClassNumber) === 1) {
        score = 0.5;
        reasons.push(`Adjacent class: ${searchClass} ~ Class ${studentClassNumber}`);
      }
    }

    return { score, reasons };
  }

  private extractClassNumber(className: string): number | null {
    if (!className) return null;

    const patterns = [
      /Grade\s*(\d+)/i,
      /Class\s*(\d+)/i,
      /G\.?(\d+)/i,
      /Std\s*(\d+)/i,
      /(\d+)/
    ];

    for (const pattern of patterns) {
      const match = className.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return null;
  }

  public async getStudentById(admissionNumber: number): Promise<StudentMatch | null> {
    try {
      const students = await this.db.query<any>(
        `SELECT 
          s.adm,
          s.name1,
          s.name2,
          s.name3,
          s.class as classId,
          c.name as className,
          s.stream as streamId,
          st.name as streamName,
          s.balance as currentBalance
        FROM student s
        LEFT JOIN class c ON s.class = c.class_id
        LEFT JOIN stream st ON s.stream = st.stream_id
        WHERE s.adm = ?`,
        [admissionNumber]
      );

      if (students.length === 0) {
        return null;
      }

      const student = students[0];
      return {
        adm: student.adm,
        name1: student.name1,
        name2: student.name2,
        name3: student.name3,
        class: student.className || student.classId,
        classId: student.classId,
        stream: student.streamName || student.streamId,
        streamId: student.streamId,
        currentBalance: student.currentBalance || 0,
        matchConfidence: 1.0
      };

    } catch (error) {
      console.error('Get student by ID error:', error);
      throw new Error('Failed to retrieve student');
    }
  }

  public async getStudentFeeStructure(admissionNumber: number): Promise<any> {
    try {
      const charges = await this.db.query(
        `SELECT 
          c.name,
          c.amount,
          c.balance,
          c.term,
          c.year_ass
        FROM charges c
        WHERE c.adm = ?
        ORDER BY c.year_ass DESC, c.term DESC`,
        [admissionNumber]
      );

      return charges;

    } catch (error) {
      console.error('Get student fee structure error:', error);
      throw new Error('Failed to retrieve student fee structure');
    }
  }

  public async getStudentTransactions(admissionNumber: number): Promise<any[]> {
    try {
      const charges = await this.db.query<any>(
        `SELECT 
          charge_id as id, 
          'CHARGE' as type, 
          name, 
          amount, 
          balance, 
          term, 
          year_ass as year, 
          date_ass as date,
          NULL as bank,
          NULL as ref
        FROM charges
        WHERE adm = ?`,
        [admissionNumber]
      );

      const payments = await this.db.query<any>(
        `SELECT 
          payment_id as id, 
          'PAYMENT' as type, 
          name, 
          amount, 
          balance, 
          term, 
          year_paid as year, 
          dop as date, 
          bank, 
          ref
        FROM payment
        WHERE adm = ?`,
        [admissionNumber]
      );

      const transactions = [...charges, ...payments].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        // Sort descending (newest first)
        if (dateB !== dateA) {
          return dateB - dateA;
        }
        // If same date, id as secondary sort (assuming newer id means newer record)
        return b.id - a.id;
      });

      return transactions;

    } catch (error) {
      console.error('Get student transactions error:', error);
      throw new Error('Failed to retrieve student transactions');
    }
  }

  public async createStudent(data: CreateStudentData, userId: number): Promise<any> {
    return this.db.transaction(async (conn) => {
      // Get class fees
      const [classResult] = await conn.query(`SELECT fees FROM class WHERE class_id = ?`, [data.classId]);
      const classRows = classResult as any[];
      if (!classRows || classRows.length === 0) {
        throw new Error('Class not found');
      }
      const fees = classRows[0].fees || 0;

      // Insert student with balance 0 initially
      const [insertResult] = await conn.query(`
        INSERT INTO student (name1, name2, name3, fphone, dob, fees, balance, class, stream)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
      `, [
        data.name1.toUpperCase(),
        data.name2.toUpperCase(),
        data.name3 ? data.name3.toUpperCase() : null,
        data.fphone || null,
        data.dob || null,
        fees,
        data.classId,
        data.streamId || null
      ]);

      const adm = (insertResult as any).insertId;

      let finalBalance = 0;

      // Apply admission charge if requested
      if (data.applyAdmissionCharge && data.admissionChargeAmount && data.admissionChargeAmount > 0) {
        const amount = data.admissionChargeAmount;
        finalBalance = amount;

        // Get current term/year
        const [termResult] = await conn.query(`SELECT term, year FROM school ORDER BY year DESC, term DESC LIMIT 1`);
        const termRows = termResult as any[];
        const term = termRows.length > 0 ? termRows[0].term : 'ONE';
        const yearAss = termRows.length > 0 ? termRows[0].year : new Date().getFullYear();
        const dateAss = new Date().toISOString().split('T')[0];

        // Insert charge
        const [chargeResult] = await conn.query(`
          INSERT INTO charges (adm, name, amount, balance, term, year_ass, date_ass)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [adm, 'ADMISSION_FEE', amount, finalBalance, term, yearAss, dateAss]);

        const chargeId = (chargeResult as any).insertId;

        // Update student balance
        await conn.query(`UPDATE student SET balance = ? WHERE adm = ?`, [finalBalance, adm]);

        // Log transaction
        await conn.query(`
          INSERT INTO processing_log (user_id, action_type, details)
          VALUES (?, ?, ?)
        `, [userId, "insert", JSON.stringify({
          type: "CHARGE",
          chargeId,
          adm,
          name: 'ADMISSION_FEE',
          amount,
          newBalance: finalBalance
        })]);
      }

      return {
        adm,
        name: `${data.name1} ${data.name2} ${data.name3 || ''}`.trim(),
        balance: finalBalance,
        classId: data.classId
      };
    });
  }

  public async updateStudent(adm: number, data: UpdateStudentData, userId: number): Promise<boolean> {
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (data.name1 !== undefined) {
      fieldsToUpdate.push('name1 = ?');
      values.push(data.name1.toUpperCase());
    }
    if (data.name2 !== undefined) {
      fieldsToUpdate.push('name2 = ?');
      values.push(data.name2.toUpperCase());
    }
    if (data.name3 !== undefined) {
      fieldsToUpdate.push('name3 = ?');
      values.push(data.name3 ? data.name3.toUpperCase() : null);
    }
    if (data.classId !== undefined) {
      fieldsToUpdate.push('class = ?');
      values.push(data.classId);
    }
    if (data.streamId !== undefined) {
      fieldsToUpdate.push('stream = ?');
      values.push(data.streamId);
    }

    if (fieldsToUpdate.length === 0) return true;

    values.push(adm);

    return this.db.transaction(async (conn) => {
      await conn.query(
        `UPDATE student SET ${fieldsToUpdate.join(', ')} WHERE adm = ?`,
        values
      );

      await conn.query(`
        INSERT INTO processing_log (user_id, action_type, details)
        VALUES (?, ?, ?)
      `, [userId, "update", JSON.stringify({
        type: "STUDENT_UPDATE",
        adm,
        updatedFields: Object.keys(data)
      })]);

      return true;
    });
  }
}