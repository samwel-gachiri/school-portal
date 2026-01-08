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
          s.class,
          s.stream,
          s.balance as currentBalance
        FROM student s
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
        class: student.class,
        stream: student.stream,
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
}