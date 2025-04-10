// components/Editor.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Input, HStack, Button, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import 'quill/dist/quill.snow.css';
import Quill, { type Range } from 'quill';

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
  const editorRef = useRef<Quill | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('dompurify').then((module) => {
        setDomPurify(() => module.default);
      }).catch((err) => {
        console.error('Failed to load DOMPurify:', err);
      });
    }
  }, []);

  useEffect(() => {
    const loadQuill = async () => {
      try {
        const Quill = (await import('quill')).default;
        const Parchment = Quill.import('parchment');
        const Embed = Quill.import('blots/embed') as typeof import('quill').Parchment.Embed;

        class CustomVideo extends Embed {
          static create(value: string) {
            const node = super.create(value);
            node.setAttribute('src', value);
            node.setAttribute('controls', '');
            return node;
          }

          static value(node: HTMLElement) {
            return node.getAttribute('src');
          }

          static blotName = 'video';
          static tagName = 'video';
          static scope = Parchment.Scope.BLOCK;
        }
        Quill.register('blots/video', CustomVideo, true);

        class CustomAudio extends Embed {
          static create(value: string) {
            const node = super.create(value);
            node.setAttribute('src', value);
            node.setAttribute('controls', '');
            return node;
          }

          static value(node: HTMLElement) {
            return node.getAttribute('src');
          }

          static blotName = 'audio';
          static tagName = 'audio';
          static scope = Parchment.Scope.BLOCK;
        }
        Quill.register('blots/audio', CustomAudio, true);

        if (quillRef.current && !editorRef.current) {
          editorRef.current = new Quill(quillRef.current, {
            theme: 'snow',
            modules: {
              toolbar: {
                container: [
                  ['bold', 'italic', 'code'],
                  [{ header: 1 }, { header: 2 }],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
                  ['link', 'image', 'video', 'audio'],
                  ['undo', 'redo'],
                ],
                handlers: {
                  image: () => fileInputRef.current?.click(),
                  video: () => fileInputRef.current?.click(),
                  audio: () => fileInputRef.current?.click(),
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

          if (content) {
            editorRef.current.clipboard.dangerouslyPasteHTML(content);
          } else {
            const initialHtml = editorRef.current.root.innerHTML;
            onContentChange(initialHtml);
          }

          editorRef.current.on('text-change', () => {
            const html = editorRef.current?.root.innerHTML || '';
            onContentChange(html);
            if (title.trim() && html.trim()) {
              debounceSave({ title, content: html });
            }
          });

          editorRef.current.on('selection-change', (range: Range | null) => {
            if (range) {
              const formats = editorRef.current?.getFormat(range);
              console.log('Active formats:', formats);
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
        editorRef.current.off('selection-change');
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onContentChange, title]);

  const debounceSave = (data: { title: string; content: string }) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const updates = {
          title: data.title,
          content: data.content,
          user_id: user.id,
          updated_at: new Date().toISOString(),
          ...(postId ? {} : { created_at: new Date().toISOString() }),
        };
        const { error, data: postData } = await supabase
          .from('posts')
          .upsert(updates)
          .select()
          .single();
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorRef.current) return;

    try {
      console.log('Editor: Uploading file:', { name: file.name, size: file.size });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Upload failed');
      }

      const { url } = await response.json();
      console.log('Editor: Uploaded URL:', url);

      const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio';
      const range = editorRef.current.getSelection() || { index: editorRef.current.getLength() };
      editorRef.current.insertEmbed(range.index, type, url);
      const newContent = editorRef.current.root.innerHTML;
      console.log('Editor: New content:', newContent);
      onContentChange(newContent);
    } catch (error: any) {
      console.error('Image upload failed:', error);
      alert(`Failed to upload file: ${error.message || 'Unknown error'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
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
        color="#121C27"
      />
      <Tabs variant="soft-rounded" colorScheme="yellow">
        <TabList mb={4}>
          <Tab color="#121C27">Edit</Tab>
          <Tab color="#121C27">Preview</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <Box mb={4}>
              <HStack spacing={2} mb={2}>
                <Button size="sm" onClick={() => editorRef.current?.format('bold', true)} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>B</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('italic', true)} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>I</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('code', true)} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>Code</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('header', 1)} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>H1</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('header', 2)} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>H2</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('list', 'bullet')} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>• List</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('list', 'ordered')} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>1. List</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('align', '')} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>Left</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('align', 'center')} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>Center</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('align', 'right')} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>Right</Button>
                <Button size="sm" onClick={() => editorRef.current?.format('align', 'justify')} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>Justify</Button>
                <Button size="sm" onClick={handleLink} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>Link</Button>
                <Button size="sm" onClick={() => fileInputRef.current?.click()} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>Image</Button>
                <Button size="sm" onClick={() => fileInputRef.current?.click()} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>Video</Button>
                <Button size="sm" onClick={() => fileInputRef.current?.click()} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>Audio</Button>
                <Button size="sm" onClick={handleUndo} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>Undo</Button>
                <Button size="sm" onClick={handleRedo} isDisabled={isLoading || !isEditorLoaded} bg="#121C27" color="#b8c103" _hover={{ bg: '#b8c103', color: '#121C27' }}>Redo</Button>
              </HStack>
            </Box>
            <Box
              border="1px solid"
              borderColor="#121C27"
              borderRadius="md"
              p={4}
              bg="white"
              minH="200px"
              color="#121C27"
              sx={{
                '& .ql-editor': { minHeight: '200px', color: '#121C27' },
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
                accept="image/*,video/mp4,audio/mpeg"
                onChange={handleFileChange}
              />
            </Box>
          </TabPanel>
          <TabPanel p={0}>
            {domPurify ? (
              <Box
                border="1px solid"
                borderColor="#121C27"
                borderRadius="md"
                p={4}
                bg="white"
                minH="200px"
                color="#121C27"
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
              <Box p={4} color="#121C27">Loading preview...</Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}