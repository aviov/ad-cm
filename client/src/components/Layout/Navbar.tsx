import React from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  IconButton, 
  useColorMode, 
  useColorModeValue, 
  Spacer,
  HStack,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

const Navbar: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box 
      as="nav" 
      bg={bgColor} 
      px={4} 
      py={3} 
      borderBottom="1px" 
      borderColor={borderColor}
      shadow="sm"
      width="full"
    >
      <Flex align="center" maxW="container.xl" mx="auto">
        <Heading 
          as="h1" 
          size="md" 
          color="brand.500"
          fontWeight="bold"
        >
          Campaign Management
        </Heading>
        
        <Spacer />
        
        <HStack spacing={3}>
          <IconButton
            aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
            variant="ghost"
            onClick={toggleColorMode}
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          />
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;