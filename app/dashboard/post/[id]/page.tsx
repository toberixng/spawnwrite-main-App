// app/dashboard/post/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack, HStack, Spinner } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { supabase } from '../../../../lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import NextLink from 'next/link';

const MotionBox = motion(Box);
const MotionButton = motion(Box);

export default function PostView() {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    const fetchPost = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('title, content, created_at, published')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        toast.error('Error loading post');
      } else {
        setPost(data);
      }
      setLoading(false);
    };

    fetchPost();
  }, [id, router]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged out successfully!');
      router.push('/auth/login');
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.100" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="brand.accent" />
      </Box>
    );
  }

  if (!post) {
    return (
      <Box minH="100vh" bg="gray.100" display="flex" alignItems="center" justifyContent="center">
        <Text>Post not found</Text>
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
              <MotionButton as="a" bg="transparent" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                Dashboard
              </MotionButton>
            </NextLink>
            <NextLink href="/dashboard/editor" passHref legacyBehavior>
              <MotionButton as="a" bg="transparent" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                Editor
              </MotionButton>
            </NextLink>
            <MotionButton bg="transparent" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }} onClick={handleLogout}>
              Logout
            </MotionButton>
          </HStack>
        </HStack>
      </MotionBox>

      <VStack spacing={6} maxW="800px" mx="auto" py={10}>
        <Heading fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold">
          {post.title}
        </Heading>
        <Text fontSize="sm" color="gray.500">
          Created: {new Date(post.created_at).toLocaleDateString()} | {post.published ? 'Published' : 'Draft'}
        </Text>
        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" w="full">
          <Text whiteSpace="pre-wrap">{post.content}</Text>
        </Box>
        <NextLink href={`/dashboard/editor?id=${id}`} passHref legacyBehavior>
          <MotionButton
            as="a"
            bg="brand.primary"
            color="white"
            _hover={{ bg: 'brand.accent' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            px={6}
            py={3}
            borderRadius="lg"
            boxShadow="md"
            fontWeight="bold"
          >
            Edit Post
          </MotionButton>
        </NextLink>
      </VStack>
    </MotionBox>
  );
}