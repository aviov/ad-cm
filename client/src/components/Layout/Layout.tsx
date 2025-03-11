import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  // Use color mode values for dynamic styling
  const bgColor = useColorModeValue('gray.50', '#121212');
  const contentBg = useColorModeValue('white', 'gray.800');
  
  return (
    <Flex h="100vh" flexDirection="column">
      <Navbar />
      <Flex flex="1" overflow="hidden">
        <Sidebar />
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
          >
            <Outlet />
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout;