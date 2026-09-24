import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { DEFAULT_ROUTINE_DISCOUNT } from '../src/lib/routineDiscount.js';

test('routine settings persistence, permissions and order totals through Express routes', async t => {
  // No live database, mail, analytics or other external writes are used by this test.
  for (const key of ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'NEW_ORDER_NOTIFICATION_EMAILS', 'META_PIXEL_ID', 'META_CAPI_ACCESS_TOKEN', 'TIKTOK_PIXEL_ID', 'TIKTOK_ACCESS_TOKEN']) process.env[key] = '';
  process.env.JWT_SECRET = 'routine-test-only-secret';
  const { pool } = await import('../src/mysql-lib/db.js');
  let exists = false;
  let config: string | undefined;
  let order: any;
  let orderItems: any[] = [];
  let writes = 0;
  const execute = async (sql: string, params: any[] = []) => {
    if (sql.includes('SELECT config FROM routine_discount_settings')) {
      if (!exists) throw Object.assign(new Error('missing test table'), { code: 'ER_NO_SUCH_TABLE' });
      return [config ? [{ config }] : []];
    }
    if (sql.startsWith('CREATE TABLE IF NOT EXISTS routine_discount_settings')) { exists = true; return [{}]; }
    if (sql.startsWith('INSERT INTO routine_discount_settings')) { config = params[0]; writes++; return [{}]; }
    if (sql.includes('FROM products WHERE id')) return [[{ id: params[0], name: `Product ${params[0]}`, price: 1000, inStock: true, trackInventory: false, status: 'published', isVisible: true, productType: 'simple', pricingOffers: null }]];
    if (sql.startsWith('SELECT standardShippingFee')) return [[{ standardShippingFee: 250, freeShippingThreshold: 5000 }]];
    if (sql.includes('FROM coupons WHERE')) return params[0] === 'VALID10' ? [[{ discountType: 'percentage', discountValue: 10, minPurchase: 0, usageLimit: null, usageCount: 0, expiryDate: null }]] : [[]];
    if (sql.includes('INSERT INTO orders (')) {
      order = { id: params[0], orderId: params[1], guestEmail: params[2], guestPhone: params[3], total: params[4], subtotal: params[5], shippingFee: params[6], discountAmount: params[7], status: params[8], paymentMethod: params[9], shippingAddress: params[10], appliedCoupon: params[11], createdAt: params[13] };
      orderItems = [];
      return [{}];
    }
    if (sql.includes('INSERT INTO order_items')) { orderItems.push({ id: params[0], productId: params[2], productName: params[3], quantity: params[4], price: params[5] }); return [{}]; }
    if (sql.includes('INSERT INTO order_status_history') || sql.startsWith('UPDATE orders SET confirmationEmail')) return [{}];
    if (sql.includes('FROM orders WHERE id = ? OR orderId = ?')) return [[{ ...order }]];
    if (sql.includes('FROM order_items WHERE order_id')) return [orderItems];
    if (sql.includes('FROM order_status_history WHERE')) return [[]];
    throw new Error(`Unexpected test SQL: ${sql}`);
  };
  pool.execute = execute as any;
  pool.getConnection = (async () => ({ execute, beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {} })) as any;
  const settingsRouter = (await import('../src/mysql-routes/settings.js')).default;
  const ordersRouter = (await import('../src/mysql-routes/orders.js')).default;
  const app = express();
  app.use(express.json());
  app.use('/settings', settingsRouter);
  app.use('/orders', ordersRouter);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const request = async (path: string, method = 'GET', body?: any, role?: string) => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: `Bearer ${jwt.sign({ userId: 'test', email: 'qa@example.test', role }, process.env.JWT_SECRET!)}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, body: await response.json() };
  };
  const submit = (quantities: number[], discount: number, extra: Record<string, any> = {}) => request('/orders', 'POST', { customerName: 'Routine QA', phone: '03000000000', items: quantities.map((quantity, index) => ({ productId: String(index), quantity, price: 1, isRoutine: true })), discountAmount: discount, shippingFee: 0, ...extra });
  try {
    await t.test('missing table returns defaults without a database mutation', async () => {
      const response = await request('/settings/routine');
      assert.equal(response.status, 200);
      assert.deepEqual(response.body, DEFAULT_ROUTINE_DISCOUNT);
      assert.equal(exists, false);
    });
    await t.test('only admins can save and invalid settings never persist', async () => {
      assert.equal((await request('/settings/routine', 'PUT', DEFAULT_ROUTINE_DISCOUNT)).status, 401);
      assert.equal((await request('/settings/routine', 'PUT', DEFAULT_ROUTINE_DISCOUNT, 'customer')).status, 403);
      assert.equal((await request('/settings/routine', 'PUT', { ...DEFAULT_ROUTINE_DISCOUNT, quantityBonusPercent: 99 }, 'admin')).status, 400);
      assert.equal(writes, 0);
      assert.equal((await request('/settings/routine', 'PUT', DEFAULT_ROUTINE_DISCOUNT, 'admin')).status, 200);
      assert.equal(writes, 1);
      assert.deepEqual((await request('/settings/routine')).body, DEFAULT_ROUTINE_DISCOUNT);
    });
    for (const scenario of [
      { quantities: [1, 1], discount: 200, total: 1800 },
      { quantities: [1, 1, 1], discount: 450, total: 2550 },
      { quantities: [2, 1], discount: 450, total: 2550 },
      { quantities: [3, 1, 1], discount: 1000, total: 4000 },
      { quantities: [1], discount: 0, total: 1000 },
    ]) await t.test(`order ${scenario.quantities}: server saves discount ${scenario.discount} and total ${scenario.total}`, async () => {
      const response = await submit(scenario.quantities, scenario.discount);
      assert.equal(response.status, 201, JSON.stringify(response.body));
      assert.equal(response.body.discountAmount, scenario.discount);
      assert.equal(response.body.total, scenario.total);
      assert.ok(response.body.items.every((item: any) => item.price === 1000), 'Ignore spoofed routine prices');
    });
    await t.test('bonus never stacks and cannot apply to one distinct product', async () => {
      assert.equal((await submit([5, 1, 1], 1400)).status, 201);
      assert.equal((await submit([5], 250)).status, 400);
      assert.equal((await submit([1, 1], 400)).status, 400);
      assert.equal((await submit([1.5, 1], 0)).status, 400);
    });
    await t.test('ordinary cart products do not unlock routine tiers; coupon data comes from the database', async () => {
      const mixed = await submit([1, 1], 100, { items: [{ productId: 'a', quantity: 1, price: 1000, isRoutine: true }, { productId: 'b', quantity: 1, price: 1000 }] });
      assert.equal(mixed.status, 400);
      const coupon = await submit([1, 1], 400, { appliedCoupon: { code: 'VALID10', discountValue: 90 } });
      assert.equal(coupon.status, 201);
      assert.equal(coupon.body.total, 1600);
      assert.equal((await submit([1, 1], 400, { appliedCoupon: { code: 'FAKE', discountValue: 10 } })).status, 400);
    });
    await t.test('custom minimum, extra tiers and disabled bonus are used immediately by checkout', async () => {
      const custom = { minimumDistinctProducts: 3, tiers: [{ minProducts: 3, discountPercent: 12 }, { minProducts: 4, discountPercent: 22 }], quantityBonusEnabled: false, quantityBonusPercent: 7 };
      assert.equal((await request('/settings/routine', 'PUT', custom, 'admin')).status, 200);
      assert.deepEqual((await request('/settings/routine')).body, custom);
      assert.equal((await submit([2, 1], 0)).status, 201);
      assert.equal((await submit([2, 1, 1], 480)).status, 201);
      assert.equal((await submit([2, 1, 1, 1], 1100)).status, 201);
    });
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await pool.end();
  }
});
