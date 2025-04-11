// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/*', 'video/mp4', 'audio/mpeg'];
    if (!allowedTypes.some((type) => file.type.match(type.replace('*', '.*')))) {
      return NextResponse.json(
        { error: 'Invalid file type. Use images, MP4 videos, or MP3 audio.' },
        { status: 400 }
      );
    }

    if (file.size > 1048576) {
      return NextResponse.json(
        { error: 'File size exceeds 1MB limit' },
        { status: 400 }
      );
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const fileBody = Buffer.from(await file.arrayBuffer());

    // Determine the folder based on file type
    const folder = file.type.startsWith('image')
      ? 'images'
      : file.type.startsWith('video')
      ? 'videos'
      : 'audio';

    console.log(`Uploading file to bucket 'media', folder '${folder}', filename '${fileName}'`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(`${folder}/${fileName}`, fileBody, {
        contentType: file.type,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: `Supabase upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(`${folder}/${fileName}`);

    console.log('File uploaded successfully, public URL:', publicUrlData.publicUrl);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}