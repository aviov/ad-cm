import React from 'react';
import { 
  Box, 
  VStack, 
  Icon, 
  Text, 
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiLayout, FiPlusCircle } from 'react-icons/fi';

interface NavItemProps {
  icon: React.ElementType;
  to: string;
  children: React.ReactNode;
  exact?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, to, children, exact }) => {
  const activeBg = useColorModeValue('brand.50', 'gray.700');
  const activeColor = useColorModeValue('brand.700', 'cyan.500');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const hoverColor = useColorModeValue('brand.600', 'cyan.400');

  return (
    <NavLink 
      to={to} 
      style={{ textDecoration: 'none' }}
      end={exact}
    >
      {({ isActive }) => (
        <Flex
          align="center"
          p="3"
          mx="2"
          borderRadius="md"
          role="group"
          cursor="pointer"
          bg={isActive ? activeBg : 'transparent'}
          color={isActive ? activeColor : textColor}
          _hover={{ 
            bg: !isActive ? hoverBg : activeBg,
            color: !isActive ? hoverColor : activeColor
          }}
          fontWeight={isActive ? "bold" : "normal"}
          transition="all 0.2s"
        >
          <Icon
            mr="3"
            fontSize="16"
            as={icon}
          />
          <Text fontSize="sm">{children}</Text>
        </Flex>
      )}
    </NavLink>
  );
};

const Sidebar: React.FC = () => {
  const bgColor = useColorModeValue('white', 'gray.900');

  return (
    <Box
      as="aside"
      w="64"
      bg={bgColor}
      h="full"
      overflowY="auto"
      display={{ base: 'none', md: 'block' }}
    >
      <VStack align="stretch" spacing={1} mt={5}>
        <NavItem icon={FiHome} to="/" exact>
          Dashboard
        </NavItem>
        <NavItem icon={FiLayout} to="/campaigns">
          Campaigns
        </NavItem>
        <NavItem icon={FiPlusCircle} to="/campaigns/new">
          Create Campaign
        </NavItem>
      </VStack>
    </Box>
  );
};

export default Sidebar;