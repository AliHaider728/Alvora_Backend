const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const c = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
  const [rows] = await c.query('SELECT name, customImage, image, shortDescription, isBestseller FROM bundles');
  console.log(rows);
  process.exit(0);
}
run();
