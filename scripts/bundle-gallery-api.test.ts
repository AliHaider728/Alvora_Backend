import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGalleryFixture } from './bundle-gallery-fixture';
import { validateBundleGallery } from '../src/mysql-lib/bundleGallery.js';

test('gallery URLs are validated and limited to eight', () => {
  for (const value of [null, 'image.jpg', ['javascript:alert(1)'], Array(9).fill('/image.jpg'), [5], ['']]) assert.throws(() => validateBundleGallery(value));
  assert.deepEqual(validateBundleGallery([' https://example.test/a.jpg ', '/images/b.jpg']), ['https://example.test/a.jpg', '/images/b.jpg']);
});

test('real bundle routes persist ordered galleries independently and atomically', async t => {
  const fixture = createGalleryFixture();
  const server = fixture.app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}/api/bundles`;
  const call = async (url = '', method = 'GET', body?: any, authenticated = true) => {
    const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: `Bearer ${fixture.token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json() };
  };
  try {
    await t.test('unmigrated bundles have an empty gallery, not included-product images', async () => {
      const bundle = (await call('/the-glow-bundle')).data;
      assert.deepEqual(bundle.galleryImages, []);
      assert.ok(bundle.products[0].images.length);
    });
    await t.test('authentication and validation reject invalid saves', async () => {
      assert.equal((await call('/glow', 'PUT', { galleryImages: [] }, false)).status, 401);
      assert.equal((await call('/glow', 'PUT', { galleryImages: Array(9).fill('/a.jpg') })).status, 400);
    });
    await t.test('save/reorder/replace persists exact images in list and detail', async () => {
      for (const galleryImages of [['/wash.jpg', '/cream.jpg', '/detail.jpg'], ['/detail.jpg', '/wash.jpg', '/cream.jpg'], ['/replacement.jpg', '/cream.jpg']]) {
        assert.equal((await call('/glow', 'PUT', { galleryImages })).status, 200);
        assert.deepEqual((await call('/the-glow-bundle')).data.galleryImages, galleryImages);
        assert.deepEqual((await call()).data.bundles.find((b: any) => b.id === 'glow').galleryImages, galleryImages);
        assert.deepEqual((await call('/the-hydration-bundle')).data.galleryImages, []);
      }
    });
    await t.test('omitted field preserves gallery and failed writes roll back', async () => {
      await call('/glow', 'PUT', { description: 'Other edit' });
      assert.deepEqual(fixture.gallery.get('glow'), ['/replacement.jpg', '/cream.jpg']);
      fixture.failNextGalleryInsert(true);
      assert.equal((await call('/glow', 'PUT', { galleryImages: ['/new.jpg'] })).status, 500);
      fixture.failNextGalleryInsert(false);
      assert.deepEqual(fixture.gallery.get('glow'), ['/replacement.jpg', '/cream.jpg']);
    });
    await t.test('create, clear and delete do not affect another bundle', async () => {
      const created = await call('', 'POST', { name: 'New Bundle', slug: 'new-bundle', galleryImages: ['/new.jpg'] });
      assert.equal(created.status, 201);
      assert.deepEqual((await call('/new-bundle')).data.galleryImages, ['/new.jpg']);
      await call('/glow', 'PUT', { galleryImages: [] });
      assert.deepEqual((await call('/the-glow-bundle')).data.galleryImages, []);
      assert.deepEqual(fixture.gallery.get(created.data.bundleId), ['/new.jpg']);
      assert.equal((await call(`/${created.data.bundleId}`, 'DELETE')).status, 200);
      assert.equal(fixture.gallery.has(created.data.bundleId), false);
    });
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
