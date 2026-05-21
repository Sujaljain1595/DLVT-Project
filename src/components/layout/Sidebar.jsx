import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import {
  LayoutDashboard, BookOpen, FileText, HelpCircle, Layers,
  BarChart2, Code2, MessageSquare, Calendar, TrendingUp,
  Settings, LogOut, BrainCircuit, X, Bookmark, Zap
} from 'lucide-react'

const NAV = [
  { path: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard,  section: 'main',   color: '#818cf8' },
  { path: '/learn',          label: 'Learn Topic',     icon: BookOpen,         section: 'main',   color: '#818cf8' },
  { path: '/notes',          label: 'Notes Generator', icon: FileText,         section: 'tools',  color: '#38bdf8' },
  { path: '/quiz',           label: 'Quiz Generator',  icon: HelpCircle,       section: 'tools',  color: '#a78bfa' },
  { path: '/flashcards',     label: 'Flashcards',      icon: Layers,           section: 'tools',  color: '#f59e0b' },
  { path: '/visualizations', label: 'Visualizations',  icon: BarChart2,        section: 'tools',  color: '#38bdf8' },
  { path: '/code',           label: 'Code Playground', icon: Code2,            section: 'tools',  color: '#10b981' },
  { path: '/chat',           label: 'AI Chat Mentor',  icon: MessageSquare,    section: 'ai',     color: '#818cf8' },
  { path: '/planner',        label: 'Study Planner',   icon: Calendar,         section: 'ai',     color: '#38bdf8' },
  { path: '/progress',       label: 'Progress',        icon: TrendingUp,       section: 'ai',     color: '#10b981' },
  { path: '/saved-notes',    label: 'Saved Notes',     icon: Bookmark,         section: 'ai',     color: '#f59e0b' },
  { path: '/settings',       label: 'Settings',        icon: Settings,         section: 'system', color: '#64748b' },
]

const SECTIONS = {
  main:   'Navigation',
  tools:  'AI Tools',
  ai:     'Learning & Progress',
  system: 'System'
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { sidebarOpen, setSidebarOpen, progress } = useApp()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const grouped = NAV.reduce((acc, item) => {
    acc[item.section] = acc[item.section] || []
    acc[item.section].push(item)
    return acc
  }, {})

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          style={{ 
            position: 'fixed', inset: 0, zIndex: 45, 
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            transition: 'opacity 0.3s ease'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ zIndex: 50 }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'var(--grad)',
              borderRadius: 10,
              padding: 7,
              display: 'flex',
              boxShadow: '0 0 20px rgba(79,70,229,0.3)',
            }}>
              <BrainCircuit size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.92rem', color: 'var(--t1)', letterSpacing: '-0.02em' }}>
                DL Virtual
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--p3)', fontFamily: 'Outfit', letterSpacing: '0.1em', fontWeight: 600 }}>
                AI TEACHER
              </div>
            </div>
            <button
              style={{ marginLeft: 'auto', color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', display: 'none' }}
              className="mobile-close"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              alt="avatar"
              style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.35)', background: 'var(--bg-2)', flexShrink: 0 }}
            />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <span style={{
                background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)',
                borderRadius: 5, padding: '2px 7px', fontSize: '0.58rem', color: 'var(--p3)',
                fontWeight: 700, fontFamily: 'Outfit', letterSpacing: '0.08em'
              }}>PRO</span>
            </div>
          </div>
        )}

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 3, padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
          {[
            { val: progress.topicsLearned.length, label: 'Topics', color: 'var(--p3)', bg: 'rgba(79,70,229,0.08)' },
            { val: progress.quizScores.length, label: 'Quizzes', color: 'var(--accent2)', bg: 'rgba(14,165,233,0.08)' },
            { val: `${progress.streak}d`, label: 'Streak', color: '#6ee7b7', bg: 'rgba(16,185,129,0.08)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', background: s.bg, borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit' }}>{s.val}</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--t3)', marginTop: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '6px 0', overflowY: 'auto' }}>
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <div style={{
                fontSize: '0.58rem', fontWeight: 700, color: 'var(--t3)',
                padding: '14px 22px 5px', letterSpacing: '0.14em', textTransform: 'uppercase',
                opacity: 0.7,
              }}>
                {SECTIONS[section]}
              </div>
              {items.map(item => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false) }}
                    className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                    style={{ textDecoration: 'none', border: 'none' }}
                  >
                    {({ isActive }) => (
                      <>
                        <span style={{
                          flexShrink: 0,
                          color: isActive ? item.color : 'var(--t3)',
                          transition: 'color 0.18s ease',
                          opacity: isActive ? 1 : 0.7,
                        }}>
                          {Icon && <Icon size={16} />}
                        </span>
                        <span style={{ fontSize: '0.855rem' }}>{item.label}</span>
                        {item.path === '/chat' && (
                          <span style={{
                            marginLeft: 'auto',
                            background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)',
                            borderRadius: 5, padding: '1px 6px', fontSize: '0.55rem',
                            color: 'var(--p3)', fontWeight: 700
                          }}>AI</span>
                        )}
                        {item.path === '/saved-notes' && progress.savedNotes.length > 0 && (
                          <span style={{
                            marginLeft: 'auto',
                            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                            borderRadius: 5, padding: '1px 6px', fontSize: '0.55rem',
                            color: 'var(--orange)', fontWeight: 700
                          }}>{progress.savedNotes.length}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
          <button
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 14px',
              borderRadius: 'var(--r-md)', color: '#f87171',
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
              cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.855rem', fontWeight: 500,
              transition: 'all 0.18s ease',
            }}
            onClick={handleLogout}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
