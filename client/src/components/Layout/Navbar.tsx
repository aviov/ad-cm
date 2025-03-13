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
  Tooltip,
  useBreakpointValue,
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
  const showText = useBreakpointValue({ base: false, md: true });

  return (
    <NavLink 
      to={to} 
      style={{ textDecoration: 'none' }}
      end={exact}
    >
      {showText ? (
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
      ) : (
        <Tooltip label={children} placement="bottom" hasArrow>
          <IconButton
            aria-label={String(children)}
            icon={<Icon as={icon} fontSize="20px" />}
            variant="ghost"
            color={isActive ? activeColor : textColor}
            position="relative"
            _hover={{ 
              color: hoverColor,
              bg: 'transparent'
            }}
            _after={{
              content: '""',
              position: 'absolute',
              bottom: '0',
              left: '25%',
              right: '25%',
              height: '2px',
              bg: isActive ? activeColor : 'transparent',
              borderRadius: 'full'
            }}
          />
        </Tooltip>
      )}
    </NavLink>
  );
};

const Navbar: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.900');
  const headingColor = useColorModeValue('brand.500', 'cyan.500');
  const logoText = useBreakpointValue({ base: 'Ad C', md: 'Ad Campaigns' });
  
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
          size={{ base: "sm", md: "md" }}
          color={headingColor}
          fontWeight="bold"
          mr={{ base: 2, md: 8 }}
        >
          {logoText}
        </Heading>
        
        <HStack spacing={{ base: 0, md: 2 }}>
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
          size={{ base: "sm", md: "md" }}
        />
      </Flex>
    </Box>
  );
};

export default Navbar;