import { DatabaseConnection } from './src/config/database';

async function checkPaycountTable() {
  const db = DatabaseConnection.getInstance();

  try {
    console.log('Checking paycount table structure...');

    // Get table structure
    const columns = await db.queryRaw(`
      DESCRIBE paycount
    `);

    console.log('Paycount table columns:');
    columns.forEach((col: any) => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check if there are any existing paycount records
    const existingRecords = await db.query(`
      SELECT COUNT(*) as count FROM paycount
    `);

    console.log(`\nExisting paycount records: ${(existingRecords as any)[0].count}`);

    // Test insertion query (without actually inserting)
    console.log('\nTesting paycount insertion query structure...');
    const testQuery = `
      INSERT INTO paycount (adm, payment_id, amount, balance, term, year, bank, ref, dop, date_ass)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    console.log('Query:', testQuery);
    console.log('Parameters needed: adm, payment_id, amount, balance, term, year, bank, ref, dop, date_ass');

  } catch (error) {
    console.error('Error checking paycount table:', error);
  } finally {
    process.exit(0);
  }
}

checkPaycountTable();