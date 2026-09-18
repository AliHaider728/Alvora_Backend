const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const c = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
  try { await c.query('ALTER TABLE bundles ADD COLUMN shortDescription TEXT;'); console.log('Added shortDescription'); } catch(e) { console.log(e.message); }
  try { await c.query('ALTER TABLE bundles ADD COLUMN customImage VARCHAR(255);'); console.log('Added customImage'); } catch(e) { console.log(e.message); }
  try { await c.query('ALTER TABLE bundles ADD COLUMN status VARCHAR(50) DEFAULT "published";'); console.log('Added status'); } catch(e) { console.log(e.message); }
  try { await c.query('ALTER TABLE bundles ADD COLUMN isBestseller TINYINT(1) DEFAULT 0;'); console.log('Added isBestseller'); } catch(e) { console.log(e.message); }
  process.exit(0);
}
run();
