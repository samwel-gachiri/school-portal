import { DatabaseConnection } from './src/config/database';

async function checkSchema() {
  const db = DatabaseConnection.getInstance();
  try {
    const columns = await db.queryRaw('SHOW COLUMNS FROM payment');
    console.log(columns);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
checkSchema();
