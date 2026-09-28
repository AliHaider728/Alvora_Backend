import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { createProductImage, createProductThumbnail } from '../src/lib/productImages';

test('large portrait uploads produce WebP derivatives within their size limits without cropping', async () => {
  const input = await sharp({ create: { width: 1800, height: 2400, channels: 3, background: '#D4784F' } }).png().toBuffer();
  const main = await sharp(await createProductImage(input)).metadata();
  const thumbBuffer = await createProductThumbnail(input);
  const thumb = await sharp(thumbBuffer).metadata();
  assert.equal(main.format, 'webp');
  assert.deepEqual([main.width, main.height], [1200, 1600]);
  assert.equal(thumb.format, 'webp');
  assert.deepEqual([thumb.width, thumb.height], [300, 400]);
  assert.ok(thumbBuffer.length < 60 * 1024);
});

test('small uploads are not enlarged and transparent backgrounds are retained', async () => {
  const input = await sharp({ create: { width: 160, height: 80, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } } }).png().toBuffer();
  for (const create of [createProductImage, createProductThumbnail]) {
    const result = await sharp(await create(input)).metadata();
    assert.deepEqual([result.width, result.height], [160, 80]);
    assert.equal(result.hasAlpha, true);
  }
});

test('EXIF rotation is applied before sizing', async () => {
  const input = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#F2E9E2' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const result = await sharp(await createProductThumbnail(input)).metadata();
  assert.deepEqual([result.width, result.height], [267, 400]);
  assert.ok(!result.orientation || result.orientation === 1);
});

test('invalid image bytes are rejected instead of uploaded as an image', async () => {
  await assert.rejects(() => createProductImage(Buffer.from('not an image')));
  await assert.rejects(() => createProductThumbnail(Buffer.from('not an image')));
});
