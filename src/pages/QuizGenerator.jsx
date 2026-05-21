import { useState } from 'react'
import { HelpCircle, Loader2, ChevronRight, CheckCircle, XCircle, Timer, Trophy, RotateCcw } from 'lucide-react'
import { api } from '../services/api'
import { useApp } from '../context/AppContext'
import { DIFFICULTIES, QUIZ_TYPES } from '../utils/constants'

function generateFallbackQuiz(topic, type) {
  const mcqs = [
    { q: `What is the primary purpose of ${topic}?`, options: ['Feature extraction', 'Data augmentation', 'Model compression', 'Weight initialization'], answer: 0, explanation: `${topic} is primarily used for feature extraction and learning representations.` },
    { q: `Which activation function is most commonly used in ${topic}?`, options: ['Sigmoid', 'ReLU', 'Tanh', 'Softmax'], answer: 1, explanation: 'ReLU (Rectified Linear Unit) is most common due to its simplicity and effectiveness.' },
    { q: `What problem does ${topic} solve?`, options: ['Overfitting', 'Learning complex patterns', 'Data preprocessing', 'Model deployment'], answer: 1, explanation: `${topic} solves the problem of learning complex, hierarchical patterns from raw data.` },
    { q: `Which optimizer is typically used with ${topic}?`, options: ['SGD only', 'Adam', 'Adagrad', 'All of the above'], answer: 3, explanation: 'Various optimizers work with neural networks; Adam is most commonly used.' },
    { q: `What is the role of backpropagation in ${topic}?`, options: ['Forward pass', 'Computing gradients', 'Data loading', 'Model evaluation'], answer: 1, explanation: 'Backpropagation computes gradients of the loss w.r.t. all weights using the chain rule.' },
  ]
  return mcqs
}

