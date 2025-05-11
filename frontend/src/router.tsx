import React from 'react';
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import HomePage from './components/pages/HomePage';
import UploadPage from './components/pages/UploadPage';
import VisualizePage from './components/pages/VisualizationPage';
import NotFoundPage from './components/pages/NotFoundPage';
import AnalysisPage from './components/pages/AnalysisPage';
import BiologyHierarchyPage from './components/pages/BiologyHierarchyPage';
import BiologicalExplorer from './components/pages/BiologicalExplorer';
import App from './App';

// Opt into future React Router behaviors
const routerOptions = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/*" element={<App />}>
      <Route index element={<HomePage />} />
      <Route path="upload" element={<UploadPage />} />
      <Route path="visualize/:id" element={<VisualizePage />} />
      <Route path="analysis/:id" element={<AnalysisPage />} />
      <Route path="biology" element={<BiologyHierarchyPage />} />
      <Route path="explorer" element={<BiologicalExplorer />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  ),
  routerOptions
);

const Router = () => {
  return <RouterProvider router={router} />;
};

export default Router; 