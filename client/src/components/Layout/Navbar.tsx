import React from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  IconButton, 
  useColorMode, 
  useColorModeValue, 
  Spacer,
  HStack,
  Button,
  Icon,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { NavLink, useLocation } from 'react-router-dom';
import { HiOutlineHome, HiOutlineViewGrid, HiOutlinePlusCircle } from 'react-icons/hi';

interface NavItemProps {
  icon: React.ElementType;
  to: string;
  children: React.ReactNode;
  exact?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, to, children, exact }) => {
  const location = useLocation();
  const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
  
  const activeColor = useColorModeValue('brand.600', 'cyan.400');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const hoverColor = useColorModeValue('brand.400', 'cyan.300');

  return (
    <NavLink 
      to={to} 
      style={{ textDecoration: 'none' }}
      end={exact}
    >
      <Button
        variant="ghost"
        leftIcon={<Icon as={icon} fontSize="18px" />}
        color={isActive ? activeColor : textColor}
        fontWeight={isActive ? "bold" : "normal"}
        position="relative"
        _hover={{ 
          color: hoverColor,
          bg: 'transparent'
        }}
        _after={{
          content: '""',
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '2px',
          bg: isActive ? activeColor : 'transparent',
          borderRadius: 'full'
        }}
      >
        {children}
      </Button>
    </NavLink>
  );
};

const Navbar: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.900');
  const headingColor = useColorModeValue('brand.500', 'cyan.500');
  
  return (
    <Box 
      as="nav" 
      bg={bgColor} 
      px={4} 
      py={3} 
      width="full"
      boxShadow="sm"
    >
      <Flex align="center" maxW="container.xl" mx="auto">
        <Heading 
          as="h1" 
          size="md" 
          color={headingColor}
          fontWeight="bold"
          mr={8}
        >
          Ad Campaigns
        </Heading>
        
        <HStack spacing={2}>
          <NavItem icon={HiOutlineHome} to="/" exact>
            Dashboard
          </NavItem>
          <NavItem icon={HiOutlineViewGrid} to="/campaigns" exact={false}>
            Campaigns
          </NavItem>
          <NavItem icon={HiOutlinePlusCircle} to="/campaigns/new" exact>
            Create Campaign
          </NavItem>
        </HStack>
        
        <Spacer />
        
        <IconButton
          aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
          variant="ghost"
          onClick={toggleColorMode}
          color={colorMode === 'light' ? "brand.500" : "white"}
          icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          _hover={{
            bg: colorMode === 'light' ? 'gray.100' : 'gray.700'
          }}
        />
      </Flex>
    </Box>
  );
};

export default Navbar;