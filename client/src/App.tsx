import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';

// Layout
import Layout from './components/Layout/Layout.tsx';

// Pages
import Dashboard from './pages/Dashboard.tsx';
import CampaignList from './pages/Campaigns/CampaignList.tsx';
import CampaignForm from './pages/Campaigns/CampaignForm.tsx';
import CampaignDetail from './pages/Campaigns/CampaignDetail.tsx';
import NotFound from './pages/NotFound.tsx';

// Components
import ErrorBoundary from './components/ErrorBoundary.tsx';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Box>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="campaigns">
              <Route index element={<CampaignList />} />
              <Route path="new" element={<CampaignForm />} />
              <Route path=":id" element={<CampaignDetail />} />
              <Route path=":id/edit" element={<CampaignForm />} />
            </Route>
            <Route path="404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </Box>
    </ErrorBoundary>
  );
};

export default App;