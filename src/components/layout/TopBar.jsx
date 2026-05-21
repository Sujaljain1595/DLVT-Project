import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, Search, Bell, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

export default function TopBar({ title }) {
  const { setSidebarOpen, notifications } = useApp()
  const { user, isMock } = useAuth()
  const [search, setSearch] = useState('')
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const notifRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/learn?q=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  const PAGE_SUBTITLES = {
    '/dashboard': 'Your AI Learning Hub',
    '/learn': 'AI-Powered Curriculum Generator',
    '/notes': 'Smart Notes from Any Topic',
    '/quiz': 'Adaptive AI Quiz Engine',
    '/flashcards': 'Spaced Repetition Learning',
    '/visualizations': 'Interactive Deep Learning Diagrams',
    '/code': 'PyTorch Code Playground',
    '/chat': '24/7 AI Deep Learning Tutor',
    '/planner': 'Organize Your Learning Journey',
    '/progress': 'Analytics & Performance Tracking',
    '/saved-notes': 'Your Personal Notes Library',
    '/settings': 'Account & Preferences',
  }

  return (
    <header className="topbar">
      {/* Menu toggle */}
      <button
        style={{
          background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer',
          padding: 6, flexShrink: 0, borderRadius: 'var(--r-sm)',
          transition: 'color 0.15s ease',
        }}
        onClick={() => setSidebarOpen(s => !s)}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--t1)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--t2)'}
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Title block */}
      <div style={{ marginRight: 'auto', minWidth: 0 }}>
        <div style={{
          fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', color: 'var(--t1)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          letterSpacing: '-0.02em',
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '0.65rem', color: 'var(--t3)', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.02em',
        }}>
          {PAGE_SUBTITLES[location.pathname] || 'Deep Learning Virtual Teacher'}
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="topbar-search">
        <Search size={14} color="var(--t3)" style={{ flexShrink: 0 }} />
        <input
          id="topbar-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search any DL topic..."
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--t1)', fontSize: '0.82rem', width: '100%',
          }}
        />
        {search && (
          <button type="button" onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', padding: 0 }}>
            <X size={13} />
          </button>
        )}
      </form>

      {/* Preview Session Indicator */}
      {isMock && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 99,
          background: 'rgba(234,179,8,0.06)',
          border: '1px solid rgba(234,179,8,0.2)',
          color: '#fef08a',
          fontSize: '0.72rem',
          fontWeight: 600,
          fontFamily: 'Outfit',
          letterSpacing: '0.02em',
          marginRight: 8,
          flexShrink: 0
        }} title="To enable live authentication with verified email OTP codes, add a valid VITE_CLERK_PUBLISHABLE_KEY inside your .env file.">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#eab308', display: 'inline-block', boxShadow: '0 0 8px #eab308' }} />
          Preview Mode
        </div>
      )}

      {/* Notifications */}
      <div style={{ position: 'relative', flexShrink: 0 }} ref={notifRef}>
        <button
          id="topbar-notifications"
          style={{
            background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer',
            padding: 6, position: 'relative', borderRadius: 'var(--r-sm)',
            transition: 'all 0.15s',
          }}
          onClick={() => setShowNotifDropdown(s => !s)}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.background = 'none' }}
        >
          <Bell size={19} />
          {notifications.length > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2, width: 8, height: 8,
              background: 'var(--accent)', borderRadius: '50%',
              border: '2px solid var(--bg-0)',
              boxShadow: '0 0 8px rgba(14,165,233,0.5)',
            }} />
          )}
        </button>

        {/* Notification dropdown */}
        {showNotifDropdown && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 8,
            width: 300, background: 'rgba(11,17,32,0.96)', border: '1px solid var(--border)',
            borderRadius: 16, boxShadow: 'var(--shadow-xl)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            zIndex: 200, overflow: 'hidden', animation: 'scale-in 0.2s var(--ease-out)',
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Outfit' }}>Notifications</span>
              {notifications.length > 0 && (
                <span style={{
                  background: 'rgba(79,70,229,0.2)', color: 'var(--p3)',
                  borderRadius: 99, padding: '1px 8px', fontSize: '0.68rem', fontWeight: 700
                }}>{notifications.length}</span>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--t3)', fontSize: '0.82rem' }}>
                <Bell size={22} style={{ margin: '0 auto 8px', opacity: 0.25 }} />
                No notifications yet
              </div>
            ) : (
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '11px 16px', borderBottom: '1px solid var(--border-soft)',
                    fontSize: '0.82rem', color: 'var(--t2)',
                    transition: 'background 0.12s ease',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {n.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Avatar */}
      <img
        src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
        alt="avatar"
        style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid rgba(99,102,241,0.3)', cursor: 'pointer', background: 'var(--bg-2)',
          boxShadow: '0 0 12px rgba(79,70,229,0.2)', flexShrink: 0,
          transition: 'all 0.2s var(--ease-smooth)',
        }}
        onClick={() => navigate('/settings')}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(79,70,229,0.4)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
          e.currentTarget.style.boxShadow = '0 0 12px rgba(79,70,229,0.2)'
        }}
      />
    </header>
  )
}
