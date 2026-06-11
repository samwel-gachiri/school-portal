import { DatabaseConnection } from './src/config/database';

async function main() {
  const db = DatabaseConnection.getInstance();
  try {
    await db.queryRaw("ALTER TABLE processing_log MODIFY action_type ENUM('upload', 'extract', 'match', 'confirm', 'insert', 'update') NOT NULL");
    console.log("Altered processing_log ENUM successfully!");
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error("Error altering DB:", error);
    process.exit(1);
  }
}

main();
