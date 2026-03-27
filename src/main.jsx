import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'  // ✅ import global styles here
import { UserProvider } from "./frontend/contexts/UserContext.jsx";
import ErrorBoundary from './frontend/components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <UserProvider>
        <App />
      </UserProvider>
    </ErrorBoundary>
  </React.StrictMode>
);