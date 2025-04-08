// features/auth/OAuthButton.tsx
'use client';

import { Button } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const MotionButton = motion(Button);

interface OAuthButtonProps {
  provider: 'google';
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function OAuthButton({ provider, isLoading, setLoading }: OAuthButtonProps) {
  const router = useRouter();

  const handleOAuthLogin = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'http://localhost:3000/dashboard', // Adjust for production later
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || `Failed to sign in with ${provider}`);
    } else {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error('Failed to fetch user data after login');
      } else {
        const handle = userData.user.user_metadata.handle || 'user'; // Default to 'user'
        toast.success(`Signed in with ${provider} successfully!`);
        router.push(`/${handle}`); // Redirect to /[handle]
      }
    }
  };

  return (
    <MotionButton
      variant="outline"
      borderColor="brand.primary"
      color="brand.primary"
      onClick={handleOAuthLogin}
      w="full"
      isLoading={isLoading}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      Sign in with Google
    </MotionButton>
  );
}