import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  HStack,
  Badge,
  IconButton,
  Spinner,
  Alert,
  AlertIcon,
  Switch,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import { campaignApi } from '../../services/api';
import { Campaign } from '../../types';

const CampaignList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const toast = useToast();
  
  const { data: campaigns, isLoading, isError, refetch } = useQuery(
    'campaigns',
    campaignApi.getAll
  );

  const handleToggleStatus = async (id: number) => {
    try {
      await campaignApi.toggleStatus(id);
      refetch();
      toast({
        title: 'Status updated',
        description: 'Campaign status has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: String(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await campaignApi.delete(id);
        refetch();
        toast({
          title: 'Campaign deleted',
          description: 'Campaign has been deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: String(error),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Filter campaigns based on search term and status filter
  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          campaign.landingPageUrl.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && campaign.isRunning;
    if (statusFilter === 'inactive') return matchesSearch && !campaign.isRunning;
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="300px">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (isError) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load campaigns. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Campaigns</Heading>
        <Button 
          leftIcon={<AddIcon />} 
          onClick={() => navigate('/campaigns/new')}
          colorScheme="brand"
        >
          Create Campaign
        </Button>
      </Flex>

      <Flex mb={4} gap={4}>
        <InputGroup maxW="md">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search by title or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        
        <Select
          maxW="200px"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Campaigns</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </Select>
      </Flex>

      {filteredCampaigns?.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          No campaigns found. Create your first campaign by clicking the "Create Campaign" button.
        </Alert>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Landing Page</Th>
              <Th>Status</Th>
              <Th>Payouts</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredCampaigns?.map((campaign: Campaign) => (
              <Tr key={campaign.id}>
                <Td fontWeight="medium">
                  <Text
                    cursor="pointer"
                    _hover={{ color: 'brand.500' }}
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    {campaign.title}
                  </Text>
                </Td>
                <Td>
                  <Text 
                    isTruncated 
                    maxW="250px" 
                    color="blue.600" 
                    as="a" 
                    href={campaign.landingPageUrl} 
                    target="_blank"
                  >
                    {campaign.landingPageUrl}
                  </Text>
                </Td>
                <Td>
                  <Flex align="center">
                    <Switch
                      colorScheme="green"
                      isChecked={campaign.isRunning}
                      onChange={() => handleToggleStatus(campaign.id)}
                      mr={2}
                    />
                    <Badge colorScheme={campaign.isRunning ? 'green' : 'gray'}>
                      {campaign.isRunning ? 'Active' : 'Inactive'}
                    </Badge>
                  </Flex>
                </Td>
                <Td>
                  <Badge colorScheme="purple">{campaign.payouts.length} countries</Badge>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="View details"
                      icon={<EditIcon />}
                      size="sm"
                      onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                    />
                    <IconButton
                      aria-label="Delete campaign"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default CampaignList;