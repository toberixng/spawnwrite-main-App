import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';

// Configure R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT || 'https://pub-a754194593ed449fb64f9f48565505c1.r2.dev',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    // Verify credentials are properly set
    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'R2 credentials not properly configured on the server' }, 
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;
    
    const fileBuffer = await file.arrayBuffer();
    
    const command = new PutObjectCommand({
      Bucket: 'images', // Make sure this bucket name exists in your R2 account
      Key: filePath,
      Body: new Uint8Array(fileBuffer),
      ContentType: file.type,
    });

    await r2Client.send(command);
    
    // Make sure this URL format matches your R2 public setup
    const publicUrl = `https://f1a6a03bc9025589fe68d1b9d7d3c1f6.r2.cloudflarestorage.com/images/${filePath}`;
    
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: unknown) {
    console.error('Error uploading to R2:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}