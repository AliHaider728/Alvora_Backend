const { pool } = require('./dist/mysql-lib/db.js');
(async () => {
  try {
    const [tables] = await pool.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    let schema = {};
    for (const t of tableNames) {
      const [columns] = await pool.execute(`DESCRIBE ${t}`);
      schema[t] = columns.map(c => `${c.Field} (${c.Type}${c.Null === 'YES' ? ', NULL' : ''})`);
    }
    console.log(JSON.stringify(schema, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
