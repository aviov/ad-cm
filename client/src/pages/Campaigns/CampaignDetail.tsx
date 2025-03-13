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
  useColorModeValue,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import { ExternalLinkIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { HiPlay, HiStop } from 'react-icons/hi';
import { campaignApi } from '../../services/api';
import { formatDistance } from 'date-fns';
import { formatNumber, formatEUR } from '../../utils/formatters';

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Color mode values
  const stopBtnHoverBg = useColorModeValue('red.600', 'red.500');
  const startBtnHoverBg = useColorModeValue('green.600', 'green.500');
  const editBtnHoverBg = useColorModeValue('cyan.600', 'cyan.400');
  const deleteBtnBorderColor = useColorModeValue('red.500', 'red.300');
  const deleteBtnColor = useColorModeValue('red.600', 'red.300');
  const deleteBtnHoverBg = useColorModeValue('red.50', 'rgba(254, 178, 178, 0.12)');
  const deleteBtnHoverBorderColor = useColorModeValue('red.600', 'red.200');
  const deleteBtnHoverColor = useColorModeValue('red.700', 'red.200');
  const statLabelColor = useColorModeValue('gray.600', 'gray.200');
  const statNumberColor = useColorModeValue('gray.800', 'white');
  const statHelpTextColor = useColorModeValue('gray.600', 'gray.300');
  const statBgColor = useColorModeValue('white', 'gray.800');
  const statBorderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBadgeColor = useColorModeValue('green.100', 'green.500');
  const activeBadgeTextColor = useColorModeValue('green.800', 'white');
  const inactiveBadgeColor = useColorModeValue('gray.100', 'gray.600');
  const inactiveBadgeTextColor = useColorModeValue('gray.800', 'gray.200');
  const activeStatBgColor = useColorModeValue('green.50', 'green.900');
  const activeStatBorderColor = useColorModeValue('green.200', 'green.700');
  const activeStatHelpTextColor = useColorModeValue('green.700', 'green.200');
  const inactiveStatBgColor = useColorModeValue('gray.50', 'gray.700');
  const inactiveStatBorderColor = useColorModeValue('gray.200', 'gray.600');
  const inactiveStatHelpTextColor = useColorModeValue('gray.600', 'gray.300');

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
  const totalBudget = campaign.payouts.reduce((sum, payout) => {
    // Convert string budget to number or use 0 if null/undefined
    const budget = payout.budget ? Number(payout.budget) : 0;
    return sum + budget;
  }, 0);

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">{campaign.title}</Heading>
          <Link href={campaign.landingPageUrl} isExternal color="cyan.500">
            {campaign.landingPageUrl.length > 30
              ? campaign.landingPageUrl.substring(0, 30) + '...'
              : campaign.landingPageUrl}
            <ExternalLinkIcon mx="2px" />
          </Link>
        </VStack>
        <HStack spacing={3}>
          <Button
            colorScheme={campaign.isRunning ? 'red' : 'green'}
            onClick={handleToggleStatus}
            isLoading={toggleMutation.isLoading}
            _hover={{ 
              bg: campaign.isRunning ? stopBtnHoverBg : startBtnHoverBg
            }}
            color="black"
            fontWeight="bold"
            display={{ base: 'none', md: 'flex' }}
          >
            {campaign.isRunning ? 'Stop Campaign' : 'Start Campaign'}
          </Button>
          <IconButton
            aria-label={campaign.isRunning ? 'Stop Campaign' : 'Start Campaign'}
            icon={campaign.isRunning ? <Icon as={HiStop} boxSize="24px" /> : <Icon as={HiPlay} boxSize="24px" />}
            colorScheme={campaign.isRunning ? 'red' : 'green'}
            onClick={handleToggleStatus}
            isLoading={toggleMutation.isLoading}
            display={{ base: 'flex', md: 'none' }}
            size="lg"
          />
          <Button
            leftIcon={<Icon as={EditIcon} boxSize="24px" />}
            onClick={() => navigate(`/campaigns/${id}/edit`)}
            colorScheme="cyan"
            color="black"
            fontWeight="bold"
            _hover={{ 
              bg: editBtnHoverBg,
              color: "black"
            }}
            display={{ base: 'none', md: 'flex' }}
          >
            Edit
          </Button>
          <IconButton
            aria-label="Edit Campaign"
            icon={<Icon as={EditIcon} boxSize="24px" />}
            colorScheme="cyan"
            onClick={() => navigate(`/campaigns/${id}/edit`)}
            display={{ base: 'flex', md: 'none' }}
            size="lg"
          />
          <Button
            leftIcon={<Icon as={DeleteIcon} boxSize="24px" />}
            colorScheme="red"
            variant="outline"
            onClick={onOpen}
            borderColor={deleteBtnBorderColor}
            color={deleteBtnColor}
            _hover={{ 
              bg: deleteBtnHoverBg,
              borderColor: deleteBtnHoverBorderColor,
              color: deleteBtnHoverColor
            }}
            display={{ base: 'none', md: 'flex' }}
          >
            Delete
          </Button>
          <IconButton
            aria-label="Delete Campaign"
            icon={<Icon as={DeleteIcon} boxSize="24px" />}
            colorScheme="red"
            variant="outline"
            onClick={onOpen}
            borderColor={deleteBtnBorderColor}
            _hover={{ 
              bg: deleteBtnHoverBg,
              borderColor: deleteBtnHoverBorderColor,
              color: deleteBtnHoverColor
            }}
            display={{ base: 'flex', md: 'none' }}
            size="lg"
          />
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Stat
          p={5}
          shadow="sm"
          borderWidth="1px"
          borderRadius="md"
          backgroundColor={campaign.isRunning ? activeStatBgColor : inactiveStatBgColor}
          borderColor={campaign.isRunning ? activeStatBorderColor : inactiveStatBorderColor}
        >
          <StatLabel color={statLabelColor}>Status</StatLabel>
          <StatNumber>
            <Badge 
              colorScheme={campaign.isRunning ? 'green' : 'gray'} 
              fontSize="md" 
              p={1}
              color={campaign.isRunning ? activeBadgeTextColor : inactiveBadgeTextColor}
              bg={campaign.isRunning ? activeBadgeColor : inactiveBadgeColor}
            >
              {campaign.isRunning ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </StatNumber>
          <StatHelpText 
            color={campaign.isRunning ? activeStatHelpTextColor : inactiveStatHelpTextColor}
            fontWeight="medium"
          >
            {campaign.isRunning
              ? 'Campaign is currently running'
              : 'Campaign is currently paused'}
          </StatHelpText>
        </Stat>

        <Stat 
          p={5} 
          shadow="sm" 
          borderWidth="1px" 
          borderRadius="md"
          bg={statBgColor}
          borderColor={statBorderColor}
        >
          <StatLabel color={statLabelColor}>Total Payouts</StatLabel>
          <StatNumber color={statNumberColor}>{formatNumber(totalPayouts)}</StatNumber>
          <StatHelpText color={statHelpTextColor}>Countries with active payouts</StatHelpText>
        </Stat>

        <Stat 
          p={5} 
          shadow="sm" 
          borderWidth="1px" 
          borderRadius="md"
          bg={statBgColor}
          borderColor={statBorderColor}
        >
          <StatLabel color={statLabelColor}>Total Budget</StatLabel>
          <StatNumber color={statNumberColor}>{formatEUR(totalBudget)}</StatNumber>
          <StatHelpText color={statHelpTextColor}>Combined from all payouts</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Box>
        <Heading size="md" mb={4}>
          Payouts by Country
        </Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th color={statLabelColor}>Country</Th>
              <Th color={statLabelColor}>Amount</Th>
              <Th color={statLabelColor}>Budget</Th>
              <Th color={statLabelColor}>Budget Alert</Th>
            </Tr>
          </Thead>
          <Tbody>
            {campaign.payouts.map((payout) => (
              <Tr key={payout.id}>
                <Td color={statNumberColor}>
                  {payout.country ? (
                    <Text>
                      {payout.country.name} ({payout.country.code})
                    </Text>
                  ) : (
                    <Text color="red.500">Unknown Country</Text>
                  )}
                </Td>
                <Td color={statNumberColor}>
                  {formatEUR(payout.amount)}
                </Td>
                <Td color={statNumberColor}>
                  {formatEUR(payout.budget)}
                </Td>
                <Td>
                  <Badge
                    colorScheme={payout.budgetAlert ? 'green' : 'gray'}
                    variant={useColorModeValue('subtle', 'solid')}
                  >
                    {payout.budgetAlert ? 'ENABLED' : 'DISABLED'}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Divider my={6} />

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