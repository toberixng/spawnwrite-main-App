// app/layout.tsx
'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { Toaster } from 'sonner';
import theme from './theme'; // Import the consolidated theme

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ChakraProvider theme={theme}>
          {children}
          <Toaster position="top-right" richColors />
        </ChakraProvider>
      </body>
    </html>
  );
}