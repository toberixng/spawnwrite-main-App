// app/auth/signup/page.tsx
'use client';

import { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, Heading, VStack, Text, Link, InputRightElement, InputGroup, IconButton, Progress,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';

const passwordSchema = z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, 'Password must have 1 upper, 1 lower, 1 number, 1 special character');

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!firstName) newErrors.firstName = 'First name is required';
    if (!lastName) newErrors.lastName = 'Last name is required';
    if (!z.string().email().safeParse(email).success) newErrors.email = 'Invalid email format';
    try {
      passwordSchema.parse(password);
    } catch (e) {
      newErrors.password = (e as z.ZodError).errors[0].message;
    }
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords must match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const passwordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[!@#$%^&*]/.test(password)) strength += 25;
    return strength;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email to confirm your account!');
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

  const handleGoogleSignup = async () => {
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
        <Heading color="brand.primary" fontSize={{ base: 'xl', md: '2xl' }}>Sign Up</Heading>
        <FormControl isInvalid={!!errors.firstName}>
          <FormLabel color="brand.primary">First Name</FormLabel>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} bg="brand.light" borderColor="brand.primary" />
          {errors.firstName && <Text color="red.500" fontSize="sm">{errors.firstName}</Text>}
        </FormControl>
        <FormControl isInvalid={!!errors.lastName}>
          <FormLabel color="brand.primary">Last Name</FormLabel>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} bg="brand.light" borderColor="brand.primary" />
          {errors.lastName && <Text color="red.500" fontSize="sm">{errors.lastName}</Text>}
        </FormControl>
        <FormControl isInvalid={!!errors.email}>
          <FormLabel color="brand.primary">Email</FormLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} bg="brand.light" borderColor="brand.primary" />
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
          <Progress value={passwordStrength()} mt={2} colorScheme={passwordStrength() > 75 ? 'green' : 'yellow'} />
          {errors.password && <Text color="red.500" fontSize="sm">{errors.password}</Text>}
        </FormControl>
        <FormControl isInvalid={!!errors.confirmPassword}>
          <FormLabel color="brand.primary">Confirm Password</FormLabel>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            bg="brand.light"
            borderColor="brand.primary"
          />
          {errors.confirmPassword && <Text color="red.500" fontSize="sm">{errors.confirmPassword}</Text>}
        </FormControl>
        <Button
          bg="brand.accent"
          color="white"
          _hover={{ bg: '#a0a900' }}
          onClick={handleSignup}
          w="full"
          isLoading={loading}
        >
          Sign Up
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
          onClick={handleGoogleSignup}
          w="full"
          isLoading={loading}
          leftIcon={<img src="/google-icon.png" alt="Google" width="20" />}
        >
          Sign up with Google
        </Button>
        <Text fontSize="sm">
          Already have an account? <Link href="/auth/login" color="brand.accent">Log In</Link>
        </Text>
      </VStack>
    </Box>
  );
}