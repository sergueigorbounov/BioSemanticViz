import React from 'react';
import { 
  Route, 
  createBrowserRouter, 
  createRoutesFromElements, 
  RouterProvider 
} from 'react-router-dom';
import HomePage from './components/pages/HomePage';
import UploadPage from './components/pages/UploadPage';
import VisualizePage from './components/pages/VisualizationPage';
import NotFoundPage from './components/pages/NotFoundPage';
import AnalysisPage from './components/pages/AnalysisPage';
import BiologicalExplorer from './components/pages/BiologicalExplorer';
import BioDashboard from './components/pages/BioDashboard';
import AnalyticsDashboard from './components/pages/AnalyticsDashboard';
import App from './App';
import PhylogeneticAnalysis from './components/visualizations/PhylogeneticAnalysis';
import OrthologuePage from './components/pages/OrthologuePage';

// Router configuration options with recommended future flags
const routerOptions = {
  basename: '/',
  future: {
    v7_normalizeFormMethod: true,
    v7_startTransition: true,
    v7_relativeSplatPath: true
  },
};

// Define the application routes
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/*" element={<App />}>
      <Route index element={<HomePage />} />
      <Route path="upload" element={<UploadPage />} />
      <Route path="visualize/:id" element={<VisualizePage />} />
      <Route path="analysis/:id" element={<AnalysisPage />} />
      <Route path="explorer" element={<BiologicalExplorer />} />
      <Route path="dashboard" element={<BioDashboard />} />
      <Route path="analytics" element={<AnalyticsDashboard />} />
      <Route path="phylo" element={<PhylogeneticAnalysis />} />
      <Route path="orthologues" element={<OrthologuePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  ),
  routerOptions
);

const Router = () => {
  return <RouterProvider router={router} />;
};

export default Router; 