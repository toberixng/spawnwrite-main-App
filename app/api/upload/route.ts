// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { flexibleChecksumsMiddleware } from '@aws-sdk/middleware-flexible-checksums';

const b2Client = new S3Client({
  region: 'us-east-005',
  endpoint: process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY || '',
  },
});

// Add middleware to disable checksum headers
b2Client.middlewareStack.add(
  flexibleChecksumsMiddleware({ 
    disableRequestChecksum: true 
  }), 
  { step: 'build', 
    name: 'disableChecksumMiddleware', 
    priority: 'high' 
  });


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const allowedTypes = ['image/*', 'video/mp4', 'audio/mpeg'];
    if (!allowedTypes.some((type) => file.type.match(type.replace('*', '.*')))) {
      return NextResponse.json({ error: 'Invalid file type. Use images, MP4 videos, or MP3 audio.' }, { status: 400 });
    }

    if (file.size > 1001048576) {
      return NextResponse.json({ error: 'File size exceeds 1MB limit' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;
    const fileBody = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME || 'spawnwrite-media',
      Key: filePath,
      Body: fileBody,
      ContentType: file.type,
    });

    await b2Client.send(command);

    const url = `${process.env.B2_PUBLIC_URL || 'https://f005.backblazeb2.com/file/spawnwrite-media'}/${filePath}`;
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('B2 Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}