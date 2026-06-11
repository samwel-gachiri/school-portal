import { DatabaseConnection } from './src/config/database';
async function run() {
  const db = DatabaseConnection.getInstance();
  try {
    const check = await db.queryRaw('SELECT receiptNO, printed FROM printtable WHERE receiptNO = 14221');
    console.log('DB Check after:', check);
  } catch(e) {
    console.error(e);
  }
}
run().finally(() => process.exit(0));
