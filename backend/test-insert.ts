import { DatabaseConnection } from './src/config/database';
async function run() {
  const db = DatabaseConnection.getInstance();
  try {
    const q = `
      INSERT INTO printtable 
      (name1, name2, name3, adm, receiptNO, class, stream, dop, term, year, amount, balance, item, printed)
      VALUES ('JOE', 'STEPHEN', 'GACHIRI', 641, 14221, '10', '20', '2025-10-08', 'ONE', 2025, '10', '6340', '7', 'no')
      ON DUPLICATE KEY UPDATE 
        name1=VALUES(name1), name2=VALUES(name2), name3=VALUES(name3), 
        adm=VALUES(adm), class=VALUES(class), stream=VALUES(stream), 
        dop=VALUES(dop), term=VALUES(term), year=VALUES(year), 
        amount=VALUES(amount), balance=VALUES(balance), item=VALUES(item), 
        printed=VALUES(printed)
    `;
    console.log(await db.queryRaw(q));
  } catch(e) {
    console.error("SQL ERROR:", e);
  }
}
run().finally(() => process.exit(0));
