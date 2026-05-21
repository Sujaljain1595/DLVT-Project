import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import {
  BookOpen, HelpCircle, FileText, Code2, TrendingUp, Zap,
  Clock, Target, Flame, ChevronRight, MessageSquare,
  Layers, Brain, Trophy, Star, Sparkles, ArrowUpRight
} from 'lucide-react'

const RECOMMENDED = [
  { topic: 'Convolutional Neural Networks', badge: 'Beginner', color: 'var(--green)', emoji: '🖼️' },
  { topic: 'Transformers & Attention',      badge: 'Intermediate', color: 'var(--orange)', emoji: '🤖' },
  { topic: 'Diffusion Models',              badge: 'Advanced', color: 'var(--accent)', emoji: '✨' },
  { topic: 'Backpropagation',               badge: 'Fundamental', color: 'var(--p2)', emoji: '⚡' },
  { topic: 'GANs',                          badge: 'Intermediate', color: 'var(--accent2)', emoji: '🎨' },
]

const QUICK_ACTIONS = [
  { label: 'Learn a Topic',  icon: BookOpen,      path: '/learn',          color: 'var(--p2)',    bg: 'rgba(99,102,241,0.06)',   desc: 'AI explanations + quiz' },
  { label: 'Take a Quiz',    icon: HelpCircle,    path: '/quiz',           color: 'var(--accent)',bg: 'rgba(14,165,233,0.06)',  desc: 'Test your knowledge' },
  { label: 'Gen Notes',      icon: FileText,      path: '/notes',          color: 'var(--accent2)',bg: 'rgba(56,189,248,0.06)',   desc: 'Smart note generator' },
  { label: 'Flashcards',     icon: Layers,        path: '/flashcards',     color: 'var(--orange)',bg: 'rgba(245,158,11,0.05)',  desc: 'Flip-card learning' },
  { label: 'Code Playground',icon: Code2,         path: '/code',           color: 'var(--green)', bg: 'rgba(16,185,129,0.05)',  desc: 'PyTorch templates' },
  { label: 'AI Chat Mentor', icon: MessageSquare, path: '/chat',           color: 'var(--p3)',    bg: 'rgba(129,140,248,0.06)', desc: 'Ask your AI tutor' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { progress, quizAccuracy } = useApp()
  const navigate = useNavigate()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙'

  const stats = [
    { label: 'Topics Learned',  value: progress.topicsLearned.length, icon: BookOpen,   color: 'var(--p2)',    glow: 'rgba(99,102,241,0.08)',  path: '/progress' },
    { label: 'Hours Studied',   value: progress.hoursStudied.toFixed(1), icon: Clock,   color: 'var(--accent)',  glow: 'rgba(14,165,233,0.08)',   path: '/progress' },
    { label: 'Quiz Accuracy',   value: `${quizAccuracy}%`, icon: Target,                color: 'var(--green)', glow: 'rgba(16,185,129,0.08)',  path: '/quiz' },
    { label: 'Day Streak',      value: `${progress.streak}`, icon: Flame,               color: 'var(--orange)', glow: 'rgba(245,158,11,0.08)', path: '/progress', suffix: '🔥' },
  ]

  const recentActivity = [
    ...progress.topicsLearned.slice(-3).reverse().map(t => ({ type: 'learn', text: `Learned: ${t}`, time: 'recently', color: 'var(--p2)' })),
    ...progress.quizScores.slice(-3).reverse().map(q => ({ type: 'quiz', text: `Quiz: ${q.topic} — ${q.score}/${q.total}`, time: new Date(q.date).toLocaleDateString(), color: 'var(--accent)' })),
    ...progress.savedNotes.slice(-2).map(n => ({ type: 'note', text: `Saved: ${n.topic || 'Notes'}`, time: new Date(n.savedAt).toLocaleDateString(), color: 'var(--accent2)' })),
  ].slice(0, 6)

  // Dynamic achievements based on progress
  const dynamicAchievements = [
    { label: 'First Topic',  icon: '🎯', unlocked: progress.topicsLearned.length >= 1 },
    { label: 'Quiz Master',  icon: '🏆', unlocked: progress.quizScores.length >= 3 },
    { label: 'Note Taker',   icon: '📝', unlocked: progress.savedNotes.length >= 1 },
    { label: '7-Day Streak', icon: '🔥', unlocked: progress.streak >= 7 },
    { label: 'Code Wizard',  icon: '💻', unlocked: false },
    { label: 'Deep Expert',  icon: '🧠', unlocked: progress.topicsLearned.length >= 10 },
  ]
  const unlockedCount = dynamicAchievements.filter(a => a.unlocked).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="animate-reveal-up">

      {/* Hero Greeting */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(14,165,233,0.04) 50%, rgba(15,23,42,0.4) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.03)'
      }}>
        {/* Ambient background glow */}
        <div style={{ position: 'absolute', top: -80, right: -40, width: 300, height: 300, background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: 100, width: 200, height: 200, background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(20px)' }} />
        
        <div style={{ zIndex: 1, position: 'relative' }}>
          <p style={{ color: 'var(--accent)', fontSize: '0.78rem', marginBottom: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{greetingEmoji} {greeting}</p>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: 8, lineHeight: 1.1, fontFamily: 'Outfit', letterSpacing: '-0.04em' }}>
            Welcome back, <span className="text-grad">{user?.username}!</span>
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: '0.95rem', fontWeight: 400, maxWidth: 500 }}>
            {progress.topicsLearned.length === 0
              ? "Ready to explore the mathematical beauty of deep neural networks? Let's begin."
              : `You've conquered ${progress.topicsLearned.length} topic${progress.topicsLearned.length !== 1 ? 's' : ''} on your journey to mastery.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', zIndex: 1, position: 'relative' }}>
          <button className="btn btn-primary" onClick={() => navigate('/learn')} style={{ padding: '12px 24px', boxShadow: 'var(--glow-p)' }}>
            <Zap size={16} /> Start Learning
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/chat')} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
            <Brain size={16} /> Ask AI Mentor
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {stats.map(s => (
          <div
            key={s.label}
            className="card"
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer' }}
            onClick={() => navigate(s.path)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--t2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
              <div style={{ padding: 10, borderRadius: 12, background: `${s.glow}`, border: `1px solid ${s.color}15` }}>
                <s.icon size={16} color={s.color} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--t1)', lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</div>
              {s.suffix && <span style={{ fontSize: '1.2rem', color: s.color }}>{s.suffix}</span>}
            </div>
            <div style={{ height: 4, background: 'var(--border-soft)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '65%', background: `linear-gradient(90deg, ${s.color}, var(--bg-3))`, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="var(--accent)" /> Premium Sandbox Modules
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className="card"
              style={{
                padding: '24px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                background: 'rgba(15,23,42,0.3)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                transition: 'all 0.3s var(--ease-spring)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.boxShadow = 'var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.04)'
              }}
            >
              <div style={{ position: 'absolute', top: 12, right: 12, color: 'var(--t3)' }}>
                <ArrowUpRight size={14} />
              </div>
              <div style={{
                padding: 12,
                borderRadius: 14,
                background: a.bg,
                border: `1px solid ${a.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <a.icon size={20} color={a.color} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--t1)' }}>{a.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--t2)', lineHeight: 1.3 }}>{a.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom 3-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

        {/* Recent Activity */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--p2)" /> Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t3)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <BookOpen size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
              <p style={{ fontSize: '0.85rem' }}>No recent activity. Start exploring a module!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {recentActivity.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'rgba(7,11,20,0.4)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, boxShadow: `0 0 8px ${a.color}`, flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{a.text}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--t2)' }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Topics */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="var(--accent)" /> Curriculum Highlights
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RECOMMENDED.map(r => (
              <button
                key={r.topic}
                onClick={() => navigate(`/learn?q=${encodeURIComponent(r.topic)}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  background: 'rgba(7,11,20,0.4)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'
                  e.currentTarget.style.background = 'rgba(99,102,241,0.03)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'rgba(7,11,20,0.4)'
                }}
              >
                <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--t1)', fontWeight: 600 }}>{r.topic}</p>
                  <span style={{ fontSize: '0.72rem', color: r.color, fontWeight: 700 }}>{r.badge}</span>
                </div>
                <ChevronRight size={14} color="var(--t2)" />
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Panel */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={18} color="var(--orange)" /> Achievements
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--t2)', marginBottom: 14 }}>{unlockedCount} of {dynamicAchievements.length} completed</p>

          {/* Achievement progress bar */}
          <div style={{ height: 5, background: 'var(--border-soft)', borderRadius: 99, marginBottom: 18, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(unlockedCount / dynamicAchievements.length) * 100}%`, background: 'linear-gradient(90deg, var(--p2), var(--accent))', borderRadius: 99, transition: 'width 0.6s var(--ease-spring)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
            {dynamicAchievements.map(a => (
              <div
                key={a.label}
                style={{
                  padding: '12px 10px',
                  borderRadius: 12,
                  border: `1px solid ${a.unlocked ? 'rgba(99,102,241,0.2)' : 'var(--border)'}`,
                  background: a.unlocked ? 'rgba(99,102,241,0.04)' : 'rgba(7,11,20,0.2)',
                  textAlign: 'center',
                  opacity: a.unlocked ? 1 : 0.45,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: 6, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
                <div style={{ fontSize: '0.72rem', color: a.unlocked ? 'var(--t1)' : 'var(--t2)', fontWeight: 600, lineHeight: 1.2 }}>{a.label}</div>
              </div>
            ))}
          </div>

          <button
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: 18, fontSize: '0.8rem', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
            onClick={() => navigate('/progress')}
          >
            View All Progress <ArrowUpRight size={14} />
          </button>
        </div>

      </div>

      {/* Mastered topics chips */}
      {progress.topicsLearned.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={16} color="var(--green)" /> Mastered Fields ({progress.topicsLearned.length})
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {progress.topicsLearned.map(t => (
              <button
                key={t}
                onClick={() => navigate(`/learn?q=${encodeURIComponent(t)}`)}
                className="badge badge-green"
                style={{
                  fontSize: '0.78rem',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  borderRadius: 99,
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: 'var(--green)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(16,185,129,0.14)'
                  e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(16,185,129,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'
                }}
              >
                ✓ {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
