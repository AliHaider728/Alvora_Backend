const { pool } = require('./dist/mysql-lib/db.js');
(async () => {
  try {
    const [products] = await pool.execute('SELECT COUNT(*) as count FROM products');
    const [bundles] = await pool.execute('SELECT COUNT(*) as count FROM bundles');
    
    let audioExists = false;
    try {
      await pool.execute('SELECT 1 FROM audio_reviews LIMIT 1');
      audioExists = true;
    } catch(e) {}
    
    console.log('Products count:', products[0].count);
    console.log('Bundles count:', bundles[0].count);
    console.log('Audio reviews table exists:', audioExists);
    
    process.exit(0);
  } catch (err) {
    console.error('DB Error:', err);
    process.exit(1);
  }
})();
