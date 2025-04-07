// app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, Heading, VStack, Text, Link, InputGroup, InputRightElement, IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully!');
      router.push('/dashboard');
    }
  };

  const handleMagicLink = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success('Magic link sent—check your email!');
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000/dashboard' },
    });
    setLoading(false);
    if (error) toast.error(error.message);
  };

  return (
    <Box
      minH="100vh"
      bgImage="url('/singuplog.jpeg')"
      bgSize="cover"
      bgPosition="center"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <VStack
        spacing={4}
        p={6}
        bg="brand.neutral"
        borderRadius="md"
        boxShadow="lg"
        w={{ base: '90%', sm: '400px' }}
      >
        <Heading color="brand.primary" fontSize={{ base: 'xl', md: '2xl' }}>Login</Heading>
        <FormControl isInvalid={!!errors.email}>
          <FormLabel color="brand.primary">Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            bg="brand.light"
            borderColor="brand.primary"
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
        <Button
          bg="brand.accent"
          color="white"
          _hover={{ bg: '#a0a900' }}
          onClick={handleLogin}
          w="full"
          isLoading={loading}
        >
          Log In
        </Button>
        <Button
          variant="outline"
          borderColor="brand.primary"
          color="brand.primary"
          onClick={handleMagicLink}
          w="full"
          isLoading={loading}
        >
          Send Magic Link
        </Button>
        <Button
          bg="white"
          color="brand.primary"
          border="1px"
          borderColor="brand.primary"
          onClick={handleGoogleLogin}
          w="full"
          isLoading={loading}
          leftIcon={<img src="/google-icon.png" alt="Google" width="20" />}
        >
          Sign in with Google
        </Button>
        <Text fontSize="sm">
          Don’t have an account? <Link href="/auth/signup" color="brand.accent">Sign Up</Link>
        </Text>
      </VStack>
    </Box>
  );
}