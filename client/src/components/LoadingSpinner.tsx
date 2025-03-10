import React from 'react';
import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  height?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'xl',
  height = '300px'
}) => {
  return (
    <Flex justify="center" align="center" h={height} w="100%">
      <VStack spacing={4}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="brand.500"
          size={size}
        />
        {message && <Text color="gray.500">{message}</Text>}
      </VStack>
    </Flex>
  );
};

export default LoadingSpinner;