export default function QuizGenerator() {
  const { addQuizScore, addNotification } = useApp()
  const [config, setConfig] = useState({ topic: '', type: 'mcq', difficulty: 'beginner' })
  const [quiz, setQuiz] = useState([])
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [showResult, setShowResult] = useState(false)
  const [phase, setPhase] = useState('config') // config | quiz | results
  const [timeLeft, setTimeLeft] = useState(30)

  const generate = async (e) => {
    e.preventDefault()
    if (!config.topic.trim()) return
    setLoading(true)
    try {
      const data = await api.quiz(config.topic, config.type, config.difficulty)
      setQuiz(data.questions || generateFallbackQuiz(config.topic, config.type))
    } catch {
      setQuiz(generateFallbackQuiz(config.topic, config.type))
      addNotification('⚠️ Using sample quiz — backend offline', 'warn')
    } finally {
      setLoading(false)
      setPhase('quiz')
      setCurrent(0)
      setAnswers([])
      setSelected(null)
      setTimeLeft(30)
    }
  }

  const handleAnswer = (idx) => {
    if (selected !== null) return
    setSelected(idx)
    setShowResult(true)
    const isCorrect = idx === quiz[current].answer
    setAnswers(prev => [...prev, { selected: idx, correct: quiz[current].answer, isCorrect }])
  }

  const next = () => {
    if (current + 1 < quiz.length) {
      setCurrent(c => c + 1)
      setSelected(null)
      setShowResult(false)
      setTimeLeft(30)
    } else {
      const score = answers.filter(a => a.isCorrect).length + (selected === quiz[current].answer ? 1 : 0)
      addQuizScore(config.topic, score, quiz.length)
      addNotification(`🎯 Quiz complete! Score: ${score}/${quiz.length}`)
      setPhase('results')
    }
  }

  const reset = () => {
    setPhase('config')
    setQuiz([])
    setAnswers([])
    setSelected(null)
    setShowResult(false)
  }

  const score = answers.filter(a => a.isCorrect).length

  if (phase === 'results') {
    const finalScore = answers.filter(a => a.isCorrect).length
    const pct = Math.round((finalScore / quiz.length) * 100)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-reveal-up">
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'Outfit' }}>Assessment <span className="text-grad">Report</span></h1>
        <div className="card" style={{ padding: 40, textAlign: 'center', background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border)' }}>
          <Trophy size={48} color={pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--orange)' : 'var(--accent)'} style={{ margin: '0 auto 16px', filter: `drop-shadow(0 0 10px ${pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--orange)' : 'var(--accent)'}33)` }} />
          <div style={{ fontSize: '3.5rem', fontWeight: 900, fontFamily: 'Outfit' }} className="text-grad">{pct}%</div>
          <p style={{ color: 'var(--t2)', margin: '8px 0 24px', fontSize: '0.92rem' }}>{finalScore} / {quiz.length} questions correctly solved on <strong>{config.topic}</strong></p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {answers.map((a, i) => (
              <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: a.isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)', border: `2px solid ${a.isCorrect ? 'var(--green)' : 'var(--red)'}`, boxShadow: a.isCorrect ? 'var(--glow-g)' : 'none' }}>
                {a.isCorrect ? <CheckCircle size={15} color="var(--green)" /> : <XCircle size={15} color="var(--red)" />}
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ marginTop: 32, padding: '12px 32px', boxShadow: 'var(--glow-p)' }} onClick={reset}>
            <RotateCcw size={16} /> Generate New Test
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'quiz' && quiz.length > 0) {
    const q = quiz[current]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-reveal-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit' }}>Testing: <span className="text-grad">{config.topic}</span></h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="badge badge-indigo" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--p4)', padding: '5px 12px', borderRadius: 99, fontSize: '0.78rem' }}>Question {current + 1} / {quiz.length}</div>
            <div className="badge badge-blue" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', color: 'var(--accent3)', padding: '5px 12px', borderRadius: 99, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}><Timer size={12} /> {timeLeft}s</div>
            <div className="badge badge-green" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--green)', padding: '5px 12px', borderRadius: 99, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> {score} solved</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--border-soft)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((current) / quiz.length) * 100}%`, background: 'var(--grad)', borderRadius: 99, transition: 'width 0.4s ease' }} />
        </div>

        <div className="card" style={{ padding: 32, background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 24, color: 'var(--t1)' }}>{q.q}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options?.map((opt, idx) => {
              let borderColor = 'var(--border)'
              let bg = 'rgba(255,255,255,0.01)'
              if (showResult) {
                if (idx === q.answer) { borderColor = 'var(--green)'; bg = 'rgba(16,185,129,0.08)' }
                else if (idx === selected) { borderColor = 'var(--red)'; bg = 'rgba(239,68,68,0.06)' }
              } else if (selected === idx) {
                borderColor = 'rgba(99,102,241,0.35)'; bg = 'rgba(99,102,241,0.06)'
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  style={{
                    padding: '14px 18px', borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    background: bg,
                    color: 'var(--t1)',
                    textAlign: 'left', cursor: selected !== null ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'all 0.2s', fontSize: '0.92rem',
                  }}
                  onMouseEnter={e => {
                    if (!showResult && selected !== idx) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'
                  }}
                  onMouseLeave={e => {
                    if (!showResult && selected !== idx) e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  <span style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, color: 'var(--t2)' }}>
                    {['A','B','C','D'][idx]}
                  </span>
                  {opt}
                  {showResult && idx === q.answer && <CheckCircle size={15} color="var(--green)" style={{ marginLeft: 'auto' }} />}
                  {showResult && idx === selected && idx !== q.answer && <XCircle size={15} color="var(--red)" style={{ marginLeft: 'auto' }} />}
                </button>
              )
            })}
          </div>
          {showResult && q.explanation && (
            <div style={{ marginTop: 18, padding: '14px 18px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, fontSize: '0.88rem', color: 'var(--t2)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--accent2)', marginRight: 6 }}>Analysis:</strong> {q.explanation}
            </div>
          )}
          {showResult && (
            <button className="btn btn-primary" style={{ marginTop: 22, width: '100%', height: 44, boxShadow: 'var(--glow-p)' }} onClick={next}>
              {current + 1 < quiz.length ? <>Next Question <ChevronRight size={16} /></> : 'Compile Final Vector 🏆'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-reveal-up">
      <div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 2, fontFamily: 'Outfit' }}>
          AI <span className="text-grad">Assessment Hub</span>
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: '0.9rem' }}>Formulate adaptive diagnostic quizzes on complex deep learning modules.</p>
      </div>

      <div className="card" style={{ padding: '32px', maxWidth: 540, background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border)' }}>
        <form onSubmit={generate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Topic Sandbox</label>
            <div style={{ position: 'relative' }}>
              <HelpCircle size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
              <input
                className="input"
                style={{ paddingLeft: 40, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 42, color: 'var(--t1)' }}
                placeholder="e.g. Transformers, Backpropagation, CNN, GAN"
                value={config.topic}
                onChange={e => setConfig(p => ({ ...p, topic: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 8, display: 'block', fontWeight: 600 }}>Assessment Mode</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {QUIZ_TYPES.map(qt => {
                const isAct = config.type === qt.value
                return (
                  <button
                    key={qt.value}
                    type="button"
                    onClick={() => setConfig(p => ({ ...p, type: qt.value }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: `1px solid ${isAct ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
                      background: isAct ? 'rgba(99,102,241,0.08)' : 'rgba(7,11,20,0.3)',
                      color: isAct ? 'var(--t1)' : 'var(--t2)',
                      fontFamily: 'Inter',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {qt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 8, display: 'block', fontWeight: 600 }}>Difficulty Vector</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {DIFFICULTIES.map(d => {
                const isAct = config.difficulty === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setConfig(p => ({ ...p, difficulty: d }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: `1px solid ${isAct ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
                      background: isAct ? 'rgba(99,102,241,0.08)' : 'rgba(7,11,20,0.3)',
                      color: isAct ? 'var(--t1)' : 'var(--t2)',
                      fontFamily: 'Inter',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          <button id="quiz-generate" className="btn btn-primary" type="submit" disabled={loading || !config.topic.trim()} style={{ height: 44, marginTop: 4, boxShadow: 'var(--glow-p)' }}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Synthesizing Quiz Vectors...</> : 'Synthesize Diagnostic Quiz ⚡'}
          </button>
        </form>
      </div>
    </div>
  )
}
