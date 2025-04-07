// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box, Heading, Text, VStack, Flex, LinkBox, LinkOverlay, HStack, Spinner, IconButton,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent,
  AlertDialogOverlay, Button as ChakraButton
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { toast } from 'sonner';
import { DeleteIcon } from '@chakra-ui/icons';
import { useRef } from 'react';
import { FocusableElement } from '@chakra-ui/utils';

const MotionBox = motion(Box);
const MotionButton = motion(Box);

export default function Dashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('id, title, created_at, published')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load posts');
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [router]);

  const handleDelete = async (postId: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast.error(error.message);
    } else {
      setPosts(posts.filter((post) => post.id !== postId));
      toast.success('Post deleted!');
    }
    setIsDeleteOpen(false);
    setPostToDelete(null);
  };

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
      <Box minH="100vh" bg="gray.100" color="brand.primary" display="flex" alignItems="center" justifyContent="center">
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

      <VStack spacing={8} align="start" maxW="800px" mx="auto" py={10}>
        <Heading fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold">
          Welcome to SpawnWrite
        </Heading>
        <NextLink href="/dashboard/editor" passHref legacyBehavior>
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
            Create New Post
          </MotionButton>
        </NextLink>
        {posts.length === 0 ? (
          <Text fontSize="lg" color="gray.600">
            No posts yet—get started by creating your first one!
          </Text>
        ) : (
          <VStack spacing={4} w="full">
            {posts.map((post) => (
              <LinkBox
                key={post.id}
                as={Flex}
                bg="white"
                color="brand.primary"
                p={4}
                borderRadius="lg"
                w="full"
                justify="space-between"
                boxShadow="sm"
                _hover={{ bg: 'gray.50', boxShadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s ease"
                align="center"
              >
                <LinkOverlay as={NextLink} href={`/dashboard/post/${post.id}`}>
                  <Text fontWeight="bold" fontSize="lg">{post.title}</Text>
                </LinkOverlay>
                <HStack spacing={4}>
                  <Text fontSize="sm" color="gray.500">
                    {new Date(post.created_at).toLocaleDateString()} {post.published ? '(Published)' : '(Draft)'}
                  </Text>
                  <IconButton
                    aria-label="Delete post"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => {
                      setPostToDelete(post.id);
                      setIsDeleteOpen(true);
                    }}
                  />
                </HStack>
              </LinkBox>
            ))}
          </VStack>
        )}
      </VStack>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef as React.RefObject<FocusableElement>}
        onClose={() => setIsDeleteOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Post
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <ChakraButton ref={cancelRef} onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </ChakraButton>
              <ChakraButton
                colorScheme="red"
                onClick={() => postToDelete && handleDelete(postToDelete)}
                ml={3}
              >
                Delete
              </ChakraButton>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </MotionBox>
  );
}