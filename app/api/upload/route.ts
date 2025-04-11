// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createMuxClient } from '@mux/mux-node';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize Mux client
const muxTokenId = process.env.MUX_TOKEN_ID;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

if (!muxTokenId || !muxTokenSecret) {
  console.error('Missing Mux environment variables');
  throw new Error('Missing Mux environment variables');
}

const mux = createMuxClient({
  tokenId: muxTokenId,
  tokenSecret: muxTokenSecret,
});

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

    if (file.type.startsWith('image')) {
      // Upload image to Supabase Storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(`images/${fileName}`, fileBody, {
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
        .getPublicUrl(`images/${fileName}`);

      return NextResponse.json({ url: publicUrlData.publicUrl });
    } else {
      // Upload video or audio to Mux
      const upload = await mux.video.uploads.create({
        cors_origin: '*',
        new_asset_settings: { playback_policy: ['public'] },
      });

      // Upload the file to Mux's direct upload URL
      const response = await fetch(upload.url, {
        method: 'PUT',
        body: fileBody,
        headers: { 'Content-Type': file.type },
      });

      if (!response.ok) {
        console.error('Mux upload response:', response.status, response.statusText);
        return NextResponse.json(
          { error: `Failed to upload to Mux: ${response.statusText}` },
          { status: 500 }
        );
      }

      // Wait for the asset to be created (simplified; in production, use webhooks)
      const asset = await mux.video.assets.retrieve(upload.asset_id);
      const playbackId = asset.playback_ids?.[0]?.id;
      const playbackUrl = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null;

      if (!playbackUrl) {
        console.error('Mux playback URL generation failed:', asset);
        return NextResponse.json(
          { error: 'Failed to generate playback URL' },
          { status: 500 }
        );
      }

      return NextResponse.json({ url: playbackUrl });
    }
  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}