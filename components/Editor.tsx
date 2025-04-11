// components/Editor.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Input,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Text,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import 'quill/dist/quill.snow.css';
import Quill, { type Range } from 'quill';
import { FaBold, FaItalic, FaImage, FaVideo, FaVolumeUp } from 'react-icons/fa';

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
  const quillRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Quill | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadQuill = async () => {
      try {
        const Quill = (await import('quill')).default;

        // Define the type for EmbedBlot as a constructor function
        type EmbedBlotConstructor = new (...args: any[]) => any;

        // Get the Embed blot using Quill.import and assert its type
        const EmbedBlot = Quill.import('blots/embed') as EmbedBlotConstructor;

        // Define custom blots for video and audio
        class CustomVideo extends EmbedBlot {
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
        }
        Quill.register('blots/video', CustomVideo, true);

        class CustomAudio extends EmbedBlot {
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
        }
        Quill.register('blots/audio', CustomAudio, true);

        if (quillRef.current && !editorRef.current) {
          editorRef.current = new Quill(quillRef.current, {
            theme: 'snow',
            modules: {
              toolbar: {
                container: [
                  [{ header: [1, 2, false] }],
                  ['bold', 'italic'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  [{ align: [] }],
                  ['link', 'image', 'video', 'audio'],
                ],
                handlers: {
                  image: () => fileInputRef.current?.click(),
                  video: () => fileInputRef.current?.click(),
                  audio: () => fileInputRef.current?.click(),
                  link: handleLink,
                },
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

          // Handle text changes
          editorRef.current.on('text-change', () => {
            setTimeout(() => {
              const html = editorRef.current?.root.innerHTML || '';
              console.log('Captured content:', html);
              onContentChange(html);
            }, 0);
          });

          // Explicitly handle paste events to ensure content updates
          editorRef.current.root.addEventListener('paste', () => {
            setTimeout(() => {
              const html = editorRef.current?.root.innerHTML || '';
              console.log('Content after paste:', html);
              onContentChange(html);
            }, 0);
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
        setIsEditorLoaded(false);
      }
    };

    loadQuill();

    return () => {
      if (editorRef.current) {
        editorRef.current.off('text-change');
        editorRef.current.off('selection-change');
      }
    };
  }, [onContentChange, title]);

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
        const text = await response.text();
        console.error('Upload response:', text);
        throw new Error(`Upload failed with status ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log('Editor: Uploaded URL:', data.url);

      const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio';
      const range = editorRef.current.getSelection() || { index: editorRef.current.getLength() };
      editorRef.current.insertEmbed(range.index, type, data.url);
      const newContent = editorRef.current.root.innerHTML;
      console.log('Editor: New content after upload:', newContent);
      onContentChange(newContent);
    } catch (error: any) {
      console.error('Media upload failed:', error);
      alert(`Failed to upload file: ${error.message || 'Unknown error'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    onTitleChange(newTitle);
  };

  return (
    <Box w="full" p={4}>
      {/* Title */}
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

      {/* Tabs for Edit and Preview */}
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Edit</Tab>
          <Tab>Preview</Tab>
        </TabList>

        <TabPanels>
          {/* Edit Tab */}
          <TabPanel>
            <Box
              position="relative"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              p={4}
              minH="300px"
              color="#121C27"
              sx={{
                '& .ql-toolbar': {
                  background: 'white',
                  border: '1px solid',
                  borderColor: 'gray.200',
                  borderRadius: 'md',
                  padding: '8px',
                  zIndex: 10,
                },
                '& .ql-editor': { minHeight: '300px', color: '#121C27' },
                '& .ql-placeholder': { color: 'gray.500' },
                '& h1': { fontSize: '2xl', fontWeight: 'bold', mb: 2 },
                '& h2': { fontSize: 'xl', fontWeight: 'bold', mb: 2 },
                '& p': { mb: 2 },
                '& ul, & ol': { pl: 6, mb: 2 },
              }}
            >
              {!isEditorLoaded && <Text>Loading editor...</Text>}
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

          {/* Preview Tab */}
          <TabPanel>
            <Box
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              p={4}
              minH="300px"
              color="#121C27"
            >
              <Text fontSize="2xl" fontWeight="bold" mb={4}>
                {title || 'Untitled'}
              </Text>
              <Box dangerouslySetInnerHTML={{ __html: content }} />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}