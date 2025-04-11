// app/[handle]/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HandlePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard'); // Always redirect to dashboard
  }, [router]);

  return null;
}