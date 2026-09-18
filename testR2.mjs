import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function testR2() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;
  console.log("Account ID:", accountId);

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: accessKeyId || '',
      secretAccessKey: secretAccessKey || '',
    },
  });

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || 'alvora-assets',
    Key: 'test-upload.txt',
    Body: 'hello world',
    ContentType: 'text/plain',
  });

  try {
    const response = await s3Client.send(command);
    console.log('Upload successful');
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

testR2();
