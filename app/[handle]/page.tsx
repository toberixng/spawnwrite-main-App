// app/[handle]/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function HandlePage() {
  const router = useRouter();
  const { handle } = useParams();

  useEffect(() => {
    // For now, redirect to dashboard; later, this can be a profile page
    router.push('/dashboard');
  }, [router]);

  return null; // No content needed since it redirects
}