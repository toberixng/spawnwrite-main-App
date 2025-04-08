// components/ToolbarPlugin.tsx
'use client';

import { useCallback } from 'react';
import { Box, Button, HStack } from '@chakra-ui/react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND } from 'lexical';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { $getSelection, $isRangeSelection } from 'lexical';
import { mergeRegister } from '@lexical/utils';

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const formatText = (type: 'bold' | 'italic') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  };

  const formatHeading = useCallback((level: 'h1' | 'h2') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          if ($isHeadingNode(node)) {
            node.setTag(level);
          } else {
            const headingNode = $createHeadingNode(level);
            node.replace(headingNode);
            headingNode.select();
          }
        });
      }
    });
  }, [editor]);

  return (
    <Box bg="#121C27" p={2} borderRadius="md" mb={2}>
      <HStack spacing={2}>
        <Button
          size="sm"
          bg="transparent"
          color="white"
          _hover={{ bg: '#b8c103', color: '#121C27' }}
          onClick={() => formatText('bold')}
        >
          Bold
        </Button>
        <Button
          size="sm"
          bg="transparent"
          color="white"
          _hover={{ bg: '#b8c103', color: '#121C27' }}
          onClick={() => formatText('italic')}
        >
          Italic
        </Button>
        <Button
          size="sm"
          bg="transparent"
          color="white"
          _hover={{ bg: '#b8c103', color: '#121C27' }}
          onClick={() => formatHeading('h1')}
        >
          H1
        </Button>
        <Button
          size="sm"
          bg="transparent"
          color="white"
          _hover={{ bg: '#b8c103', color: '#121C27' }}
          onClick={() => formatHeading('h2')}
        >
          H2
        </Button>
      </HStack>
    </Box>
  );
}