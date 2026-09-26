const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function check() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
  const [rows] = await conn.execute('SELECT name, displayOrder FROM bundles ORDER BY displayOrder ASC');
  console.log("Current Bundles:");
  console.table(rows);
  await conn.end();
}
check();
