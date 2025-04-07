// app/auth/signup/page.tsx
'use client';

import { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, Heading, Text, Link, InputGroup, InputRightElement, IconButton, Progress,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const passwordSchema = z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, 'Password must have 1 upper, 1 lower, 1 number, 1 special character');

const commonPasswords = ['password123', 'admin123', 'welcome1'];

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  const validateForm = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!firstName) newErrors.firstName = 'First name is required';
    if (!lastName) newErrors.lastName = 'Last name is required';
    if (!z.string().email().safeParse(email).success) newErrors.email = 'Invalid email format';

    // Check if email is already registered
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();
    if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "no rows" error
      newErrors.email = 'Error checking email availability';
    } else if (existingUser) {
      newErrors.email = 'This email is already registered';
    }

    try {
      passwordSchema.parse(password);
      if (commonPasswords.some((p) => password.toLowerCase().includes(p))) {
        newErrors.password = 'Password is too common—choose something unique';
      }
    } catch (e) {
      newErrors.password = (e as z.ZodError).errors[0].message;
    }
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
    if (!(await validateForm())) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
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
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success('Magic link sent—check your email!');
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
          Sign Up
        </Heading>
        <FormControl isInvalid={!!errors.firstName}>
          <FormLabel color="brand.primary">First Name</FormLabel>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            bg="brand.light"
            borderColor="brand.primary"
            _focus={{ borderColor: 'brand.accent', boxShadow: '0 0 0 1px #c9cc00' }}
          />
          {errors.firstName && <Text color="red.500" fontSize="sm">{errors.firstName}</Text>}
        </FormControl>
        <FormControl isInvalid={!!errors.lastName}>
          <FormLabel color="brand.primary">Last Name</FormLabel>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            bg="brand.light"
            borderColor="brand.primary"
            _focus={{ borderColor: 'brand.accent', boxShadow: '0 0 0 1px #c9cc00' }}
          />
          {errors.lastName && <Text color="red.500" fontSize="sm">{errors.lastName}</Text>}
        </FormControl>
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
          <Progress value={passwordStrength()} mt={2} colorScheme={passwordStrength() > 75 ? 'green' : 'yellow'} />
          {errors.password && <Text color="red.500" fontSize="sm">{errors.password}</Text>}
        </FormControl>
        <MotionButton
          bg="brand.accent"
          color="white"
          _hover={{ bg: '#a0a900' }}
          onClick={handleSignup}
          w="full"
          isLoading={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          Sign Up
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
        <Text fontSize="sm">
          Already have an account? <Link href="/auth/login" color="brand.accent">Log In</Link>
        </Text>
        <Text fontSize="xs" color="gray.500">
          By clicking the submit button you agree to the{' '}
          <Link href="/terms" color="brand.accent">Terms and Conditions</Link>.
        </Text>
      </MotionBox>
    </MotionBox>
  );
}