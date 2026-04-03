import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'  // ✅ import global styles here
import { UserProvider } from "./frontend/contexts/UserContext.jsx";
import ErrorBoundary from './frontend/components/ErrorBoundary'

import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <UserProvider>
        <MantineProvider
          theme={{
            primaryColor: 'green',
            fontFamily: 'DM Sans',
            headings: {
              fontFamily: 'Playfair Display'
            },
            colors: {
              green: [
                '#E8F5E9',
                '#C8E6C9',
                '#A5D6A7',
                '#81C784',
                '#66BB6A',
                '#4CAF50',
                '#43A047',
                '#388E3C',
                '#2D4F1E',
                '#1A2E12'
              ]
            }
          }}
        >
          <Notifications position="top-right" zIndex={9999} limit={3} autoClose={4000} />
          <App />
        </MantineProvider>
      </UserProvider>
    </ErrorBoundary>
  </React.StrictMode>
);