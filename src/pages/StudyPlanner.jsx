import { useState } from 'react'
import { Calendar, Target, Plus, CheckCircle, Circle, Flame, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TOPICS_BY_DAY = [
  ['CNN Basics', 'Activation Functions'],
  ['Backpropagation', 'Optimizers'],
  ['RNNs & LSTMs'],
  ['Attention Mechanism', 'Transformers'],
  ['GANs'],
  ['Practice & Revision'],
  ['Mock Quiz & Review'],
]

export default function StudyPlanner() {
  const { progress, updateProgress, addNotification } = useApp()
  const [newGoal, setNewGoal] = useState('')
  const [hoursTarget, setHoursTarget] = useState(2)

  const addGoal = (e) => {
    e.preventDefault()
    if (!newGoal.trim()) return
    const goals = [...(progress.goals || []), { id: Date.now(), text: newGoal, done: false, created: new Date().toLocaleDateString() }]
    updateProgress({ goals })
    setNewGoal('')
    addNotification('✅ Goal added!')
  }

  const toggleGoal = (id) => {
    const goals = (progress.goals || []).map(g => g.id === id ? { ...g, done: !g.done } : g)
    updateProgress({ goals })
  }

  const removeGoal = (id) => {
    const goals = (progress.goals || []).filter(g => g.id !== id)
    updateProgress({ goals })
  }

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const completedGoals = (progress.goals || []).filter(g => g.done).length
  const totalGoals = (progress.goals || []).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
          Study <span className="text-grad">Planner</span>
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: '0.92rem' }}>Set goals and follow your weekly deep learning curriculum.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {[
          { label: 'Day Streak', value: `${progress.streak} 🔥`, color: 'var(--orange)' },
          { label: 'Goals Done', value: `${completedGoals}/${totalGoals}`, color: 'var(--green)' },
          { label: 'Hours Today', value: `${hoursTarget}h target`, color: 'var(--p2)' },
          { label: 'Topics Left', value: `${Math.max(0, 12 - progress.topicsLearned.length)}`, color: 'var(--accent2)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px', background: 'var(--card-bg)' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'Outfit', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--t2)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Daily Goals */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t1)' }}>
            <Target size={18} color="var(--accent)" /> Daily Goals
          </h2>

          <form onSubmit={addGoal} style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <input
              placeholder="Add a learning goal..."
              value={newGoal}
              onChange={e => setNewGoal(e.target.value)}
              style={{ 
                flex: 1, 
                padding: '10px 14px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                background: 'rgba(15, 23, 42, 0.4)',
                color: 'var(--t1)',
                fontSize: '0.88rem',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--border-bright)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button className="btn btn-primary" type="submit" style={{ padding: '10px 14px', borderRadius: 'var(--r-sm)' }}>
              <Plus size={16} />
            </button>
          </form>

          {/* Progress bar */}
          {totalGoals > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--t2)', marginBottom: 6, fontWeight: 500 }}>
                <span>Goal Completion</span>
                <span>{Math.round((completedGoals / totalGoals) * 100)}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(completedGoals / totalGoals) * 100}%`, background: 'var(--grad)', borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(progress.goals || []).length === 0 ? (
              <p style={{ color: 'var(--t3)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0', fontStyle: 'italic' }}>No goals yet. Add one above!</p>
            ) : (
              (progress.goals || []).map(goal => (
                <div key={goal.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 10, 
                  padding: '10px 14px', 
                  background: 'rgba(15, 23, 42, 0.45)', 
                  borderRadius: 'var(--r-md)', 
                  border: `1px solid ${goal.done ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
                  transition: 'all 0.2s ease'
                }}>
                  <button onClick={() => toggleGoal(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: goal.done ? 'var(--green)' : 'var(--t2)', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center' }}>
                    {goal.done ? <CheckCircle size={18} /> : <Circle size={18} />}
                  </button>
                  <span style={{ flex: 1, fontSize: '0.88rem', color: goal.done ? 'var(--t3)' : 'var(--t1)', textDecoration: goal.done ? 'line-through' : 'none' }}>
                    {goal.text}
                  </span>
                  <button onClick={() => removeGoal(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', opacity: 0.6, transition: 'opacity 0.2s', padding: 0 }} className="hover:opacity-100">
                    <Trash2 size={13} className="hover:text-red-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Roadmap */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t1)' }}>
            <Calendar size={18} color="var(--accent)" /> Weekly Roadmap
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DAYS.map((day, di) => (
              <div key={day} style={{
                padding: '10px 14px', 
                borderRadius: 'var(--r-md)',
                border: `1px solid ${di === todayIdx ? 'var(--border-bright)' : 'var(--border)'}`,
                background: di === todayIdx ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.3)',
                boxShadow: di === todayIdx ? 'var(--glow-p)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--r-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: di === todayIdx ? 'var(--grad)' : 'rgba(255,255,255,0.04)',
                    border: di === todayIdx ? 'none' : '1px solid var(--border)',
                    fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Outfit',
                    color: di === todayIdx ? '#fff' : 'var(--t2)',
                  }}>
                    {day}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TOPICS_BY_DAY[di].map(t => (
                      <span key={t} style={{ 
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 'var(--r-xs)',
                        background: di === todayIdx ? 'rgba(14, 165, 233, 0.12)' : 'rgba(255,255,255,0.04)',
                        border: di === todayIdx ? '1px solid rgba(14, 165, 233, 0.25)' : '1px solid rgba(255,255,255,0.06)',
                        color: di === todayIdx ? 'var(--accent3)' : 'var(--t2)'
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  {di === todayIdx && <Flame size={16} color="var(--orange)" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Study hours slider */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 18, color: 'var(--t1)' }}>Daily Study Target</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <input
            type="range" min={0.5} max={8} step={0.5}
            value={hoursTarget}
            onChange={e => setHoursTarget(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <div style={{ width: 80, textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 950, fontFamily: 'Outfit', color: 'var(--accent2)' }}>{hoursTarget}h</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--t2)', fontWeight: 500 }}>per day</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.75rem', color: 'var(--t3)' }}>
          <span>30 min</span>
          <span style={{ color: 'var(--p3)', fontWeight: 600 }}>{hoursTarget <= 1 ? 'Light study' : hoursTarget <= 3 ? 'Moderate learning' : hoursTarget <= 5 ? 'Intensive deep dive' : '🔥 Beast mode activated!'}</span>
          <span>8 hours</span>
        </div>
      </div>
    </div>
  )
}
