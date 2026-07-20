import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { ThemeProvider } from './app/theme-context';
import './index.css';

function ViewportHeightSync() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncViewportHeight = () => {
      document.documentElement.style.setProperty(
        '--app-viewport-height',
        `${window.innerHeight}px`,
      );
    };

    syncViewportHeight();
    window.addEventListener('resize', syncViewportHeight);

    return () => {
      window.removeEventListener('resize', syncViewportHeight);
    };
  }, []);

  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ViewportHeightSync />
    </ThemeProvider>
  </React.StrictMode>,
);
