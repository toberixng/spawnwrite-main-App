// app/dashboard/post/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Heading, VStack, Button, HStack, Spinner } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { supabase } from '../../../../lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import NextLink from 'next/link';
import DOMPurify from 'dompurify';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

export default function PostPage() {
  const [post, setPost] = useState<{ title: string; content: string; published: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useParams(); // Get dynamic route param

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('title, content, published')
        .eq('id', id)
        .single();

      if (error) {
        toast.error('Error loading post');
        router.push('/dashboard');
      } else {
        setPost(data);
      }
      setLoading(false);
    };
    if (id) fetchPost();
  }, [id, router]);

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

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.100" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="brand.accent" />
      </Box>
    );
  }

  if (!post) return null;

  const sanitizedContent = DOMPurify.sanitize(post.content);

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
              <MotionButton as="a" bg="transparent" color="white" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }}>
                Dashboard
              </MotionButton>
            </NextLink>
            <NextLink href="/dashboard/editor" passHref legacyBehavior>
              <MotionButton as="a" bg="transparent" color="white" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }}>
                Editor
              </MotionButton>
            </NextLink>
            <NextLink href={`/dashboard/editor?id=${id}`} passHref legacyBehavior>
              <MotionButton as="a" bg="transparent" color="white" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }}>
                Edit Post
              </MotionButton>
            </NextLink>
            <NextLink href="/dashboard/settings" passHref legacyBehavior>
              <MotionButton as="a" bg="transparent" color="white" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }}>
                Settings
              </MotionButton>
            </NextLink>
            <MotionButton bg="transparent" color="white" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }} onClick={handleLogout}>
              Logout
            </MotionButton>
          </HStack>
        </HStack>
      </MotionBox>

      <VStack spacing={6} maxW="800px" mx="auto" py={10}>
        <Heading fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold">
          {post.title}
        </Heading>
        <Box
          w="full"
          p={4}
          bg="white"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
          sx={{
            '& h1': { fontSize: '2xl', fontWeight: 'bold', mb: 2 },
            '& h2': { fontSize: 'xl', fontWeight: 'bold', mb: 2 },
            '& p': { mb: 2 },
            '& ul, & ol': { pl: 6, mb: 2 },
            '& blockquote': { borderLeft: '4px solid', borderColor: 'gray.300', pl: 4, color: 'gray.600', mb: 2 },
            '& code': { bg: 'gray.100', p: 2, borderRadius: 'md', display: 'block', overflowX: 'auto', mb: 2 },
          }}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </VStack>
    </MotionBox>
  );
}