import { DatabaseConnection } from './src/config/database';
async function run() {
  const db = DatabaseConnection.getInstance();
  try {
    console.log(await db.queryRaw('SELECT * FROM school'));
  } catch(e) {
    console.error(e);
  }
}
run().finally(() => process.exit(0));
