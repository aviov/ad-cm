import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  return (
    <Flex h="100vh" flexDirection="column">
      <Navbar />
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <Box 
          flex="1" 
          p={4} 
          overflowY="auto"
          bg="gray.50"
        >
          <Box 
            bg="white" 
            borderRadius="md" 
            p={6} 
            shadow="sm" 
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