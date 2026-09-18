const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const c = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
  try { await c.query('ALTER TABLE bundles ADD COLUMN bundlePrice DECIMAL(10,2);'); console.log('Added bundlePrice'); } catch(e) { console.log(e.message); }
  try { await c.query('ALTER TABLE bundles ADD COLUMN discountType VARCHAR(20) DEFAULT "percentage";'); console.log('Added discountType'); } catch(e) { console.log(e.message); }
  try { await c.query('ALTER TABLE bundles ADD COLUMN discountValue DECIMAL(10,2) DEFAULT 0;'); console.log('Added discountValue'); } catch(e) { console.log(e.message); }
  try { await c.query('ALTER TABLE bundles ADD COLUMN customPrice DECIMAL(10,2) DEFAULT 0;'); console.log('Added customPrice'); } catch(e) { console.log(e.message); }
  process.exit(0);
}
run();
