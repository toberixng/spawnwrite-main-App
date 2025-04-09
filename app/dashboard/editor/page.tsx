// app/dashboard/editor/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Heading, VStack, Button, HStack, Switch, FormControl, FormLabel, Spinner } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase'; // Adjust path
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import NextLink from 'next/link';
import Editor from '../../../components/Editor'; // Adjust path

const MotionBox = motion(Box);
const MotionButton = motion(Button);

export default function EditorPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string>(''); // Start empty
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');

  // Load draft or post only once on mount
  useEffect(() => {
    console.log('EditorPage: Mounted, postId:', postId); // Debug
    if (!postId) {
      const draftKey = 'spawnwrite-draft-new';
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const { title: savedTitle, content: savedContent } = JSON.parse(savedDraft);
        console.log('EditorPage: Loading draft:', { savedTitle, savedContent }); // Debug
        setTitle(savedTitle || '');
        setContent(savedContent || '');
        toast.info('Loaded unsaved draft from your last session.');
      }
    } else {
      const fetchPost = async () => {
        setFetching(true);
        const { data, error } = await supabase
          .from('posts')
          .select('title, content, published')
          .eq('id', postId)
          .single();

        if (error) {
          toast.error('Error loading post');
          console.log('EditorPage: Fetch error:', error); // Debug
        } else {
          console.log('EditorPage: Post loaded:', data); // Debug
          setTitle(data.title || '');
          setContent(data.content || '');
          setPublished(data.published);
        }
        setFetching(false);
      };
      fetchPost();
    }
  }, [postId]); // Only runs when postId changes

  const handleTitleChange = (newTitle: string) => {
    console.log('EditorPage: Title changed:', newTitle); // Debug
    setTitle(newTitle);
    if (!postId) {
      const draftKey = 'spawnwrite-draft-new';
      localStorage.setItem(draftKey, JSON.stringify({ title: newTitle, content }));
    }
  };

  const handleContentChange = (newContent: string) => {
    console.log('EditorPage: Content changed:', newContent); // Debug
    setContent(newContent);
    if (!postId) {
      const draftKey = 'spawnwrite-draft-new';
      localStorage.setItem(draftKey, JSON.stringify({ title, content: newContent }));
    }
  };

  const handleClearDraft = () => {
    if (!postId) {
      localStorage.removeItem('spawnwrite-draft-new');
      setTitle('');
      setContent('');
      toast.success('Draft cleared.');
    }
  };

  const handleSave = async () => {
    console.log('EditorPage: Saving:', { title, content, published }); // Debug
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content cannot be empty');
      console.log('EditorPage: Validation failed, current state:', { title, content }); // Debug
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (postId) {
      const { error } = await supabase
        .from('posts')
        .update({ title, content, published, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        toast.error(error.message);
        console.log('EditorPage: Update error:', error); // Debug
      } else {
        toast.success('Post updated!');
        router.push('/dashboard');
      }
    } else {
      const { error } = await supabase
        .from('posts')
        .insert({ title, content, user_id: user.id, published });

      if (error) {
        toast.error(error.message);
        console.log('EditorPage: Insert error:', error); // Debug
      } else {
        localStorage.removeItem('spawnwrite-draft-new');
        toast.success('Post saved!');
        router.push('/dashboard');
      }
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

  if (fetching && postId) {
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

      <VStack spacing={6} maxW="800px" mx="auto" py={10}>
        <Heading fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold">
          {postId ? 'Edit Post' : 'New Post'}
        </Heading>
        <Editor
          title={title}
          content={content}
          onTitleChange={handleTitleChange}
          onContentChange={handleContentChange}
          isLoading={loading}
          postId={postId || undefined}
        />
        <HStack w="full" justify="space-between">
          <FormControl display="flex" alignItems="center" w="auto">
            <FormLabel htmlFor="publish-toggle" mb="0" fontWeight="bold">
              Publish
            </FormLabel>
            <Switch
              id="publish-toggle"
              isChecked={published}
              onChange={(e) => setPublished(e.target.checked)}
              colorScheme="yellow"
            />
          </FormControl>
          <HStack spacing={4}>
            {!postId && (
              <MotionButton
                bg="gray.500"
                color="white"
                _hover={{ bg: 'gray.600' }}
                onClick={handleClearDraft}
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
                Clear Draft
              </MotionButton>
            )}
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
              Save Post
            </MotionButton>
          </HStack>
        </HStack>
      </VStack>
    </MotionBox>
  );
}