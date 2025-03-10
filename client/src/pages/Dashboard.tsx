import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Alert,
  AlertIcon,
  Flex,
  Button,
  Text,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Link,
} from '@chakra-ui/react';
import { AddIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { campaignApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDistance } from 'date-fns';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: campaigns, isLoading, isError } = useQuery('campaigns', campaignApi.getAll);

  // Calculate statistics
  const totalCampaigns = campaigns?.length || 0;
  const activeCampaigns = campaigns?.filter(c => c.isRunning).length || 0;
  const inactiveCampaigns = totalCampaigns - activeCampaigns;
  
  // Calculate total budget across all campaigns
  const totalBudget = React.useMemo(() => {
    if (!campaigns) return 0;
    
    return campaigns.reduce((total, campaign) => {
      return total + campaign.payouts.reduce((sum, payout) => sum + (payout.budget || 0), 0);
    }, 0);
  }, [campaigns]);
  
  // Prepare data for the country chart
  const countryData = React.useMemo(() => {
    if (!campaigns) return [];
    
    // Group payouts by country
    const countryMap = new Map();
    
    campaigns.forEach(campaign => {
      campaign.payouts.forEach(payout => {
        const countryName = payout.country?.name || 'Unknown';
        const countryCode = payout.country?.code || 'XX';
        const key = `${countryName} (${countryCode})`;
        
        if (!countryMap.has(key)) {
          countryMap.set(key, { country: key, count: 0, budget: 0 });
        }
        
        const entry = countryMap.get(key);
        entry.count += 1;
        entry.budget += payout.budget || 0;
      });
    });
    
    return Array.from(countryMap.values())
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 10); // Top 10 countries by budget
  }, [campaigns]);

  // Prepare data for the campaign status pie chart
  const statusData = React.useMemo(() => {
    return [
      { name: 'Active', value: activeCampaigns },
      { name: 'Inactive', value: inactiveCampaigns }
    ].filter(item => item.value > 0);
  }, [activeCampaigns, inactiveCampaigns]);

//   const COLORS = ['#0088FE', '#FFBB28', '#FF8042'];

  // Get recently updated campaigns
  const recentCampaigns = React.useMemo(() => {
    if (!campaigns) return [];
    
    return [...campaigns]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5); // Top 5 recent campaigns
  }, [campaigns]);

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
        Failed to load dashboard data. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Dashboard</Heading>
        <Button 
          leftIcon={<AddIcon />} 
          onClick={() => navigate('/campaigns/new')}
          colorScheme="brand"
        >
          Create Campaign
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <StatLabel>Total Campaigns</StatLabel>
          <StatNumber>{totalCampaigns}</StatNumber>
          <StatHelpText>
            {activeCampaigns} active, {inactiveCampaigns} inactive
          </StatHelpText>
        </Stat>
        
        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <StatLabel>Active Rate</StatLabel>
          <StatNumber>
            {totalCampaigns ? Math.round((activeCampaigns / totalCampaigns) * 100) : 0}%
          </StatNumber>
          <StatHelpText>
            {activeCampaigns} out of {totalCampaigns} campaigns
          </StatHelpText>
        </Stat>
        
        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <StatLabel>Total Budget</StatLabel>
          <StatNumber>${totalBudget.toFixed(2)}</StatNumber>
          <StatHelpText>Across all campaigns</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Stack 
        direction={{ base: 'column', lg: 'row' }} 
        spacing={8} 
        mb={8}
        align="start"
      >
        {/* Country Distribution Chart */}
        <Box 
          flex="3" 
          p={5} 
          shadow="md" 
          borderWidth="1px" 
          borderRadius="md" 
          h={{ base: '400px', md: '500px' }}
          w="100%"
        >
          <Heading size="md" mb={4}>Budget by Country</Heading>
          
          {countryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={countryData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="country" 
                  angle={-45} 
                  textAnchor="end"
                  height={70} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis label={{ value: 'Budget ($)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`$${value}`, 'Budget']} />
                <Bar dataKey="budget" fill="#00a6ff" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Flex h="100%" align="center" justify="center">
              <Text color="gray.500">No country data available</Text>
            </Flex>
          )}
        </Box>

        {/* Campaign Status Pie Chart */}
        <Box 
          flex="2" 
          p={5} 
          shadow="md" 
          borderWidth="1px" 
          borderRadius="md" 
          h={{ base: '400px', md: '500px' }}
          w="100%"
        >
          <Heading size="md" mb={4}>Campaign Status</Heading>
          
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#00a6ff' : '#FFBB28'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Campaigns']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Flex h="100%" align="center" justify="center">
              <Text color="gray.500">No status data available</Text>
            </Flex>
          )}
        </Box>
      </Stack>

      {/* Recent Campaigns */}
      <Box 
        p={5} 
        shadow="md" 
        borderWidth="1px" 
        borderRadius="md" 
        mb={8}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Recent Campaigns</Heading>
          <Button 
            size="sm" 
            onClick={() => navigate('/campaigns')}
          >
            View All
          </Button>
        </Flex>
        
        {recentCampaigns.length > 0 ? (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Landing Page</Th>
                <Th>Updated</Th>
                <Th>Payouts</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recentCampaigns.map((campaign) => (
                <Tr key={campaign.id}>
                  <Td>
                    <Link
                      as={RouterLink}
                      to={`/campaigns/${campaign.id}`}
                      color="brand.500"
                      fontWeight="medium"
                    >
                      {campaign.title}
                    </Link>
                  </Td>
                  <Td>
                    <Badge colorScheme={campaign.isRunning ? 'green' : 'gray'}>
                      {campaign.isRunning ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <Link href={campaign.landingPageUrl} isExternal color="blue.500">
                      {campaign.landingPageUrl.length > 30
                        ? campaign.landingPageUrl.substring(0, 30) + '...'
                        : campaign.landingPageUrl}
                      <ExternalLinkIcon mx="2px" />
                    </Link>
                  </Td>
                  <Td>
                    {formatDistance(new Date(campaign.updatedAt), new Date(), { addSuffix: true })}
                  </Td>
                  <Td>
                    <Badge colorScheme="purple">{campaign.payouts.length} countries</Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Alert status="info">
            <AlertIcon />
            No campaigns created yet. Create your first campaign to see data here.
          </Alert>
        )}
      </Box>

      {/* Additional Info */}
      {totalCampaigns === 0 && (
        <Flex
          direction="column"
          align="center"
          justify="center"
          p={10}
          shadow="md"
          borderWidth="1px"
          borderRadius="md"
          bgGradient="linear(to-r, brand.50, blue.50)"
        >
          <Heading size="md" mb={4} textAlign="center">
            Welcome to Campaign Management!
          </Heading>
          <Text textAlign="center" mb={6}>
            Start by creating your first campaign to see analytics and insights on this dashboard.
          </Text>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="brand"
            onClick={() => navigate('/campaigns/new')}
          >
            Create Your First Campaign
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default Dashboard;