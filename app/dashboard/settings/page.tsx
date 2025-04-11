// app/dashboard/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box, Heading, VStack, Button, HStack, FormControl, FormLabel, Input, Spinner, Text,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import NextLink from 'next/link';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

export default function Settings() {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/auth/login');
        return;
      }
      setHandle(user.user_metadata.handle || '');
      setFetching(false);
    };
    fetchUser();
  }, [router]);

  const handleSave = async () => {
    if (!handle.trim()) {
      toast.error('Handle cannot be empty');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(handle)) {
      toast.error('Handle must be 3-20 characters, letters, numbers, or underscores only');
      return;
    }

    setLoading(true);
    const { data: { user }, error } = await supabase.auth.updateUser({
      data: { handle },
    });

    if (error) {
      toast.error(error.message || 'Failed to update handle');
    } else {
      toast.success('Handle updated successfully!');
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged out successfully!');
      router.push('/auth/login');
      router.refresh();
    }
  };

  if (fetching) {
    return (
      <Box minH="100vh" bg="gray.100" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="brand.accent" />
      </Box>
    );
  }

  return (
    <MotionBox
      minH="100vh"
      bg="gray.100"
      color="brand.primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MotionBox
        as="nav"
        bg="brand.primary"
        color="white"
        p={4}
        position="sticky"
        top={0}
        zIndex={10}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HStack justify="space-between" maxW="800px" mx="auto">
          <Heading size="md">SpawnWrite</Heading>
          <HStack spacing={4}>
            <NextLink href="/dashboard" passHref legacyBehavior>
              <MotionButton as="a" bg="transparent" color="white" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                Dashboard
              </MotionButton>
            </NextLink>
            <NextLink href="/dashboard/editor" passHref legacyBehavior>
              <MotionButton as="a" bg="transparent" color="white" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                Editor
              </MotionButton>
            </NextLink>
            <MotionButton bg="transparent" color="white" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }} onClick={handleLogout}>
              Logout
            </MotionButton>
          </HStack>
        </HStack>
      </MotionBox>

      <VStack spacing={6} maxW="800px" mx="auto" py={10}>
        <Heading fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold">
          Settings
        </Heading>
        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" w="full">
          <FormControl>
            <FormLabel fontWeight="bold">Handle</FormLabel>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="e.g., johndoe123"
              bg="gray.50"
              borderColor="brand.primary"
              _focus={{ borderColor: 'brand.accent', boxShadow: '0 0 0 1px #c9cc00' }}
              isDisabled={loading}
            />
            <Text fontSize="sm" color="gray.500" mt={2}>
              Your handle will appear as spawnwrite.com/{handle} (customization coming soon!)
            </Text>
          </FormControl>
          <HStack justify="flex-end" mt={4}>
            <MotionButton
              bg="brand.primary"
              color="white"
              _hover={{ bg: 'brand.accent' }}
              onClick={handleSave}
              isLoading={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              px={6}
              py={3}
              borderRadius="lg"
              boxShadow="md"
              fontWeight="bold"
            >
              Save
            </MotionButton>
          </HStack>
        </Box>
      </VStack>
    </MotionBox>
  );
}