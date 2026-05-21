import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { BookOpen, Brain, Code2, BarChart2, HelpCircle, Loader2, Send, RotateCcw, Bookmark, CheckCircle, Sparkles, Map } from 'lucide-react'
import { api } from '../services/api'
import { useApp } from '../context/AppContext'
import { TOPICS, DIFFICULTIES } from '../utils/constants'
import UniversalGraphViz from './UniversalGraphViz'

const TABS = [
  { id: 'plan',          label: 'Roadmap',     icon: Map },
  { id: 'content',       label: 'Explanation', icon: Brain },
  { id: 'code',          label: 'Code Sandbox', icon: Code2 },
  { id: 'visualization', label: 'Visualizer',  icon: BarChart2 },
  { id: 'quiz',          label: 'Quiz Hub',    icon: HelpCircle },
]

const CATEGORY_TOPICS = {
  'Architectures':   ['Convolutional Neural Networks (CNN)', 'Recurrent Neural Networks (RNN)', 'Transformers & Attention', 'BERT & GPT Architecture'],
  'Training':        ['Backpropagation', 'Gradient Descent', 'Batch Normalization', 'Dropout & Regularization'],
  'Advanced Models': ['Generative Adversarial Networks (GAN)', 'Diffusion Models', 'Autoencoders', 'Graph Neural Networks'],
  'Applications':    ['Transfer Learning', 'Natural Language Processing', 'Reinforcement Learning', 'Object Detection'],
}

