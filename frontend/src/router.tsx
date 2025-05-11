import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom';
import App from './App';
import HomePage from './components/pages/HomePage';
import UploadPage from './components/pages/UploadPage';
import VisualizePage from './components/pages/VisualizePage';
import NotFoundPage from './components/pages/NotFoundPage';

// Opt into future React Router behaviors
const routerOptions = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

// Update the route configuration to use "*" for the path to allow nested routes
const routes = createRoutesFromElements(
  <Route path="*" element={<App />} />
);

export const router = createBrowserRouter(routes, routerOptions);

const Router = () => {
  return <RouterProvider router={router} />;
};

export default Router; 