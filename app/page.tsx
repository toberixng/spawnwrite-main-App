// app/page.tsx
import { Button, Heading } from '@chakra-ui/react';

export default function Home() {
  return (
    <main>
      <Heading color="brand.primary">Hello, SpawnWrite!</Heading>
      <Button colorScheme="brand.accent" bg="brand.accent" _hover={{ bg: '#a0a900' }}>
        Click Me
      </Button>
    </main>
  );
}