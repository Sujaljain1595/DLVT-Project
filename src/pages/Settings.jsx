import { useState } from 'react'
import { User, Mail, Lock, Bell, Palette, Trash2, Save, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { clearProgress } from '../services/storage'
import { DIFFICULTIES } from '../utils/constants'

export default function Settings() {
  const { user, clerkUser } = useAuth()
  const { updateProgress, progress, addNotification } = useApp()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    firstName: user?.firstName || user?.username?.split(' ')[0] || '',
    lastName: user?.lastName || user?.username?.split(' ').slice(1).join(' ') || '',
    email: user?.email || ''
  })
  const [prefs, setPrefs] = useState({ difficulty: 'beginner', notifications: true, theme: 'dark' })

  const saveProfile = async () => {
    setSaved(false)
    try {
      if (clerkUser) {
        await clerkUser.update({
          firstName: form.firstName,
          lastName: form.lastName,
        })
      } else {
        const stored = localStorage.getItem('dlvt_user')
        if (stored) {
          const parsed = JSON.parse(stored)
          const updated = {
            ...parsed,
            firstName: form.firstName,
            lastName: form.lastName,
            username: [form.firstName, form.lastName].filter(Boolean).join(' ') || 'AI Learner'
          }
          localStorage.setItem('dlvt_user', JSON.stringify(updated))
          const users = JSON.parse(localStorage.getItem('dlvt_users') || '[]')
          const updatedUsers = users.map(u => u.email === form.email ? { ...u, firstName: form.firstName, lastName: form.lastName, username: updated.username } : u)
          localStorage.setItem('dlvt_users', JSON.stringify(updatedUsers))
        }
      }
      setSaved(true)
      addNotification('✅ Profile settings saved!')
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      addNotification(`❌ Error: ${err.message || 'Failed to update profile'}`, 'error')
    }
  }

  const clearData = () => {
    if (window.confirm('This will clear all your progress data. Are you sure?')) {
      clearProgress()
      addNotification('🗑️ Progress data cleared', 'warn')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680, paddingBottom: 32 }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
          <span className="text-grad">Settings</span>
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: '0.92rem' }}>Manage your account and learning preferences.</p>
      </div>

      {/* Profile */}
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t1)' }}>
          <User size={18} color="var(--accent)" /> Profile
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <img src={user?.avatar} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid var(--accent2)', background: 'var(--bg-2)', boxShadow: 'var(--glow-a)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--t1)' }}>{user?.username}</div>
            <div style={{ color: 'var(--t2)', fontSize: '0.85rem', marginBottom: 4 }}>{user?.email}</div>
            <div style={{ 
              display: 'inline-block', 
              padding: '3px 10px', 
              borderRadius: 'var(--r-xs)', 
              fontSize: '0.72rem', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              background: 'rgba(14, 165, 233, 0.12)', 
              border: '1px solid rgba(14, 165, 233, 0.25)', 
              color: 'var(--accent2)', 
              marginTop: 4, 
              width: 'fit-content'
            }}>
              AI Learner
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>First Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                <input 
                  style={{ 
                    width: '100%',
                    padding: '10px 14px 10px 40px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: 'rgba(15, 23, 42, 0.4)',
                    color: 'var(--t1)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }} 
                  value={form.firstName} 
                  onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Last Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                <input 
                  style={{ 
                    width: '100%',
                    padding: '10px 14px 10px 40px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: 'rgba(15, 23, 42, 0.4)',
                    color: 'var(--t1)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }} 
                  value={form.lastName} 
                  onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Email Address (Read Only)</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
              <input 
                style={{ 
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'rgba(15, 23, 42, 0.15)',
                  color: 'var(--t3)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                  cursor: 'not-allowed',
                }} 
                value={form.email} 
                readOnly
              />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: 'fit-content', padding: '8px 20px', borderRadius: 'var(--r-sm)', marginTop: 8 }} onClick={saveProfile}>
            {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Profile</>}
          </button>
        </div>
      </div>

      {/* Learning Preferences */}
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t1)' }}>
          <Palette size={18} color="var(--accent)" /> Learning Preferences
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--t2)', marginBottom: 8, display: 'block', fontWeight: 600 }}>Default Difficulty</label>
            <div style={{ 
              display: 'flex', 
              gap: 8,
              background: 'var(--bg-1)',
              padding: 4,
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)'
            }}>
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setPrefs(p => ({ ...p, difficulty: d }))}
                  style={{ 
                    flex: 1, 
                    padding: '8px 12px', 
                    borderRadius: 'var(--r-sm)', 
                    border: `1px solid ${prefs.difficulty === d ? 'var(--border-bright)' : 'transparent'}`, 
                    background: prefs.difficulty === d ? 'rgba(99, 102, 241, 0.12)' : 'transparent', 
                    color: prefs.difficulty === d ? 'var(--p3)' : 'var(--t2)', 
                    fontFamily: 'Outfit', 
                    fontSize: '0.82rem', 
                    fontWeight: 600, 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease' 
                  }}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(15, 23, 42, 0.45)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Bell size={18} color="var(--accent2)" />
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--t1)' }}>Notifications</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--t2)' }}>Study reminders and progress alerts</div>
              </div>
            </div>
            <div onClick={() => setPrefs(p => ({ ...p, notifications: !p.notifications }))}
              style={{ width: 44, height: 24, borderRadius: 99, background: prefs.notifications ? 'var(--accent)' : 'rgba(255,255,255,0.08)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: prefs.notifications ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Stats Summary */}
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 18, color: 'var(--t1)' }}>Your Learning Stats</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Topics Learned', value: progress.topicsLearned.length },
            { label: 'Quizzes Taken', value: progress.quizScores.length },
            { label: 'Notes Saved', value: progress.savedNotes.length },
            { label: 'Flashcards Set', value: progress.flashcards.length },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 18px', background: 'rgba(15, 23, 42, 0.45)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--accent2)' }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--t2)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ padding: 28, border: '1px solid rgba(239, 68, 68, 0.15)', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.04)' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12, color: 'var(--red)' }}>
          Danger Zone
        </h2>
        <p style={{ color: 'var(--t2)', fontSize: '0.88rem', marginBottom: 18, lineHeight: 1.5 }}>
          Permanently clear all your progress data including topics, quiz scores, notes, and chat history. This action cannot be undone.
        </p>
        <button
          style={{ 
            background: 'rgba(239,68,68,0.06)', 
            border: '1px solid rgba(239,68,68,0.2)', 
            color: 'var(--red)', 
            padding: '10px 20px', 
            borderRadius: 'var(--r-md)', 
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontFamily: 'Outfit',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s ease'
          }}
          onClick={clearData}
          onMouseEnter={e => {
            e.target.style.background = 'rgba(239,68,68,0.12)'
            e.target.style.borderColor = 'rgba(239,68,68,0.4)'
          }}
          onMouseLeave={e => {
            e.target.style.background = 'rgba(239,68,68,0.06)'
            e.target.style.borderColor = 'rgba(239,68,68,0.2)'
          }}
        >
          <Trash2 size={15} /> Clear All Progress Data
        </button>
      </div>
    </div>
  )
}
