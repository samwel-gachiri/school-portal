import { DatabaseConnection } from './src/config/database';
async function run() {
  const db = DatabaseConnection.getInstance();
  try {
    console.log(await db.queryRaw("select * from printtable join school where printed = 'no'"));
  } catch(e) {
    console.error(e);
  }
}
run().finally(() => process.exit(0));
