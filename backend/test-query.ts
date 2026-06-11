import { DatabaseConnection } from './src/config/database';
async function run() {
  const db = DatabaseConnection.getInstance();
  try {
    const q1 = `SELECT pt.payment_id, pt.adm, st.adm as st_adm FROM payment pt LEFT JOIN student st ON pt.adm = st.adm WHERE pt.payment_id = 14221`;
    console.log("Q1:", await db.queryRaw(q1));
    const q2 = `
      SELECT 
        st.name1, st.name2, st.name3,
        pt.adm, 
        pt.payment_id as receiptNO,
        st.class,
        st.stream,
        pt.dop,
        pt.term,
        pt.year_paid as year,
        pt.amount,
        pt.balance,
        pt.name as item
      FROM payment pt
      JOIN student st ON pt.adm = st.adm
      WHERE pt.payment_id = 14221
    `;
    console.log("Q2:", await db.queryRaw(q2));
  } catch(e) {
    console.error(e);
  }
}
run().finally(() => process.exit(0));
