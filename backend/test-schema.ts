import { DatabaseConnection } from './src/config/database';

async function checkSchema() {
  const db = DatabaseConnection.getInstance();
  try {
    const columns = await db.queryRaw('SHOW COLUMNS FROM student');
    console.log(columns);
    
    // Also check class table
    const classes = await db.queryRaw('SELECT * FROM class LIMIT 5');
    console.log(classes);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
checkSchema();
