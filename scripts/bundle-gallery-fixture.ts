import express from 'express';
import multer from 'multer';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { pool } from '../src/mysql-lib/db.js';
import bundlesRouter from '../src/mysql-routes/bundles.js';
import { authenticateToken, requireAdmin } from '../src/middleware/auth.js';

// Isolated SQL fixture: exercises the real bundle routes without changing live data.
export function createGalleryFixture() {
  process.env.JWT_SECRET = 'bundle-gallery-local-test-only';
  const bundles = new Map<string, any>([
    ['glow', { id: 'glow', name: 'The Glow Bundle', slug: 'the-glow-bundle', image: '/images/bundle-glow.jpg', isActive: true, discountType: 'percentage', discountValue: 10, discountPercent: 10 }],
    ['hydration', { id: 'hydration', name: 'The Hydration Bundle', slug: 'the-hydration-bundle', image: '/images/bundle-hydration.jpg', isActive: true }],
  ]);
  const product = { id: 'wash', name: 'Alvora Glow Beads Face Wash', price: 1400, inStock: true, trackInventory: false, status: 'published', isVisible: true, images: ['/images/animation/prod-1.png'], bundle_quantity: 1 };
  const cream = { ...product, id: 'cream', name: 'Alvora Radiance Brightening Cream', price: 1900, images: ['/images/animation/prod-2.png'] };
  const gallery = new Map<string, string[]>();
  let schemaReady = false;
  let snapshot: any;
  let failInsert = false;
  const execute = async (sql: string, params: any[] = []): Promise<any> => {
    if (sql.startsWith('CREATE TABLE IF NOT EXISTS bundle_images')) { schemaReady = true; return [{}]; }
    if (sql.startsWith('SELECT bundle_id, url, position FROM bundle_images')) {
      if (!schemaReady) throw Object.assign(new Error('missing gallery table'), { code: 'ER_NO_SUCH_TABLE' });
      return [params.flatMap(id => (gallery.get(id) || []).map((url, position) => ({ bundle_id: id, url, position })))];
    }
    if (sql.startsWith('DELETE FROM bundle_images')) { gallery.delete(params[0]); return [{}]; }
    if (sql.startsWith('INSERT INTO bundle_images')) {
      if (failInsert) throw new Error('Simulated gallery insert failure');
      const images = gallery.get(params[1]) || [];
      images[params[3]] = params[2]; gallery.set(params[1], images); return [{}];
    }
    if (sql.startsWith('SELECT * FROM bundles WHERE slug')) return [[...bundles.values()].filter(b => b.slug === params[0] && b.isActive)];
    if (sql.startsWith('SELECT * FROM bundles')) return [[...bundles.values()]];
    if (sql.startsWith('SELECT id FROM bundles WHERE slug')) return [[...bundles.values()].filter(b => b.slug === params[0] && (!sql.includes('id !=') || b.id !== params[1])).map(b => ({ id: b.id }))];
    if (sql.startsWith('SELECT id FROM bundles WHERE id')) return [bundles.has(params[0]) ? [{ id: params[0] }] : []];
    if (sql.includes('FROM bundle_products bp')) return [params.flatMap(id => [product, cream].map(p => ({ ...p, bundle_id: id })))];
    if (sql.includes('FROM product_images WHERE')) return [[product, cream].map(p => ({ product_id: p.id, url: p.images[0], position: 0 }))];
    if (sql.includes('FROM product_variants WHERE')) return [[]];
    if (sql.startsWith('SELECT id FROM products')) return [[{ id: params[0] }]];
    if (sql.startsWith('INSERT INTO bundles')) {
      const columns = sql.match(/\(([^)]+)\)/)![1].split(',').map(c => c.trim());
      const bundle = Object.fromEntries(columns.map((key, i) => [key, params[i]]));
      bundles.set(bundle.id, bundle); return [{}];
    }
    if (sql.startsWith('UPDATE bundles SET')) {
      const columns = sql.slice('UPDATE bundles SET '.length).split(' WHERE ')[0].split(',').map(c => c.split('=')[0].trim());
      const bundle = bundles.get(params.at(-1)); columns.forEach((key, i) => bundle[key] = params[i]); return [{}];
    }
    if (sql.startsWith('DELETE FROM bundles')) return [{ affectedRows: bundles.delete(params[0]) ? 1 : 0 }];
    if (/^(INSERT INTO|DELETE FROM) bundle_products/.test(sql)) return [{}];
    throw new Error(`Unexpected SQL in gallery test: ${sql}`);
  };
  pool.execute = execute as any;
  pool.getConnection = (async () => ({ execute,
    beginTransaction: async () => { snapshot = { bundles: structuredClone(bundles), gallery: structuredClone(gallery) }; },
    commit: async () => { snapshot = undefined; },
    rollback: async () => { if (snapshot) { bundles.clear(); gallery.clear(); snapshot.bundles.forEach((v: any, k: string) => bundles.set(k, v)); snapshot.gallery.forEach((v: any, k: string) => gallery.set(k, v)); snapshot = undefined; } },
    release: () => {},
  })) as any;
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use('/api/bundles', bundlesRouter);
  app.get('/api/products', (_req, res) => res.json([product, cream]));
  app.get('/api/settings', (_req, res) => res.json({ storeName: 'Alvora', currency: 'Rs.', freeShippingThreshold: 5000, standardShippingFee: 250 }));
  app.get('/api/auth/me', (_req, res) => res.json({ id: 'qa', role: 'admin', name: 'Gallery QA' }));
  app.get(['/api/categories', '/api/orders', '/api/auth/users', '/api/coupons', '/api/reviews/product/:id'], (_req, res) => res.json([]));
  const uploadedFiles = new Map<string, { buffer: Buffer; mimetype: string }>();
  app.post('/api/upload/image', authenticateToken, requireAdmin, multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }).single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const id = String(uploadedFiles.size + 1);
    uploadedFiles.set(id, req.file);
    res.json({ url: `http://127.0.0.1:5108/fixture-image/${id}`, publicId: `fixture/${id}` });
  });
  app.get('/fixture-image/:id', (req, res) => {
    const file = uploadedFiles.get(req.params.id);
    if (!file) return res.sendStatus(404);
    res.type(file.mimetype).send(file.buffer);
  });
  return { app, bundles, gallery, uploadedFiles, failNextGalleryInsert: (fail: boolean) => { failInsert = fail; }, token: jwt.sign({ userId: 'qa', email: 'qa@example.test', role: 'admin' }, process.env.JWT_SECRET) };
}
