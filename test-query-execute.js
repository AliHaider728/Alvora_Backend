require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  
  const status = '';
  const source = '';
  const rating = undefined;
  const search = '';
  const page = 1;
  const limit = 20;

  let whereClauses = [];
  let params = [];

  if (status) { whereClauses.push('r.status = ?'); params.push(status); }
  if (source) { whereClauses.push('r.source = ?'); params.push(source); }
  if (rating) { whereClauses.push('r.rating = ?'); params.push(Number(rating)); }
  if (search) {
    whereClauses.push('(r.reviewerName LIKE ? OR r.productName LIKE ? OR r.content LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const skip = (Number(page) - 1) * Number(limit);

  const REVIEW_COLS_ADMIN = 'id, productId, productName, reviewerName, reviewerEmail, rating, title, content, avatarUrl, imageUrl, verifiedPurchase, source, status, createdAt';

  console.log(`SELECT ${REVIEW_COLS_ADMIN.split(', ').map(c => `r.${c}`).join(', ')}, p.slug as productSlug
         FROM reviews r
         LEFT JOIN products p ON r.productId = p.id
         ${whereSQL}
         ORDER BY r.createdAt DESC
         LIMIT ? OFFSET ?`);
  console.log([...params, Number(limit), skip]);

  try {
      const [reviews] = await pool.execute(
        `SELECT ${REVIEW_COLS_ADMIN.split(', ').map(c => `r.${c}`).join(', ')}, p.slug as productSlug
         FROM reviews r
         LEFT JOIN products p ON r.productId = p.id
         ${whereSQL}
         ORDER BY r.createdAt DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), skip]
      );
      console.log("Returned Reviews length:", reviews.length);
  } catch(e) {
      console.error(e);
  }
  process.exit(0);
}
test();