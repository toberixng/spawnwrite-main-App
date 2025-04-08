// app/auth/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, Heading, Text, Link, InputGroup, InputRightElement, IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import OAuthButton from '../../../features/auth/OAuthButton';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  useEffect(() => {
    // Check if a user is already logged in and redirect
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push('/dashboard');
        router.refresh();
      }
    });
  }, [router]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully!');
      router.push('/dashboard');
      router.refresh(); // Force refresh to sync session
    }
  };

  const handleMagicLink = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success('Magic link sent—check your email!');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email first');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/auth/reset-password',
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success('Password reset email sent—check your inbox!');
  };

  return (
    <MotionBox
      minH="100vh"
      bgImage="url('/singuplog.webp')"
      bgSize="cover"
      bgPosition="center"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MotionBox
        p={6}
        bg="brand.neutral"
        borderRadius="md"
        boxShadow="lg"
        w={{ base: '90%', sm: '400px' }}
        display="flex"
        flexDirection="column"
        gap={4}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Heading color="brand.primary" fontSize={{ base: 'xl', md: '2xl' }}>
          Login
        </Heading>
        <FormControl isInvalid={!!errors.email}>
          <FormLabel color="brand.primary">Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            bg="brand.light"
            borderColor="brand.primary"
            _focus={{ borderColor: 'brand.accent', boxShadow: '0 0 0 1px #c9cc00' }}
          />
          {errors.email && <Text color="red.500" fontSize="sm">{errors.email}</Text>}
        </FormControl>
        <FormControl isInvalid={!!errors.password}>
          <FormLabel color="brand.primary">Password</FormLabel>
          <InputGroup>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              bg="brand.light"
              borderColor="brand.primary"
              _focus={{ borderColor: 'brand.accent', boxShadow: '0 0 0 1px #c9cc00' }}
            />
            <InputRightElement>
              <IconButton
                aria-label="Toggle password visibility"
                icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                onClick={() => setShowPassword(!showPassword)}
                variant="ghost"
              />
            </InputRightElement>
          </InputGroup>
          {errors.password && <Text color="red.500" fontSize="sm">{errors.password}</Text>}
        </FormControl>
        <Text fontSize="sm" textAlign="right">
          <Link color="brand.accent" onClick={handleForgotPassword}>
            Forgot Password?
          </Link>
        </Text>
        <MotionButton
          bg="brand.accent"
          color="white"
          _hover={{ bg: '#a0a900' }}
          onClick={handleLogin}
          w="full"
          isLoading={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          Log In
        </MotionButton>
        <MotionButton
          variant="outline"
          borderColor="brand.primary"
          color="brand.primary"
          onClick={handleMagicLink}
          w="full"
          isLoading={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          Send Magic Link
        </MotionButton>
        <OAuthButton provider="google" isLoading={loading} setLoading={setLoading} />
        <Text fontSize="sm">
          Don’t have an account? <Link href="/auth/signup" color="brand.accent">Sign Up</Link>
        </Text>
        <Text fontSize="xs" color="gray.500">
          By clicking the submit button you agree to the{' '}
          <Link href="/terms" color="brand.accent">Terms and Conditions</Link>.
        </Text>
      </MotionBox>
    </MotionBox>
  );
}