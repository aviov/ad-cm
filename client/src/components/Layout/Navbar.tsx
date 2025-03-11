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
  const bgColor = useColorModeValue('white', 'gray.900');
  const headingColor = useColorModeValue('brand.500', 'cyan.500');
  
  return (
    <Box 
      as="nav" 
      bg={bgColor} 
      px={4} 
      py={3} 
      width="full"
    >
      <Flex align="center" maxW="container.xl" mx="auto">
        <Heading 
          as="h1" 
          size="md" 
          color={headingColor}
          fontWeight="bold"
        >
          Ad Campaigns
        </Heading>
        
        <Spacer />
        
        <HStack spacing={3}>
          <IconButton
            aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
            variant="ghost"
            onClick={toggleColorMode}
            color={colorMode === 'light' ? "brand.500" : "white"}
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            _hover={{
              bg: colorMode === 'light' ? 'gray.100' : 'gray.700'
            }}
          />
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;