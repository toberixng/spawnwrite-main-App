// components/Editor.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Input, VStack } from '@chakra-ui/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $getRoot, EditorState } from 'lexical';
import ToolbarPlugin from './ToolbarPlugin';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface EditorProps {
  initialTitle: string;
  initialContent: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  isLoading?: boolean;
}

function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <CustomErrorBoundary onError={(error) => console.error(error)}>
      {children as React.ReactElement}
    </CustomErrorBoundary>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactElement;
  onError?: (error: Error) => void;
}

class CustomErrorBoundary extends Component<ErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lexical Error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return <Box color="red.500">Something went wrong in the editor.</Box>;
    }
    return this.props.children;
  }
}

const lexicalConfig = {
  namespace: 'SpawnWriteEditor',
  onError: (error: Error) => console.error(error),
  theme: {
    paragraph: 'editor-paragraph',
    text: {
      bold: 'editor-bold',
      italic: 'editor-italic',
    },
  },
};

export default function Editor({ initialTitle, initialContent, onTitleChange, onContentChange, isLoading }: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

  const handleContentChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const newContent = root.getTextContent();
      setContent(newContent);
      onContentChange(newContent);
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onTitleChange(newTitle);
  };

  return (
    <VStack spacing={4} w="full">
      <Input
        placeholder="Post Title"
        value={title}
        onChange={handleTitleChange}
        bg="white"
        borderColor="gray.300"
        _focus={{ borderColor: 'brand.accent', boxShadow: '0 0 0 1px #b8c103' }}
        color="brand.primary"
        fontSize="lg"
        p={6}
        borderRadius="lg"
        boxShadow="sm"
        isDisabled={isLoading}
      />
      <Box w="full" bg="white" borderRadius="lg" p={4} boxShadow="sm" minH="400px">
        <LexicalComposer initialConfig={lexicalConfig}>
          <ToolbarPlugin />
          <RichTextPlugin
            contentEditable={<ContentEditable style={{ minHeight: '350px', padding: '8px', outline: 'none' }} />}
            placeholder={<Box color="gray.500" p={2}>Write your post here...</Box>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleContentChange} />
        </LexicalComposer>
      </Box>
    </VStack>
  );
}