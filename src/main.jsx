import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import './index.css'

const CLERK_KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim()

const HAS_CLERK_KEY = CLERK_KEY && 
                      CLERK_KEY !== 'your_clerk_publishable_key_here' && 
                      (CLERK_KEY.startsWith('pk_test_') || CLERK_KEY.startsWith('pk_live_'))

const SHOULD_USE_CLERK = HAS_CLERK_KEY && localStorage.getItem('dlvt_clerk_bypass') !== 'true'

const appTree = (
  <BrowserRouter>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </BrowserRouter>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {SHOULD_USE_CLERK ? (
      <ClerkProvider publishableKey={CLERK_KEY}>
        {appTree}
      </ClerkProvider>
    ) : (
      appTree
    )}
  </React.StrictMode>
)
