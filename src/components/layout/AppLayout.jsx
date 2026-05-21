import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useApp } from '../../context/AppContext'
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'

const TITLES = {
  '/dashboard':      'Dashboard',
  '/learn':          'Learn Topic',
  '/notes':          'Notes Generator',
  '/quiz':           'Quiz Generator',
  '/flashcards':     'Flashcards',
  '/visualizations': 'Visualizations',
  '/code':           'Code Playground',
  '/chat':           'AI Chat Mentor',
  '/planner':        'Study Planner',
  '/progress':       'Progress Tracking',
  '/saved-notes':    'Saved Notes',
  '/settings':       'Settings',
}

const TOAST_STYLES = {
  success: { border: 'rgba(16,185,129,0.6)', icon: CheckCircle, iconColor: 'var(--green)', bg: 'rgba(16,185,129,0.1)' },
  warn:    { border: 'rgba(245,158,11,0.6)',  icon: AlertTriangle, iconColor: 'var(--orange)', bg: 'rgba(245,158,11,0.1)' },
  error:   { border: 'rgba(239,68,68,0.6)',   icon: XCircle, iconColor: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  info:    { border: 'var(--border-bright)',  icon: Info, iconColor: 'var(--p3)', bg: 'rgba(124,58,237,0.1)' },
}

export default function AppLayout({ children }) {
  const location = useLocation()
  const { notifications, sidebarOpen } = useApp()
  const title = TITLES[location.pathname] || 'Deep Learning Virtual Teacher'

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Global Background Neural Particles */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="ambient-particle"
            style={{
              left: `${(i * 7 + 13) % 100}%`,
              top: `${(i * 11 + 7) % 100}%`,
              width: `${(i % 3) * 3 + 3}px`,
              height: `${(i % 3) * 3 + 3}px`,
              background: i % 2 === 0 ? 'var(--p2)' : 'var(--accent)',
              opacity: 0.12,
              animationDuration: `${(i % 5) * 6 + 18}s`,
              animationDelay: `${-(i % 3) * 6}s`
            }}
          />
        ))}
      </div>

      <Sidebar />
      <div className="main-content" style={{ zIndex: 1 }}>
        <TopBar title={title} />
        <main className="page">
          {children}
        </main>
      </div>

      {/* Enhanced Toast notifications */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 9999, maxWidth: 360 }}>
        {notifications.map(n => {
          const style = TOAST_STYLES[n.type] || TOAST_STYLES.info
          const Icon = style.icon
          return (
            <div
              key={n.id}
              style={{
                background: `linear-gradient(135deg, ${style.bg}, rgba(5,5,15,0.95))`,
                backdropFilter: 'var(--blur)',
                WebkitBackdropFilter: 'var(--blur)',
                border: `1px solid ${style.border}`,
                color: 'var(--t1)',
                padding: '13px 18px',
                borderRadius: 14,
                fontSize: '0.88rem',
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${style.border}40`,
                animation: 'slide-in-right 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Icon size={16} color={style.iconColor} style={{ flexShrink: 0 }} />
              <span style={{ lineHeight: 1.4 }}>{n.msg}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
