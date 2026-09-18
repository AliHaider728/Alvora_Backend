import 'dotenv/config';
import { uploadToR2 } from './dist/lib/r2.js';

async function testR2() {
  try {
    const response = await uploadToR2(Buffer.from('hello'), 'test2.txt', 'text/plain');
    console.log('Upload successful:', response);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
testR2();
