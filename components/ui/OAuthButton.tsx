// // components/ui/OAuthButton.tsx
// 'use client';

// import { Button } from '@chakra-ui/react';
// import { supabase } from '../../lib/supabase';
// import { toast } from 'sonner';
// import { motion } from 'framer-motion';

// const MotionButton = motion(Button);

// interface OAuthButtonProps {
//   provider: 'google';
//   isLoading: boolean;
//   setLoading: (loading: boolean) => void;
//   action: 'login' | 'signup';
// }

// export default function OAuthButton({ provider, isLoading, setLoading, action }: OAuthButtonProps) {
//   const handleOAuth = async () => {
//     setLoading(true);
//     await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay, matching your existing pattern

//     const { error } = await supabase.auth.signInWithOAuth({
//       provider,
//       options: {
//         redirectTo: 'http://localhost:3000/dashboard', // Adjust for production
//       },
//     });

//     setLoading(false);
//     if (error) {
//       toast.error(`Error during ${action} with Google: ${error.message}`);
//     } else {
//       toast.success(`Redirecting to ${action} with Google...`);
//     }
//   };

//   return (
//     <MotionButton
//       variant="outline"
//       borderColor="brand.primary"
//       color="brand.primary"
//       onClick={handleOAuth}
//       w="full"
//       isLoading={isLoading}
//       whileHover={{ scale: 1.05 }}
//       whileTap={{ scale: 0.95 }}
//       transition={{ duration: 0.2 }}
//     >
//       {action === 'login' ? 'Log In' : 'Sign Up'} with Google
//     </MotionButton>
//   );
// }