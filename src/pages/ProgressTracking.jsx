import { useEffect, useRef } from 'react'
import { TrendingUp, BookOpen, HelpCircle, Clock, Award } from 'lucide-react'
import { useApp } from '../context/AppContext'

function BarChart({ data, label, color }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div>
      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--t2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140, paddingTop: 10 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--t2)', fontWeight: 600 }}>{d.value}</div>
            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${Math.max((d.value / max) * 100, 4)}px`, background: `linear-gradient(to top, ${color}, ${color}40)`, boxShadow: `0 0 10px ${color}20`, transition: 'height 0.6s var(--ease-spring)' }} />
            <div style={{ fontSize: '0.65rem', color: 'var(--t3)', textAlign: 'center', fontWeight: 500 }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DonutChart({ value, max, label, color }) {
  const pct = Math.min(value / max, 1)
  const r = 44, cx = 55, cy = 55, circ = 2 * Math.PI * r
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={110} height={110}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 6px ${color}50)`, transition: 'stroke-dasharray 0.8s ease' }} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="var(--t1)" fontSize={16} fontWeight={800} fontFamily="Outfit">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div style={{ fontSize: '0.8rem', color: 'var(--t2)', marginTop: 8, fontWeight: 600 }}>{label}</div>
    </div>
  )
}

export default function ProgressTracking() {
  const { progress, quizAccuracy } = useApp()
  const quizData = progress.quizScores.slice(-7).map((s, i) => ({ label: `Q${i + 1}`, value: Math.round((s.score / s.total) * 100) }))
  const demoQuizData = quizData.length > 0 ? quizData : [
    { label: 'Q1', value: 60 }, { label: 'Q2', value: 75 }, { label: 'Q3', value: 70 },
    { label: 'Q4', value: 85 }, { label: 'Q5', value: 90 }, { label: 'Q6', value: 88 }, { label: 'Q7', value: 95 },
  ]
  const weeklyData = [
    { label: 'Wk1', value: 2 }, { label: 'Wk2', value: 5 }, { label: 'Wk3', value: 4 },
    { label: 'Wk4', value: 7 }, { label: 'Wk5', value: progress.topicsLearned.length }, { label: 'Wk6', value: 8 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="animate-reveal-up">
      <div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 2, fontFamily: 'Outfit' }}>Progress <span className="text-grad">Analytics</span></h1>
        <p style={{ color: 'var(--t2)', fontSize: '0.9rem' }}>Real-time synthesis of your sandbox performance metrics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Topics Mastered', value: progress.topicsLearned.length, icon: BookOpen, color: 'var(--p2)' },
          { label: 'Assessments Taken', value: progress.quizScores.length, icon: HelpCircle, color: 'var(--accent)' },
          { label: 'Hours Dedicated', value: progress.hoursStudied.toFixed(1), icon: Clock, color: 'var(--accent2)' },
          { label: 'Notebooks Saved', value: progress.savedNotes.length, icon: Award, color: 'var(--orange)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ padding: 12, borderRadius: 14, background: `${s.color}08`, border: `1px solid ${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.icon size={18} color={s.color} /></div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--t1)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--t2)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}><BarChart data={demoQuizData} label="Quiz Score History (%)" color="var(--p2)" /></div>
        <div className="card" style={{ padding: 24 }}><BarChart data={weeklyData} label="Topics Conquered By Week" color="var(--accent)" /></div>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t2)' }}>Performance Vector Overview</h3>
        <div style={{ display: 'flex', gap: 40, justifyContent: 'space-around', flexWrap: 'wrap' }}>
          <DonutChart value={progress.topicsLearned.length} max={20} label="Curriculum Index" color="var(--p2)" />
          <DonutChart value={quizAccuracy || 75} max={100} label="Assessment Accuracy" color="var(--accent)" />
          <DonutChart value={Math.min(progress.hoursStudied, 50)} max={50} label="Target Engagement" color="var(--accent2)" />
          <DonutChart value={progress.savedNotes.length} max={20} label="Library Coefficient" color="var(--orange)" />
        </div>
      </div>

      {progress.topicsLearned.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', color: 'var(--t2)', letterSpacing: '0.08em' }}>
            <TrendingUp size={16} color="var(--green)" /> Mastered Fields Matrix ({progress.topicsLearned.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {progress.topicsLearned.map(t => (
              <span
                key={t}
                className="badge badge-green"
                style={{
                  fontSize: '0.78rem',
                  padding: '6px 14px',
                  borderRadius: 99,
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: 'var(--green)',
                  fontWeight: 600,
                  fontFamily: 'Inter'
                }}
              >
                ✓ {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
