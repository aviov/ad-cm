import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  useColorModeValue,
} from '@chakra-ui/react';
import { AddIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { campaignApi, countryApi } from '../services/api';
import { formatDistance } from 'date-fns';
import { formatNumber, formatEUR } from '../utils/formatters';
import { Country } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: campaigns, isLoading: isLoadingCampaigns, isError: isCampaignsError } = useQuery('campaigns', campaignApi.getAll);
  const { data: countries, isLoading: isLoadingCountries, isError: isCountriesError } = useQuery('countries', countryApi.getAll);

  const bgColor = useColorModeValue('white', 'gray.800');
  const createBtnBg = useColorModeValue('#00e1ff', '#00c4dd');
  const createBtnHoverBg = useColorModeValue('#00c4dd', '#00b3cc');
  const mutedTextColor = useColorModeValue('#666', '#DDD');
  const gridBgColor = useColorModeValue('rgba(0, 0, 0, 0.03)', 'rgba(255, 255, 255, 0.03)');
  const cursorFill = useColorModeValue('rgba(0, 0, 0, 0.02)', 'rgba(255, 255, 255, 0.02)');
  const tooltipBgColor = useColorModeValue('#FFF', '#333');
  const tooltipBorderColor = '1px solid #555';
  const tooltipLabelColor = useColorModeValue('#333', '#FFF');
  const tooltipItemColor = useColorModeValue('#666', '#FFF');
  const pieStrokeColor = useColorModeValue('#fff', '#222');
  const pieLabelColor = useColorModeValue('#333', '#fff');

  const isLoading = isLoadingCampaigns || isLoadingCountries;
  const isError = isCampaignsError || isCountriesError;

  const countryMap = React.useMemo<Map<number, Country>>(() => {
    if (!countries) return new Map<number, Country>();
    return countries.reduce((map: Map<number, Country>, country: Country) => {
      map.set(country.id, country);
      return map;
    }, new Map<number, Country>());
  }, [countries]);

  // Calculate statistics
  const totalCampaigns = campaigns?.length || 0;
  const activeCampaigns = campaigns?.filter(c => c.isRunning).length || 0;
  const inactiveCampaigns = totalCampaigns - activeCampaigns;

  // Calculate total budget across all campaigns
  const totalBudget = React.useMemo(() => {
    if (!campaigns || !campaigns.length) return 0;

    return campaigns.reduce((total, campaign) => {
      if (!campaign?.payouts) return total;

      return total + campaign.payouts.reduce((sum, payout) => {
        // Handle null or undefined budget values safely
        const budget = payout?.budget !== null && payout?.budget !== undefined ? Number(payout.budget) : 0;
        return sum + budget;
      }, 0);
    }, 0);
  }, [campaigns]);

  // Prepare data for the country chart
  const countryData = React.useMemo(() => {
    // Exit early if data isn't loaded yet
    if (!campaigns || !countries) return [];

    // Group payouts by country
    const countryBudgets: { [key: string]: { country: string, budget: number, count: number } } = {};

    // Iterate through each campaign and payout
    campaigns.forEach(campaign => {
      if (!campaign.payouts) return;

      campaign.payouts.forEach(payout => {
        if (!payout) return;

        // Use the explicit countryId property now available
        const countryId = payout.countryId ? Number(payout.countryId) : null;

        // Find matching country
        const country = countryId ? countryMap.get(countryId) : null;

        // Create a key for this country (with fallback for unknown countries)
        const countryName = country?.name || 'Unknown';
        const countryCode = country?.code || 'XX';
        const key = `${countryName} (${countryCode})`;

        // Initialize entry if it doesn't exist
        if (!countryBudgets[key]) {
          countryBudgets[key] = { 
            country: key, 
            budget: 0, 
            count: 0 
          };
        }

        // Update the budget and count
        countryBudgets[key].count += 1;
        const budgetValue = payout.budget ? Number(payout.budget) : 0;
        countryBudgets[key].budget += budgetValue;
      });
    });

    // Convert to array and sort by budget (descending)
    return Object.values(countryBudgets)
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 10); // Get top 10
  }, [campaigns, countries, countryMap]);

  // Prepare data for the country distribution donut chart
  const countryDistributionData = React.useMemo(() => {
    if (!campaigns || !countries) return [];

    // Group campaigns by country
    const countryCounts: { [key: string]: { name: string, value: number } } = {};

    campaigns.forEach(campaign => {
      if (!campaign.payouts) return;

      campaign.payouts.forEach(payout => {
        if (!payout) return;

        // Use the explicit countryId property
        const countryId = payout.countryId ? Number(payout.countryId) : null;
        const country = countryId ? countryMap.get(countryId) : null;

        // Create a key for this country
        const countryName = country?.name || 'Unknown';
        const countryCode = country?.code || 'XX';
        const key = `${countryName} (${countryCode})`;

        // Initialize or increment count
        if (!countryCounts[key]) {
          countryCounts[key] = { name: key, value: 0 };
        }

        countryCounts[key].value += 1;
      });
    });

    // Convert to array and sort by count (descending)
    return Object.values(countryCounts)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Get top 10
  }, [campaigns, countries, countryMap]);

  // Define vibrant energy color palettes for charts
  const COUNTRY_COLORS = [
    '#00e1ff', // Cyan
    '#ff00a6', // Magenta
    '#00C49F', // Teal
    '#FFBB28', // Yellow
    '#FF8042', // Orange
    '#a05195', // Purple
    '#d45087', // Pink
    '#f95d6a', // Red
    '#ff7c43', // Light Orange
    '#ffa600'  // Amber
  ];

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
        <Spinner size="xl" color="cyan.500" />
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
          bg={createBtnBg}
          color="black"
          fontWeight="bold"
          _hover={{ 
            bg: createBtnHoverBg,
            color: "black"
          }}
          onClick={() => navigate('/campaigns/new')}
        >
          Create Campaign
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Stat p={5} borderRadius="md" boxShadow="sm">
          <StatLabel>Total Campaigns</StatLabel>
          <StatNumber>{formatNumber(totalCampaigns)}</StatNumber>
          <StatHelpText>
            {formatNumber(activeCampaigns)} active, {formatNumber(inactiveCampaigns)} inactive
          </StatHelpText>
        </Stat>
        
        <Stat p={5} borderRadius="md" boxShadow="sm">
          <StatLabel>Active Rate</StatLabel>
          <StatNumber>
            {totalCampaigns ? Math.round((activeCampaigns / totalCampaigns) * 100) : 0}%
          </StatNumber>
          <StatHelpText>
            {formatNumber(activeCampaigns)} out of {formatNumber(totalCampaigns)} campaigns
          </StatHelpText>
        </Stat>
        
        <Stat p={5} borderRadius="md" boxShadow="sm">
          <StatLabel>Total Budget</StatLabel>
          <StatNumber>{formatEUR(totalBudget)}</StatNumber>
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
          borderRadius="md" 
          bg={bgColor} 
          h={{ base: '400px', md: '500px' }}
          w="100%"
        >
          <Heading size="md" mb={4}>Budget by Country</Heading>
          
          {countryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={countryData}
                margin={{ top: 20, right: 30, left: 40, bottom: 90 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridBgColor} />
                <XAxis 
                  dataKey="country" 
                  angle={-45} 
                  textAnchor="end"
                  height={90}
                  tick={{ fontSize: 13, fill: mutedTextColor }}
                  tickMargin={20}
                />
                <YAxis 
                  label={{ 
                    value: 'Budget (€)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    dy: -30,
                    fill: mutedTextColor 
                  }} 
                  tick={{ fontSize: 13, fill: mutedTextColor }}
                />
                <Tooltip 
                  formatter={(value) => {
                    // Ensure value is properly typed before formatting
                    return [formatEUR(Number(value)), 'Budget'];
                  }}
                  contentStyle={{ 
                    backgroundColor: tooltipBgColor, 
                    border: tooltipBorderColor,
                    borderRadius: '4px'
                  }}
                  labelStyle={{
                    color: tooltipLabelColor,
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}
                  itemStyle={{
                    color: tooltipItemColor
                  }}
                  cursor={{ 
                    fill: cursorFill
                  }}
                />
                <Bar dataKey="budget">
                  {countryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Flex h="100%" align="center" justify="center">
              <Text color="gray.500">No country data available</Text>
            </Flex>
          )}
        </Box>

        {/* Country Distribution Donut Chart */}
        <Box 
          flex="2" 
          p={5} 
          borderRadius="md" 
          bg={bgColor} 
          h={{ base: '400px', md: '500px' }}
          w="100%"
        >
          <Heading size="md" mb={4}>Campaigns by Country</Heading>
          
          {countryDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={countryDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                  label={({ cx, cy, midAngle, outerRadius, percent, name }) => {
                    // Get country code and format with percentage as requested
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius * 1.2;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    
                    // Get the country code from the country name
                    // The pattern is usually "Country Name (XX)" where XX is the code
                    let countryCode = "";
                    const codeMatch = name.match(/\(([A-Z]{2})\)/);
                    if (codeMatch && codeMatch[1]) {
                      countryCode = codeMatch[1]; // Extract the code from parentheses
                    } else {
                      // Fallback: take first 2 letters of country name
                      countryCode = name.slice(0, 2).toUpperCase();
                    }
                    
                    // Format exactly as requested: "EE 33%"
                    const percentValue = `${(percent * 100).toFixed(0)}%`;
                    
                    return (
                      <text
                        x={x}
                        y={y}
                        fill={pieLabelColor}
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize="13"
                        fontWeight="500"
                      >
                        {`${countryCode} ${percentValue}`}
                      </text>
                    );
                  }}
                >
                  {countryDistributionData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} 
                      stroke={pieStrokeColor}
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => {
                    // Ensure value is properly typed and formatted
                    return [formatNumber(Number(value)), 'Campaigns'];
                  }}
                  contentStyle={{ 
                    backgroundColor: tooltipBgColor, 
                    border: tooltipBorderColor,
                    borderRadius: '4px'
                  }}
                  labelStyle={{
                    color: tooltipLabelColor,
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}
                  itemStyle={{
                    color: tooltipItemColor
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Flex h="100%" align="center" justify="center">
              <Text color="gray.500">No country data available</Text>
            </Flex>
          )}
        </Box>
      </Stack>

      {/* Recent Campaigns */}
      <Box 
        p={5} 
        borderRadius="md" 
        boxShadow="sm"
        bg={bgColor} 
        mb={8}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Recent Campaigns</Heading>
          <Button 
            size="sm" 
            bg={createBtnBg}
            color="black"
            fontWeight="bold"
            _hover={{ 
              bg: createBtnHoverBg,
              color: "black"
            }}
            onClick={() => navigate('/campaigns')}
            colorScheme="cyan"
            variant="outline"
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
                      color="cyan.500"
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
                    <Link href={campaign.landingPageUrl} isExternal color="cyan.500">
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
                    <Badge colorScheme="purple">{formatNumber(campaign.payouts.length)} countries</Badge>
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
          boxShadow="sm"
          borderRadius="md"
          bgGradient="linear(to-r, brand.50, blue.50)"
          bg={bgColor}
          borderWidth="1px"
          borderColor={useColorModeValue("gray.200", "gray.700")}
        >
          <Heading size="md" mb={4} textAlign="center">
            Welcome to Campaign Management!
          </Heading>
          <Text textAlign="center" mb={6}>
            Start by creating your first campaign to see analytics and insights on this dashboard.
          </Text>
          <Button
            leftIcon={<AddIcon color="black" />}
            bg={createBtnBg}
            color="black"
            fontWeight="bold"
            _hover={{ 
              bg: createBtnHoverBg,
              color: "black"
            }}
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