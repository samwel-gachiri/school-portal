import { DatabaseConnection } from "../config/database";

export const classService = {
  // Get all classes with cumulative balance
  async getClasses() {
    const db = DatabaseConnection.getInstance();
    const query = `
      SELECT 
        c.class_id, 
        c.name, 
        c.fees, 
        (SELECT GROUP_CONCAT(st.name SEPARATOR ', ') FROM stream st WHERE st.class = c.class_id) as streams,
        c.position,
        COALESCE(SUM(s.balance), 0) as cumulative_balance
      FROM class c
      LEFT JOIN student s ON c.class_id = s.class
      GROUP BY c.class_id, c.name, c.fees, c.position
      ORDER BY c.position ASC, c.name ASC
    `;
    const classes = await db.query(query);
    return classes || [];
  },

  async getClassById(classId: number) {
    const db = DatabaseConnection.getInstance();
    const query = `
      SELECT 
        c.class_id, 
        c.name, 
        c.fees, 
        (SELECT GROUP_CONCAT(st.name SEPARATOR ', ') FROM stream st WHERE st.class = c.class_id) as streams
      FROM class c
      WHERE c.class_id = ?
    `;
    const classes = await db.query(query, [classId]);
    return classes?.[0] || null;
  },

  async getClassStudents(classId: number) {
    const db = DatabaseConnection.getInstance();
    const query = `
      SELECT 
        s.adm,
        s.name1,
        s.name2,
        s.name3,
        s.balance,
        st.name as stream_name
      FROM student s
      LEFT JOIN stream st ON s.stream = st.stream_id
      WHERE s.class = ?
      ORDER BY s.name1 ASC, s.name2 ASC
    `;
    const students = await db.query(query, [classId]);
    return students || [];
  }
};
