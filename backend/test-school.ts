import { DatabaseConnection } from './src/config/database';

async function test() {
  const db = DatabaseConnection.getInstance();
  const rows = await db.queryRaw('SELECT * FROM school');
  console.log(rows);
  process.exit(0);
}
test();
