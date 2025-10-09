const { DatabaseConnection } = require("./dist/config/database.js");

async function testConnection() {
  try {
    const db = DatabaseConnection.getInstance();
    const isConnected = await db.testConnection();
    console.log("Database connection test:", isConnected);

    // Test the search query
    const result = await db.query("SELECT COUNT(*) as count FROM student");
    console.log("Student table exists, count:", result[0].count);

    // Test the actual search query
    const searchResult = await db.query(
      "SELECT adm, name FROM student WHERE name LIKE ? LIMIT 5",
      ["%sam%"]
    );
    console.log("Search test result:", searchResult);
  } catch (error) {
    console.error("Database error:", error.message);
  }
}

testConnection();
