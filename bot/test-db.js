const { Pool } = require("pg");
const fs = require('fs');

// Create connection pool with same credentials
const pool = new Pool({
  user: "zen",
  host: "localhost",
  database: "zero",
  password: "yourpassword",
  port: 5432,
});

async function testDatabaseConnection(userId) {
  console.log(`Testing database operations for user ID: ${userId}`);
  
  try {
    // Test 1: Simple connection test
    console.log("Test 1: Connecting to database...");
    const connectionTest = await pool.query("SELECT NOW()");
    console.log(`✅ Connection successful: ${connectionTest.rows[0].now}`);
    
    // Test 2: Check if user exists in media_files
    console.log("Test 2: Checking for user's files...");
    const userCheck = await pool.query(
      "SELECT COUNT(*) FROM media_files WHERE user_id = $1",
      [userId]
    );
    const fileCount = parseInt(userCheck.rows[0].count);
    console.log(`Found ${fileCount} files for user ID ${userId}`);
    
    // Test 3: Write debug info to file
    console.log("Test 3: Writing table structure to file...");
    const tableInfo = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'media_files'"
    );
    fs.writeFileSync('table-info.json', JSON.stringify(tableInfo.rows, null, 2));
    console.log(`Table structure written to table-info.json`);
    
    // Test 4: Attempt direct deletion
    if (fileCount > 0) {
      console.log("Test 4: Attempting DELETE operation...");
      const deleteResult = await pool.query(
        "DELETE FROM media_files WHERE user_id = $1 RETURNING *",
        [userId]
      );
      console.log(`Delete operation affected ${deleteResult.rowCount} rows`);
      console.log(`Deleted records: ${JSON.stringify(deleteResult.rows)}`);
    } else {
      console.log("Test 4: Skipped (no files to delete)");
    }
  } catch (error) {
    console.error("❌ Database test failed:", error);
  } finally {
    await pool.end();
    console.log("Database connection pool closed");
  }
}

// Use the user ID provided as command line argument or default to 12345
const testUserId = process.argv[2] || 12345;
testDatabaseConnection(testUserId);