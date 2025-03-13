import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
// Sidebar is no longer needed as navigation is in the navbar

const Layout: React.FC = () => {
  // Use color mode values for dynamic styling
  const bgColor = useColorModeValue('gray.50', '#121212');
  const contentBg = useColorModeValue('white', 'gray.800');
  
  return (
    <Flex h="100vh" flexDirection="column">
      <Navbar />
      <Box 
        flex="1" 
        p={4} 
        overflowY="auto"
        bg={bgColor}
      >
        <Box 
          bg={contentBg}
          borderRadius="md" 
          p={6}
          minH="calc(100vh - 110px)"
          maxW="container.xl"
          mx="auto"
        >
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
};

export default Layout;