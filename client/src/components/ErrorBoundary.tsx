import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Heading, Text, Button, VStack, Code, Alert, AlertIcon } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = (): void => {
    // Reset the error boundary state and try again
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box p={8} maxW="xl" mx="auto" textAlign="center">
          <Alert status="error" mb={6}>
            <AlertIcon />
            Something went wrong. Please try again.
          </Alert>
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading as="h2" size="lg" mb={2}>
                Application Error
              </Heading>
              <Text>An unexpected error occurred in the application.</Text>
            </Box>
            
            {this.state.error && (
              <Box borderWidth={1} p={4} borderRadius="md" bg="gray.50">
                <Heading as="h3" size="md" mb={2}>
                  Error Message:
                </Heading>
                <Code colorScheme="red" p={2} borderRadius="md" whiteSpace="pre-wrap">
                  {this.state.error.toString()}
                </Code>
              </Box>
            )}
            
            <Button colorScheme="brand" onClick={this.handleRetry}>
              Try Again
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;