import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import DeckEditor from './pages/DeckEditor.jsx';
import CommunityDecks from './pages/CommunityDecks.jsx';

// Configure declarative routing using HashRouter for GitHub Pages compatibility
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'editor',
        element: <DeckEditor />,
      },
      {
        path: 'community',
        element: <CommunityDecks />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
