// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Box, Heading, VStack, Button, HStack, Text, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import NextLink from 'next/link';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

export default function Dashboard() {
  const [posts, setPosts] = useState<{ id: string; title: string; created_at: string; published: boolean; views: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
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
        .select('id, title, created_at, published, views')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error loading posts');
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [router]);

  const handleDelete = async () => {
    if (!postToDelete) return;

    setLoading(true);
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postToDelete);

    if (error) {
      toast.error(error.message);
    } else {
      setPosts(posts.filter((post) => post.id !== postToDelete));
      toast.success('Post deleted successfully!');
    }
    setLoading(false);
    onClose();
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

  if (loading) {
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
        <HStack justify="space-between" maxW="1200px" mx="auto">
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
            <NextLink href="/dashboard/settings" passHref legacyBehavior>
              <MotionButton as="a" bg="transparent" color="white" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                Settings
              </MotionButton>
            </NextLink>
            <MotionButton bg="transparent" color="white" _hover={{ color: 'brand.accent' }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }} onClick={handleLogout}>
              Logout
            </MotionButton>
          </HStack>
        </HStack>
      </MotionBox>

      <VStack spacing={6} maxW="1200px" mx="auto" py={10}>
        <HStack w="full" justify="space-between">
          <Heading fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold">
            Your Posts
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
              Create Post
            </MotionButton>
          </NextLink>
        </HStack>
        {posts.length === 0 ? (
          <Text fontSize="lg" color="gray.500">
            No posts yet. Start by creating one!
          </Text>
        ) : (
          <VStack w="full" spacing={4}>
            {posts.map((post) => (
              <MotionBox
                key={post.id}
                bg="white"
                p={4}
                borderRadius="lg"
                boxShadow="sm"
                w="full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <NextLink href={`/dashboard/post/${post.id}`} passHref legacyBehavior>
                      <Text as="a" fontSize="lg" fontWeight="bold" color="brand.primary" _hover={{ color: 'brand.accent' }}>
                        {post.title}
                      </Text>
                    </NextLink>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(post.created_at).toLocaleDateString()} | {post.published ? 'Published' : 'Draft'} | Views: {post.views}
                    </Text>
                  </VStack>
                  <HStack spacing={2}>
                    <NextLink href={`/dashboard/editor?id=${post.id}`} passHref legacyBehavior>
                      <MotionButton
                        as="a"
                        size="sm"
                        variant="outline"
                        borderColor="brand.primary"
                        color="brand.primary"
                        _hover={{ bg: 'brand.primary', color: 'white' }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        Edit
                      </MotionButton>
                    </NextLink>
                    <MotionButton
                      size="sm"
                      variant="outline"
                      borderColor="red.500"
                      color="red.500"
                      _hover={{ bg: 'red.500', color: 'white' }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        setPostToDelete(post.id);
                        onOpen();
                      }}
                    >
                      Delete
                    </MotionButton>
                  </HStack>
                </HStack>
              </MotionBox>
            ))}
          </VStack>
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete this post? This action cannot be undone.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDelete} isLoading={loading}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MotionBox>
  );
}