function parseQuiz(value) {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'string') return []
  const clean = value.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
  try {
    const parsed = JSON.parse(clean)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function LearnQuiz({ value }) {
  const questions = parseQuiz(value)
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    setAnswers({})
  }, [value])

  if (!questions.length) {
    return <ReactMarkdown>{value || '*No quiz generated for this section.*'}</ReactMarkdown>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-reveal-up">
      {questions.map((q, qIndex) => {
        const selected = answers[qIndex]
        const answered = selected !== undefined
        return (
          <div key={qIndex} className="card" style={{ padding: 24, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: 16, lineHeight: 1.5, color: 'var(--t1)' }}>Q{qIndex + 1}. {q.q}</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {(q.options || []).map((opt, optIndex) => {
                const isCorrect = optIndex === q.answer
                const isSelected = optIndex === selected
                const border = answered && isCorrect ? 'var(--green)' : answered && isSelected ? 'var(--red)' : 'var(--border)'
                const bg = answered && isCorrect ? 'rgba(16,185,129,0.08)' : answered && isSelected ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.01)'
                return (
                  <button
                    key={optIndex}
                    type="button"
                    onClick={() => setAnswers(prev => ({ ...prev, [qIndex]: optIndex }))}
                    disabled={answered}
                    style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: `1px solid ${border}`,
                      background: bg,
                      color: 'var(--t1)',
                      cursor: answered ? 'default' : 'pointer',
                      fontFamily: 'Inter',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      if (!answered) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'
                    }}
                    onMouseLeave={e => {
                      if (!answered) e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                  >
                    <strong style={{ color: 'var(--accent)', marginRight: 10 }}>{['A', 'B', 'C', 'D'][optIndex] || optIndex + 1}.</strong>
                    {opt}
                  </button>
                )
              })}
            </div>
            {answered && q.explanation && (
              <p style={{ marginTop: 16, color: 'var(--t2)', fontSize: '0.88rem', lineHeight: 1.6, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, borderLeft: `3px solid ${selected === q.answer ? 'var(--green)' : 'var(--red)'}` }}>
                <strong style={{ color: selected === q.answer ? 'var(--green)' : '#fca5a5', marginRight: 6 }}>
                  {selected === q.answer ? '✓ Correct:' : '✗ Review:'}
                </strong> {q.explanation}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function LearnVisual({ results, topic }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-reveal-up">
      {results.visualization_graph && (
        <UniversalGraphViz data={results.visualization_graph} topic={topic} />
      )}
      <div className="card" style={{ padding: 24, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)' }}>
        <ReactMarkdown>{results.visualization || '*No visualization details generated for this section.*'}</ReactMarkdown>
      </div>
    </div>
  )
}

export default function LearnTopic() {
  const [params] = useSearchParams()
  const { addTopic, addNotification, addTopicLearned, saveNote } = useApp()
  const [topic, setTopic]       = useState(params.get('q') || '')
  const [difficulty, setDiff]   = useState('beginner')
  const [loading, setLoading]   = useState(false)
  const [results, setResults]   = useState(null)
  const [activeTab, setActiveTab] = useState('plan')
  const [error, setError]       = useState('')
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    const q = params.get('q')
    if (q) setTopic(q)
  }, [params])

  const handleLearn = async (e) => {
    e?.preventDefault()
    if (!topic.trim()) return
    setLoading(true); setError(''); setResults(null); setSaved(false)
    try {
      const data = await api.teach(topic.trim(), difficulty)
      setResults(data.results)
      addTopic(topic.trim())
      addNotification(`✅ "${topic}" session complete!`, 'success')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const [quizLoading, setQuizLoading] = useState(false)
  const DIFF_COLORS = { beginner: 'var(--green)', intermediate: 'var(--orange)', advanced: 'var(--accent)' }

  const regenerateQuiz = async () => {
    if (!topic || quizLoading) return
    setQuizLoading(true)
    try {
      const data = await api.quiz(topic, 'mcq', difficulty, 5)
      if (data && data.questions) {
        setResults(prev => ({
          ...prev,
          quiz: data.questions
        }))
        addNotification('✨ New questions generated!', 'success')
      }
    } catch (err) {
      addNotification('Failed to generate new questions.', 'error')
    } finally {
      setQuizLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: '100%', margin: '0 auto' }} className="animate-reveal-up">
      <div style={{ borderBottom: '1px solid var(--border-soft)', paddingBottom: 20 }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 10, letterSpacing: '-0.04em', lineHeight: 1.1, fontFamily: 'Outfit' }}>
          Explore the <span className="text-grad">Mathematical Architecture</span>
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: '1rem', maxWidth: 800, lineHeight: 1.6 }}>
          Master complex deep learning modules through beautiful roadmaps, PyTorch templates, and custom interactive visuals.
        </p>
      </div>

      {/* Input */}
      <div className="card" style={{ padding: '32px', borderRadius: 'var(--r-xl)', background: 'linear-gradient(135deg, rgba(79,70,229,0.06) 0%, rgba(14,165,233,0.02) 100%)', border: '1px solid var(--border)' }}>
        <form onSubmit={handleLearn} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ flex: 1, minWidth: 300, position: 'relative' }}>
            <Brain size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
            <input
              id="learn-topic-input"
              className="input"
              style={{ paddingLeft: 46, height: 50, fontSize: '1rem', borderRadius: 14, background: 'rgba(7,11,20,0.5)', border: '1px solid var(--border)' }}
              placeholder="What topic do you want to explore? (e.g. Transformers, GANs, CNNs...)"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              list="topic-suggestions"
            />
            <datalist id="topic-suggestions">
              {TOPICS.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {DIFFICULTIES.map(d => (
              <button key={d} type="button"
                onClick={() => setDiff(d)}
                style={{
                  padding: '0 16px', borderRadius: 12, border: `1px solid ${difficulty === d ? DIFF_COLORS[d] : 'var(--border)'}`,
                  background: difficulty === d ? `${DIFF_COLORS[d]}15` : 'rgba(7,11,20,0.3)',
                  color: difficulty === d ? DIFF_COLORS[d] : 'var(--t2)',
                  fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  height: 50
                }}>{d.charAt(0).toUpperCase() + d.slice(1)}</button>
            ))}
          </div>

          <button id="learn-submit" className="btn btn-primary" type="submit"
            disabled={loading || !topic.trim()} style={{ height: 50, padding: '0 28px', fontSize: '0.95rem', borderRadius: 12, boxShadow: 'var(--glow-p)' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Explore Concept</>}
          </button>
          {results && (
            <button type="button" className="btn btn-ghost" onClick={() => { setResults(null); setTopic('') }} style={{ height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <RotateCcw size={16} /> Reset
            </button>
          )}
        </form>

        {/* Topic category chips */}
        {!results && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(CATEGORY_TOPICS).map(([cat, topics]) => (
              <div key={cat}>
                <div style={{ fontSize: '0.68rem', color: 'var(--t2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{cat}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {topics.map(t => (
                    <button key={t} onClick={() => setTopic(t)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 99,
                        border: '1px solid var(--border)',
                        background: topic === t ? 'rgba(99,102,241,0.08)' : 'rgba(7,11,20,0.3)',
                        color: topic === t ? 'var(--accent2)' : 'var(--t2)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: 'Inter',
                        fontWeight: 500,
                      }}
                      onMouseEnter={e => {
                        if (topic !== t) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'
                      }}
                      onMouseLeave={e => {
                        if (topic !== t) e.currentTarget.style.borderColor = 'var(--border)'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="card" style={{ border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '18px 24px', background: 'rgba(239,68,68,0.05)', color: '#fca5a5' }}>
          <strong style={{ fontSize: '0.95rem' }}>Connection Timeout</strong>
          <p style={{ fontSize: '0.85rem', marginTop: 6, opacity: 0.9, lineHeight: 1.5 }}>The AI sandbox environment appears to be offline. Make sure the teaching backend server is running locally.</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card" style={{ padding: 56, textAlign: 'center', background: 'rgba(15,23,42,0.4)' }}>
          <div className="animate-glow" style={{ display: 'inline-flex', background: 'var(--grad)', borderRadius: 20, padding: 18, marginBottom: 24, boxShadow: 'var(--glow-p)' }}>
            <Brain size={36} color="#fff" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: 8, fontWeight: 700, fontFamily: 'Outfit' }}>Curating specialized curriculum...</h3>
          <p style={{ color: 'var(--t2)', fontSize: '0.92rem', marginBottom: 28 }}>
            Formulating mathematically rigorous roadmap for <strong style={{ color: 'var(--accent3)' }}>{topic}</strong>
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['📋 Structuring curriculum', '✍️ Synthesizing mathematical explanations', '💻 Formulating PyTorch templates', '📊 Constructing layer graphs', '❓ Preparing adaptive assessments'].map((s, i) => (
              <div key={s} className="badge badge-indigo" style={{ animationDelay: `${i * 0.4}s`, fontSize: '0.78rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--p4)', padding: '6px 14px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={12} className="animate-spin" /> {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fade-in 0.6s ease' }}>
          {/* Topic header */}
          <div className="card" style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 24, background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(14,165,233,0.04) 100%)', border: '1px solid var(--border-bright)', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <span style={{
                marginBottom: 8,
                fontSize: '0.7rem',
                fontWeight: 700,
                color: DIFF_COLORS[difficulty],
                border: `1px solid ${DIFF_COLORS[difficulty]}30`,
                background: `${DIFF_COLORS[difficulty]}10`,
                padding: '4px 12px',
                borderRadius: 99,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'inline-block'
              }}>{difficulty} Level</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'Outfit' }}>{topic}</h2>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                className="btn btn-ghost" 
                style={{ gap: 8, fontSize: '0.88rem', height: 44, padding: '0 20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }} 
                onClick={() => { 
                  setSaved(true); 
                  addTopicLearned(topic);
                  if (results?.content) {
                    saveNote({ topic, type: 'detailed', content: results.content });
                  }
                  addNotification('📌 Topic saved to your library!', 'success');
                }}
              >
                {saved ? <CheckCircle size={16} color="var(--green)" /> : <Bookmark size={16} />}
                {saved ? 'Saved to Library' : 'Save to Library'}
              </button>
              <button className="btn btn-ghost" style={{ gap: 8, fontSize: '0.88rem', height: 44, padding: '0 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }} onClick={() => { setResults(null); setTopic('') }}>
                <RotateCcw size={16} /> New Topic
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, padding: '6px', background: 'rgba(7,11,20,0.5)', borderRadius: 18, border: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {TABS.filter(t => results[t.id] || (t.id === 'visualization' && results.visualization_graph)).map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{
                  flex: 1, padding: '12px 18px', borderRadius: 12, border: 'none',
                  background: activeTab === t.id ? 'var(--grad)' : 'transparent',
                  color: activeTab === t.id ? '#fff' : 'var(--t2)',
                  fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: activeTab === t.id ? 'var(--glow-p)' : 'none',
                  transform: activeTab === t.id ? 'scale(1.01)' : 'scale(1)',
                }}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="card" style={{ padding: '36px 40px', minHeight: 500, background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border)' }}>
            <div className="md" style={{ maxWidth: '100%' }}>
              {activeTab === 'quiz'
                ? <LearnQuiz value={results.quiz} />
                : activeTab === 'visualization'
                  ? <LearnVisual results={results} topic={topic} />
                  : <ReactMarkdown>{results[activeTab] || '*No content generated for this section.*'}</ReactMarkdown>}
            </div>
            {activeTab === 'quiz' && (
              <div style={{ marginTop: 36, display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={regenerateQuiz}
                  disabled={quizLoading}
                  className="btn btn-primary" 
                  style={{ padding: '0 32px', height: 48, fontSize: '1rem', gap: 10, borderRadius: 14, minWidth: 220, boxShadow: 'var(--glow-p)' }}
                >
                  {quizLoading ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                  {quizLoading ? 'Regenerating...' : 'Refresh Assessments'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
