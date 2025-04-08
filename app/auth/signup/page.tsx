// app/auth/signup/page.tsx
'use client';

import { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, Heading, Text, Link, InputGroup, InputRightElement, IconButton, Progress,
  Alert, AlertIcon, AlertDescription, Spinner
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { motion } from 'framer-motion';
import OAuthButton from '../../../features/auth/OAuthButton';

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
  const [userExists, setUserExists] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!firstName) newErrors.firstName = 'First name is required';
    if (!lastName) newErrors.lastName = 'Last name is required';
    if (!z.string().email().safeParse(email).success) newErrors.email = 'Invalid email format';
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

  const generateDefaultHandle = () => {
    const randomString = Math.random().toString(36).substring(2, 8);
    return `user_${randomString}`;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setUserExists(false);
    const defaultHandle = generateDefaultHandle();

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { first_name: firstName, last_name: lastName, handle: defaultHandle },
          emailRedirectTo: 'http://localhost:3000/dashboard',
        },
      });
      
      setLoading(false);
      
      if (error) {
        if (error.message === 'User already registered') {
          setUserExists(true);
          toast.error('This email is already registered. Please log in instead.');
        } else if (error.status === 429) {
          toast.error('Too many signup attempts. Please wait a bit and try again.');
        } else if (error.message.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(error.message || 'An error occurred during signup. Please try again.');
        }
      } else if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          setUserExists(true);
          toast.error('This email is already registered. Please log in instead.');
        } else {
          toast.success('Check your email to confirm your account!');
          router.push('/dashboard');
          router.refresh(); // Force refresh to sync session
        }
      } else {
        toast.error('Unexpected response from server. Please try again.');
      }
    } catch (e) {
      setLoading(false);
      toast.error('Network error. Please check your connection and try again.');
    }
  };

  const handleMagicLink = async () => {
    if (!z.string().email().safeParse(email).success) {
      toast.error('Please enter a valid email address.');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password: 'temp-password-check',
        options: { emailRedirectTo: 'http://localhost:3000/dashboard' },
      });
      
      if (signupError && signupError.message !== 'User already registered') {
        setLoading(false);
        toast.error(signupError.message || 'Error checking email. Please try again.');
        return;
      }
      
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        const { error } = await supabase.auth.signInWithOtp({ 
          email,
          options: { emailRedirectTo: 'http://localhost:3000/dashboard' },
        });
        setLoading(false);
        if (error) {
          toast.error(error.message || 'Error sending magic link. Please try again.');
        } else {
          toast.success('Magic link sent—check your email!');
        }
      } else {
        setLoading(false);
        toast.error('Please sign up first before using magic link.');
      }
    } catch (e) {
      setLoading(false);
      toast.error('Network error. Please check your connection and try again.');
    }
  };

  const redirectToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        minH="100vh"
        bgImage="url('/singuplog.webp')"
        bgSize="cover"
        bgPosition="center"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Box
            p={6}
            bg="brand.neutral"
            borderRadius="md"
            boxShadow="lg"
            w={{ base: '90%', sm: '400px' }}
            display="flex"
            flexDirection="column"
            gap={4}
          >
            <Heading color="brand.primary" fontSize={{ base: 'xl', md: '2xl' }}>
              Sign Up
            </Heading>
            
            {userExists && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  This email is already registered. Please log in instead.
                </AlertDescription>
              </Alert>
            )}
            
            <FormControl isInvalid={!!errors.firstName}>
              <FormLabel color="brand.primary">First Name</FormLabel>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                bg="brand.light"
                borderColor="brand.primary"
                _focus={{ borderColor: 'brand.accent', boxShadow: '0 0 0 1px #c9cc00' }}
                isDisabled={userExists || loading}
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
                isDisabled={userExists || loading}
              />
              {errors.lastName && <Text color="red.500" fontSize="sm">{errors.lastName}</Text>}
            </FormControl>
            <FormControl isInvalid={!!errors.email}>
              <FormLabel color="brand.primary">Email</FormLabel>
              <InputGroup>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setUserExists(false);
                  }}
                  bg="brand.light"
                  borderColor="brand.primary"
                  _focus={{ borderColor: 'brand.accent', boxShadow: '0 0 0 1px #c9cc00' }}
                  isDisabled={loading}
                />
                {loading && (
                  <InputRightElement>
                    <Spinner size="sm" color="brand.accent" />
                  </InputRightElement>
                )}
              </InputGroup>
              {errors.email && <Text color="red.500" fontSize="sm">{errors.email}</Text>}
            </FormControl>
            
            {!userExists && (
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
                    isDisabled={loading}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Toggle password visibility"
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      isDisabled={loading}
                    />
                  </InputRightElement>
                </InputGroup>
                <Progress value={passwordStrength()} mt={2} colorScheme={passwordStrength() > 75 ? 'green' : 'yellow'} />
                {errors.password && <Text color="red.500" fontSize="sm">{errors.password}</Text>}
              </FormControl>
            )}
            
            {userExists ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  bg="brand.accent"
                  color="white"
                  _hover={{ bg: '#a0a900' }}
                  onClick={redirectToLogin}
                  w="full"
                  isDisabled={loading}
                >
                  Go to Login
                </Button>
              </motion.div>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
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
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
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
                </motion.div>
                <OAuthButton provider="google" isLoading={loading} setLoading={setLoading} />
              </>
            )}
            
            <Text fontSize="sm">
              Already have an account? <Link href="/auth/login" color="brand.accent">Log In</Link>
            </Text>
            <Text fontSize="xs" color="gray.500">
              By clicking the submit button you agree to the{' '}
              <Link href="/terms" color="brand.accent">Terms and Conditions</Link>.
            </Text>
          </Box>
        </motion.div>
      </Box>
    </motion.div>
  );
}