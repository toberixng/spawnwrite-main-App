// components/Editor.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Input, HStack, Button, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { supabase } from '../lib/supabase'; // Adjust path
import 'quill/dist/quill.snow.css';

interface EditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  isLoading: boolean;
  postId?: string;
}

export default function Editor({
  title,
  content,
  onTitleChange,
  onContentChange,
  isLoading,
  postId,
}: EditorProps) {
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);
  const [domPurify, setDomPurify] = useState<any>(null);
  const quillRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load DOMPurify client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('dompurify').then((module) => {
        setDomPurify(() => module.default);
      }).catch((err) => {
        console.error('Failed to load DOMPurify:', err);
      });
    }
  }, []);

  // Initialize Quill and sync content
  useEffect(() => {
    const loadQuill = async () => {
      try {
        const Quill = (await import('quill')).default;
        if (quillRef.current && !editorRef.current) {
          editorRef.current = new Quill(quillRef.current, {
            theme: 'snow',
            modules: {
              toolbar: {
                container: [
                  ['bold', 'italic', 'code'],
                  [{ header: 1 }, { header: 2 }],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['link', 'image'],
                  ['undo', 'redo'],
                ],
                handlers: {
                  image: handleImageUpload,
                  undo: handleUndo,
                  redo: handleRedo,
                  link: handleLink,
                },
              },
              history: {
                delay: 1000,
                maxStack: 100,
              },
            },
            placeholder: 'Start writing here...',
          });

          // Set initial content and notify parent
          if (content) {
            editorRef.current.clipboard.dangerouslyPasteHTML(content);
          } else {
            const initialHtml = editorRef.current.root.innerHTML;
            console.log('Editor: Initial content set:', initialHtml); // Debug
            onContentChange(initialHtml); // Ensure parent gets empty content
          }

          editorRef.current.on('text-change', () => {
            const html = editorRef.current?.root.innerHTML || '';
            console.log('Editor: Quill text-change:', html); // Debug
            onContentChange(html);
            if (title.trim() && html.trim()) {
              debounceSave({ title, content: html });
            }
          });

          setIsEditorLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load Quill editor:', error);
      }
    };

    loadQuill();

    return () => {
      if (editorRef.current) {
        editorRef.current.off('text-change');
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onContentChange, title]); // title as dep to re-save on title change

  const debounceSave = (data: { title: string; content: string }) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(async () => {
      try {
        const updates = {
          title: data.title,
          content: data.content,
          updated_at: new Date().toISOString(),
        };
        const { error, data: postData } = postId
          ? await supabase.from('posts').update(updates).eq('id', postId).select().single()
          : await supabase.from('posts').upsert({ ...updates, created_at: new Date().toISOString() }).select().single();
        if (error) throw error;
        if (!postId && postData?.id) {
          window.history.replaceState(null, '', `/dashboard/editor?id=${postData.id}`);
        }
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }, 2000);
  };

  const handleUndo = () => editorRef.current?.history.undo();
  const handleRedo = () => editorRef.current?.history.redo();
  const handleLink = () => {
    const url = prompt('Enter URL');
    if (url) editorRef.current?.format('link', url);
  };

  const handleImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorRef.current) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');

      const range = editorRef.current.getSelection() || { index: editorRef.current.getLength() };
      editorRef.current.insertEmbed(range.index, 'image', urlData.publicUrl);
      const newContent = editorRef.current.root.innerHTML;
      console.log('Editor: Image uploaded, new content:', newContent); // Debug
      onContentChange(newContent);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image');
    } finally {
      e.target.value = '';
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    console.log('Editor: Title changed:', newTitle); // Debug
    onTitleChange(newTitle);
    const currentContent = editorRef.current?.root.innerHTML || content;
    if (newTitle.trim() && currentContent.trim()) {
      debounceSave({ title: newTitle, content: currentContent });
    }
  };

  return (
    <Box w="full">
      <Input
        value={title}
        onChange={handleTitleChange}
        placeholder="Enter post title"
        fontSize="2xl"
        fontWeight="bold"
        border="none"
        p={2}
        mb={4}
        _focus={{ outline: 'none', boxShadow: 'none' }}
        isDisabled={isLoading}
      />
      <Tabs variant="soft-rounded" colorScheme="blue">
        <TabList mb={4}>
          <Tab>Edit</Tab>
          <Tab>Preview</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <Box mb={4}>
              <HStack spacing={2} mb={2}>
                <Button size="sm" onClick={() => editorRef.current?.format('bold', true)} isDisabled={isLoading || !isEditorLoaded}>B</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('italic', true)} isDisabled={isLoading || !isEditorLoaded}>I</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('header', 1)} isDisabled={isLoading || !isEditorLoaded}>H1</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('header', 2)} isDisabled={isLoading || !isEditorLoaded}>H2</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('list', 'bullet')} isDisabled={isLoading || !isEditorLoaded}>• List</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('list', 'ordered')} isDisabled={isLoading || !isEditorLoaded}>1. List</Button>
                <Button size="sm" onClick={handleLink} isDisabled={isLoading || !isEditorLoaded}>Link</Button>
                <Button size="sm" onClick={handleImageUpload} isDisabled={isLoading || !isEditorLoaded}>Image</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('code', true)} isDisabled={isLoading || !isEditorLoaded}>Code</Button>
                <Button size="sm" onClick={handleUndo} isDisabled={isLoading || !isEditorLoaded}>Undo</Button>
                <Button size="sm" onClick={handleRedo} isDisabled={isLoading || !isEditorLoaded}>Redo</Button>
              </HStack>
            </Box>
            <Box
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              p={4}
              bg="white"
              minH="200px"
              sx={{
                '& .ql-editor': { minHeight: '200px', outline: 'none' },
                '& h1': { fontSize: '2xl', fontWeight: 'bold', mb: 2 },
                '& h2': { fontSize: 'xl', fontWeight: 'bold', mb: 2 },
                '& p': { mb: 2 },
                '& ul, & ol': { pl: 6, mb: 2 },
                '& blockquote': { borderLeft: '4px solid', borderColor: 'gray.300', pl: 4, color: 'gray.600', mb: 2 },
                '& code': { bg: 'gray.100', p: 2, borderRadius: 'md', display: 'block', overflowX: 'auto', mb: 2 },
              }}
            >
              {!isEditorLoaded && <p>Loading editor...</p>}
              <div ref={quillRef} />
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </Box>
          </TabPanel>
          <TabPanel p={0}>
            {domPurify ? (
              <Box
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                p={4}
                bg="white"
                minH="200px"
                sx={{
                  '& h1': { fontSize: '2xl', fontWeight: 'bold', mb: 2 },
                  '& h2': { fontSize: 'xl', fontWeight: 'bold', mb: 2 },
                  '& p': { mb: 2 },
                  '& ul, & ol': { pl: 6, mb: 2 },
                  '& blockquote': { borderLeft: '4px solid', borderColor: 'gray.300', pl: 4, color: 'gray.600', mb: 2 },
                  '& code': { bg: 'gray.100', p: 2, borderRadius: 'md', display: 'block', overflowX: 'auto', mb: 2 },
                }}
                dangerouslySetInnerHTML={{ __html: domPurify.sanitize(content || '<p>No content yet</p>') }}
              />
            ) : (
              <Box p={4}>Loading preview...</Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}