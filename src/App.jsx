import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import LearnTopic from './pages/LearnTopic'
import NotesGenerator from './pages/NotesGenerator'
import QuizGenerator from './pages/QuizGenerator'
import Flashcards from './pages/Flashcards'
import Visualizations from './pages/Visualizations'
import CodePlayground from './pages/CodePlayground'
import AIChatMentor from './pages/AIChatMentor'
import StudyPlanner from './pages/StudyPlanner'
import ProgressTracking from './pages/ProgressTracking'
import SavedNotes from './pages/SavedNotes'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--t1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent2)' }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--t2)', fontFamily: 'Outfit', letterSpacing: '0.05em' }}>Synchronizing session...</p>
        </div>
      </div>
    )
  }
  
  return user ? children : <Navigate to="/login" replace />
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--t1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent2)' }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--t2)', fontFamily: 'Outfit', letterSpacing: '0.05em' }}>Synchronizing session...</p>
        </div>
      </div>
    )
  }
  
  return !user ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
      
      {/* SSO Callback from Google OAuth */}
      <Route 
        path="/sso-callback" 
        element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl="/dashboard" signInForceRedirectUrl="/dashboard" />} 
      />

      {/* Protected — wrapped in AppLayout (sidebar + topbar) */}
      <Route path="/dashboard"      element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/learn"          element={<ProtectedRoute><AppLayout><LearnTopic /></AppLayout></ProtectedRoute>} />
      <Route path="/notes"          element={<ProtectedRoute><AppLayout><NotesGenerator /></AppLayout></ProtectedRoute>} />
      <Route path="/quiz"           element={<ProtectedRoute><AppLayout><QuizGenerator /></AppLayout></ProtectedRoute>} />
      <Route path="/flashcards"     element={<ProtectedRoute><AppLayout><Flashcards /></AppLayout></ProtectedRoute>} />
      <Route path="/visualizations" element={<ProtectedRoute><AppLayout><Visualizations /></AppLayout></ProtectedRoute>} />
      <Route path="/code"           element={<ProtectedRoute><AppLayout><CodePlayground /></AppLayout></ProtectedRoute>} />
      <Route path="/chat"           element={<ProtectedRoute><AppLayout><AIChatMentor /></AppLayout></ProtectedRoute>} />
      <Route path="/planner"        element={<ProtectedRoute><AppLayout><StudyPlanner /></AppLayout></ProtectedRoute>} />
      <Route path="/progress"       element={<ProtectedRoute><AppLayout><ProgressTracking /></AppLayout></ProtectedRoute>} />
      <Route path="/saved-notes"    element={<ProtectedRoute><AppLayout><SavedNotes /></AppLayout></ProtectedRoute>} />
      <Route path="/settings"       element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
