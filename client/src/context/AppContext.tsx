import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import useAuth from '../hooks/useAuth';

interface AppContextState {
  sidebarOpen: boolean;
  isMobileView: boolean;
  theme: 'light' | 'dark';
}

interface AppContextValue extends AppContextState {
  toggleSidebar: () => void;
  setMobileView: (isMobile: boolean) => void;
  toggleTheme: () => void;
  auth: ReturnType<typeof useAuth>;
}

// Create the context with a default value
const AppContext = createContext<AppContextValue | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppContextState>({
    sidebarOpen: true,
    isMobileView: window.innerWidth < 768,
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  });

  const auth = useAuth();

  // Toggle sidebar visibility
  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  }, []);

  // Set mobile view state
  const setMobileView = useCallback((isMobile: boolean) => {
    setState(prev => ({ ...prev, isMobileView: isMobile, sidebarOpen: !isMobile }));
  }, []);

  // Toggle theme between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    setState(prev => ({ ...prev, theme: newTheme }));
  }, [state.theme]);

  // Set up window resize listener
  React.useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setMobileView(isMobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileView]);

  // Update document with theme class
  React.useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  const contextValue: AppContextValue = {
    ...state,
    toggleSidebar,
    setMobileView,
    toggleTheme,
    auth,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// Custom hook to use the app context
export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
