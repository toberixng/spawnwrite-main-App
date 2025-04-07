// app/layout.tsx
'use client';

import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { Toaster } from 'sonner';

const theme = extendTheme({
  initialColorMode: 'light',
  useSystemColorMode: false,
  colors: {
    brand: {
      primary: '#121C27',
      accent: '#b8c103',
      light: '#CEEAF7',
      neutral: '#FAFAFA',
    },
  },
});

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