import React from 'react';
import { Heading, Text, Button, Flex } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      h="70vh"
      textAlign="center"
    >
      <Heading size="xl" mb={4}>
        404 - Page Not Found
      </Heading>
      <Text fontSize="lg" mb={8}>
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <Button
        colorScheme="brand"
        onClick={() => navigate('/')}
      >
        Return to Dashboard
      </Button>
    </Flex>
  );
};

export default NotFound;