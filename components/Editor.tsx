// components/Editor.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Input, HStack, Button } from '@chakra-ui/react';
import { supabase } from '../lib/supabase'; // Adjust path to your Supabase client
import 'quill/dist/quill.snow.css';

interface EditorProps {
  initialTitle: string;
  initialContent: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  isLoading: boolean;
  postId?: string; // Optional ID for editing existing posts
}

export default function Editor({
  initialTitle,
  initialContent,
  onTitleChange,
  onContentChange,
  isLoading,
  postId,
}: EditorProps) {
  const [title, setTitle] = useState('');
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);
  const quillRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    const loadQuill = async () => {
      try {
        const Quill = (await import('quill')).default;
        if (quillRef.current && !editorRef.current) {
          editorRef.current = new Quill(quillRef.current, {
            theme: 'snow',
            modules: {
              toolbar: [
                ['bold', 'italic', 'code'],
                [{ header: 1 }, { header: 2 }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link'],
                ['undo', 'redo'],
              ],
              history: {
                delay: 1000,
                maxStack: 100,
              },
            },
            placeholder: 'Start writing here...',
          });

          if (initialContent) {
            editorRef.current.clipboard.dangerouslyPasteHTML(initialContent);
          }

          editorRef.current.on('text-change', () => {
            const html = editorRef.current?.root.innerHTML || '';
            onContentChange(html);
            debounceSave({ title, content: html });
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
  }, [onContentChange, initialContent, title]);

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
        const { error } = postId
          ? await supabase.from('posts').update(updates).eq('id', postId)
          : await supabase.from('posts').upsert({ ...updates, created_at: new Date().toISOString() });
        if (error) throw error;
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }, 2000); // 2-second delay
  };

  const handleUndo = () => editorRef.current?.history.undo();
  const handleRedo = () => editorRef.current?.history.redo();
  const handleLink = () => {
    const url = prompt('Enter URL');
    if (url) editorRef.current?.format('link', url);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onTitleChange(newTitle);
    debounceSave({ title: newTitle, content: editorRef.current?.root.innerHTML || '' });
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
      <Box mb={4}>
        <HStack spacing={2} mb={2}>
          <Button size="sm" onClick={() => editorRef.current?.format('bold', true)} isDisabled={isLoading || !isEditorLoaded}>B</Button>
          <Button size="sm" onClick={() => editorRef.current?.format('italic', true)} isDisabled={isLoading || !isEditorLoaded}>I</Button>
          <Button size="sm" onClick={() => editorRef.current?.format('header', 1)} isDisabled={isLoading || !isEditorLoaded}>H1</Button>
          <Button size="sm" onClick={() => editorRef.current?.format('header', 2)} isDisabled={isLoading || !isEditorLoaded}>H2</Button>
          <Button size="sm" onClick={() => editorRef.current?.format('list', 'bullet')} isDisabled={isLoading || !isEditorLoaded}>• List</Button>
          <Button size="sm" onClick={() => editorRef.current?.format('list', 'ordered')} isDisabled={isLoading || !isEditorLoaded}>1. List</Button>
          <Button size="sm" onClick={handleLink} isDisabled={isLoading || !isEditorLoaded}>Link</Button>
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
      </Box>
    </Box>
  );
}