// src/pages/Campaigns/CampaignDetail.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Flex,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { ExternalLinkIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { campaignApi } from '../../services/api';
import { formatDistance } from 'date-fns';

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch campaign details
  const { data: campaign, isLoading, isError } = useQuery(
    ['campaign', id],
    () => campaignApi.getById(Number(id)),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Delete campaign mutation
  const deleteMutation = useMutation(() => campaignApi.delete(Number(id)), {
    onSuccess: () => {
      queryClient.invalidateQueries('campaigns');
      toast({
        title: 'Campaign deleted',
        description: 'Campaign has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/campaigns');
    },
    onError: (error: string) => {
      toast({
        title: 'Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Toggle campaign status mutation
  const toggleMutation = useMutation(() => campaignApi.toggleStatus(Number(id)), {
    onSuccess: (data) => {
      queryClient.invalidateQueries(['campaign', id]);
      toast({
        title: 'Status updated',
        description: `Campaign is now ${data.isRunning ? 'active' : 'inactive'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error: string) => {
      toast({
        title: 'Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    onClose();
  };

  const handleToggleStatus = () => {
    toggleMutation.mutate();
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  if (isError || !campaign) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load campaign details. Please try again later.
      </Alert>
    );
  }

  // Calculate totals
  const totalPayouts = campaign.payouts.length;
  const totalBudget = campaign.payouts.reduce((sum, payout) => sum + (payout.budget || 0), 0);

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">{campaign.title}</Heading>
          <Link href={campaign.landingPageUrl} isExternal color="blue.500">
            {campaign.landingPageUrl} <ExternalLinkIcon mx="2px" />
          </Link>
        </VStack>
        <HStack spacing={3}>
          <Button
            colorScheme={campaign.isRunning ? 'red' : 'green'}
            onClick={handleToggleStatus}
            isLoading={toggleMutation.isLoading}
          >
            {campaign.isRunning ? 'Stop Campaign' : 'Start Campaign'}
          </Button>
          <Button
            leftIcon={<EditIcon />}
            onClick={() => navigate(`/campaigns/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            leftIcon={<DeleteIcon />}
            colorScheme="red"
            variant="outline"
            onClick={onOpen}
          >
            Delete
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Stat
          p={5}
          shadow="md"
          borderWidth="1px"
          borderRadius="md"
          backgroundColor={campaign.isRunning ? 'green.50' : 'gray.50'}
        >
          <StatLabel>Status</StatLabel>
          <StatNumber>
            <Badge colorScheme={campaign.isRunning ? 'green' : 'gray'} fontSize="md" p={1}>
              {campaign.isRunning ? 'Active' : 'Inactive'}
            </Badge>
          </StatNumber>
          <StatHelpText>
            {campaign.isRunning
              ? 'Campaign is currently running'
              : 'Campaign is currently paused'}
          </StatHelpText>
        </Stat>

        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <StatLabel>Total Payouts</StatLabel>
          <StatNumber>{totalPayouts}</StatNumber>
          <StatHelpText>Countries with active payouts</StatHelpText>
        </Stat>

        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <StatLabel>Total Budget</StatLabel>
          <StatNumber>${totalBudget.toFixed(2)}</StatNumber>
          <StatHelpText>Combined from all payouts</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Box mb={8}>
        <Heading size="md" mb={4}>
          Campaign Details
        </Heading>
        <Table variant="simple">
          <Tbody>
            <Tr>
              <Th>Created</Th>
              <Td>
                {new Date(campaign.createdAt).toLocaleDateString()} (
                {formatDistance(new Date(campaign.createdAt), new Date(), { addSuffix: true })})
              </Td>
            </Tr>
            <Tr>
              <Th>Last Updated</Th>
              <Td>
                {new Date(campaign.updatedAt).toLocaleDateString()} (
                {formatDistance(new Date(campaign.updatedAt), new Date(), { addSuffix: true })})
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </Box>

      <Divider my={6} />

      <Box>
        <Heading size="md" mb={4}>
          Payouts by Country
        </Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Country</Th>
              <Th>Amount</Th>
              <Th>Budget</Th>
              <Th>Auto Stop</Th>
              <Th>Budget Alert</Th>
            </Tr>
          </Thead>
          <Tbody>
            {campaign.payouts.map((payout) => (
              <Tr key={payout.id}>
                <Td>
                  {payout.country ? (
                    <Text>
                      {payout.country.name} ({payout.country.code})
                    </Text>
                  ) : (
                    <Text color="red.500">Unknown Country</Text>
                  )}
                </Td>
                <Td>${payout.amount.toFixed(2)}</Td>
                <Td>{payout.budget ? `$${payout.budget.toFixed(2)}` : '-'}</Td>
                <Td>
                  <Badge colorScheme={payout.autoStop ? 'red' : 'gray'}>
                    {payout.autoStop ? 'Enabled' : 'Disabled'}
                  </Badge>
                </Td>
                <Td>
                  <VStack align="start" spacing={0}>
                    <Badge colorScheme={payout.budgetAlert ? 'orange' : 'gray'}>
                      {payout.budgetAlert ? 'Enabled' : 'Disabled'}
                    </Badge>
                    {payout.budgetAlert && payout.budgetAlertEmail && (
                      <Text fontSize="xs" color="gray.600">
                        {payout.budgetAlertEmail}
                      </Text>
                    )}
                  </VStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Campaign</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete the campaign "{campaign.title}"? This action cannot be
            undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={deleteMutation.isLoading}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CampaignDetail;