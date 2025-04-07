// app/dashboard/page.tsx
'use client';

import { Heading, Button } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div>
      <Heading color="brand.primary">Welcome to Your Dashboard!</Heading>
      <Button mt={4} bg="brand.accent" color="white" onClick={handleLogout}>
        Log Out
      </Button>
    </div>
  );
}