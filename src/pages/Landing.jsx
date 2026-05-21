import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrainCircuit, Zap, BookOpen, BarChart2, Code2, MessageSquare, ChevronRight, Star, ArrowRight, Sparkles } from 'lucide-react'

const FEATURES = [
  { icon: BookOpen,      color: '#818cf8', title: 'AI Topic Learning',     desc: 'Get multi-level explanations from beginner to advanced with roadmaps, code, and quizzes.' },
  { icon: BrainCircuit,  color: '#38bdf8', title: 'AI Chat Mentor',       desc: 'Ask anything, get instant expert explanations — like having a PhD tutor available 24/7.' },
  { icon: BarChart2,     color: '#0ea5e9', title: 'Smart Visualizations', desc: 'Watch neural networks train live with animated diagrams and interactive architecture graphs.' },
  { icon: Code2,         color: '#10b981', title: 'Code Playground',     desc: 'Write, run and explore deep learning code with AI-generated templates and explanations.' },
  { icon: Zap,           color: '#f59e0b', title: 'Adaptive Quizzes',    desc: 'Test yourself with AI-generated MCQs, true/false, and coding questions with instant feedback.' },
  { icon: MessageSquare, color: '#a78bfa', title: 'Smart Flashcards',      desc: 'Generate flip-card decks from any topic or your own notes for spaced-repetition learning.' },
]

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'ML Engineer at Google', text: 'This platform completely changed how I understand Transformers. The AI explanations are genuinely better than most textbooks.', rating: 5 },
  { name: 'Arjun M.', role: 'PhD Student, IIT Bombay', text: 'The visualizations for backpropagation finally made the chain rule click for me. Incredible tool!', rating: 5 },
  { name: 'Sofia L.', role: 'Data Scientist', text: 'I passed my ML interview prep in 2 weeks using just this platform. The adaptive quizzes are gold.', rating: 5 },
]

const STATS = [
  { value: '50+', label: 'DL Topics Covered' },
  { value: '10K+', label: 'Learners Worldwide' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '24/7', label: 'AI Availability' },
]

function Particle({ style }) {
  return <div className="particle" style={style} />
}

export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Floating particles — indigo/blue/slate palette
  const particles = Array.from({ length: 30 }, (_, i) => ({
    key: i,
    style: {
      left: `${Math.random() * 100}%`,
      bottom: `-10px`,
      width:  `${1.5 + Math.random() * 3}px`,
      height: `${1.5 + Math.random() * 3}px`,
      background: i % 4 === 0 ? '#818cf8' : i % 4 === 1 ? '#0ea5e9' : i % 4 === 2 ? '#38bdf8' : '#6366f1',
      animationDuration: `${10 + Math.random() * 15}s`,
      animationDelay:    `${Math.random() * 10}s`,
      opacity: 0.35 + Math.random() * 0.3,
    }
  }))

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* HERO */}
      <section style={{
        position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Particles */}
        {particles.map(p => <Particle key={p.key} style={p.style} />)}

        {/* Ambient glow orbs — indigo/blue, NOT pink */}
        <div style={{
          position: 'absolute', top: '5%', left: '5%', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
          animation: 'aurora-drift 15s ease-in-out infinite alternate',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%', width: 450, height: 450,
          background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
          animation: 'aurora-drift 20s ease-in-out infinite alternate-reverse',
        }} />
        <div style={{
          position: 'absolute', top: '40%', right: '25%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)',
          borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none',
          animation: 'aurora-drift 25s ease-in-out infinite alternate',
        }} />

        {/* Nav */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, padding: '14px 36px',
          display: 'flex', alignItems: 'center', gap: 14,
          background: scrolled ? 'rgba(7,11,18,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
          zIndex: 100, transition: 'all 0.35s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 'auto' }}>
            <div style={{
              background: 'var(--grad)', borderRadius: 9, padding: 6, display: 'flex',
              boxShadow: '0 0 16px rgba(79,70,229,0.3)',
            }}>
              <BrainCircuit size={18} color="#fff" />
            </div>
            <span style={{
              fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.95rem', color: 'var(--t1)',
              letterSpacing: '-0.02em',
            }}>DL Virtual Teacher</span>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: '0.82rem', padding: '7px 16px' }} onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '7px 18px' }} onClick={() => navigate('/signup')}>Get Started</button>
        </nav>

        {/* Hero content */}
        <div style={{ maxWidth: 800, animation: 'fade-in 0.9s var(--ease-out)' }}>
          <div className="badge badge-purple" style={{ marginBottom: 24, padding: '5px 14px' }}>
            <Sparkles size={11} /> AI-Powered Deep Learning Education
          </div>

          <h1 style={{
            fontSize: 'clamp(2.6rem, 6vw, 4.8rem)', fontWeight: 900,
            marginBottom: 24, lineHeight: 1.08, letterSpacing: '-0.04em',
          }}>
            Master Deep Learning
            <br />
            <span className="text-grad">with Your AI Teacher</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--t2)',
            maxWidth: 580, margin: '0 auto 44px', lineHeight: 1.75,
            fontWeight: 400,
          }}>
            An intelligent learning ecosystem that teaches CNNs, Transformers, GANs and more — through personalized explanations, live visualizations, adaptive quizzes, and an AI mentor that never sleeps.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: '1.02rem', padding: '13px 30px', borderRadius: 14 }}
              onClick={() => navigate('/signup')}
            >
              Start Learning Free <ArrowRight size={17} />
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '1.02rem', padding: '13px 28px', borderRadius: 14 }}
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Neural net graphic */}
        <div className="animate-float" style={{ marginTop: 56, position: 'relative' }}>
          <div style={{
            width: 340, height: 200,
            background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(79,70,229,0.15), 0 20px 60px rgba(0,0,0,0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Shimmer line at top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)',
            }} />
            <NeuralNetDiagram />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{
        padding: '56px 24px', borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)',
      }}>
        <div className="stagger" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 28, maxWidth: 880, margin: '0 auto', textAlign: 'center',
        }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{
                fontSize: '2.2rem', fontWeight: 900, fontFamily: 'Outfit',
                letterSpacing: '-0.03em',
              }} className="text-grad">{s.value}</div>
              <div style={{ color: 'var(--t3)', fontSize: '0.85rem', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '88px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="badge badge-cyan" style={{ marginBottom: 14 }}>Everything You Need</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.04em' }}>
            A Complete <span className="text-grad">AI Learning Ecosystem</span>
          </h2>
          <p style={{ color: 'var(--t2)', marginTop: 14, maxWidth: 520, margin: '14px auto 0', fontSize: '1.02rem', lineHeight: 1.7 }}>
            Every tool you need to go from zero to deep learning expert, powered by cutting-edge AI.
          </p>
        </div>
        <div className="stagger" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16,
        }}>
          {FEATURES.map(f => (
            <div key={f.title} className="card" style={{ padding: '26px 22px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${f.color}12`,
                border: `1px solid ${f.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <f.icon size={20} color={f.color} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 7, letterSpacing: '-0.02em' }}>{f.title}</h3>
              <p style={{ color: 'var(--t2)', fontSize: '0.88rem', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{
        padding: '80px 24px', background: 'rgba(0,0,0,0.15)',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Loved by <span className="text-grad">AI Learners</span>
            </h2>
          </div>
          <div className="stagger" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))', gap: 16,
          }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', marginBottom: 12, gap: 2 }}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={13} color="#f59e0b" fill="#f59e0b" />
                  ))}
                </div>
                <p style={{ color: 'var(--t2)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'var(--grad)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.85rem',
                    boxShadow: '0 0 12px rgba(79,70,229,0.25)',
                  }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.name}</div>
                    <div style={{ color: 'var(--t3)', fontSize: '0.72rem' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', position: 'relative' }}>
        {/* Subtle glow behind CTA */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 500, height: 300, background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 60%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 580, margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: 18, letterSpacing: '-0.04em' }}>
            Ready to <span className="text-grad">Master Deep Learning?</span>
          </h2>
          <p style={{ color: 'var(--t2)', marginBottom: 32, fontSize: '1.02rem', lineHeight: 1.7 }}>
            Join thousands of AI learners leveling up their skills with our AI-powered platform.
          </p>
          <button
            className="btn btn-primary"
            style={{ fontSize: '1.05rem', padding: '14px 36px', borderRadius: 14 }}
            onClick={() => navigate('/signup')}
          >
            Start for Free Today <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '28px 36px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BrainCircuit size={16} color="var(--p3)" />
          <span style={{
            fontFamily: 'Outfit', fontWeight: 700, color: 'var(--t3)', fontSize: '0.85rem',
          }}>DL Virtual Teacher</span>
        </div>
        <div style={{ color: 'var(--t3)', fontSize: '0.78rem' }}>
          &copy; 2026 Deep Learning Virtual Teacher. Built with AI.
        </div>
      </footer>
    </div>
  )
}

function NeuralNetDiagram() {
  const layers = [[3], [4], [4], [2]]
  const W = 300, H = 160
  const layerX = layers.map((_, i) => 30 + (i * (W - 60)) / (layers.length - 1))
  const layerColors = ['#6366f1', '#818cf8', '#0ea5e9', '#38bdf8']

  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      {/* Connections */}
      {layers.map((nodes, li) =>
        nodes.map((_, ni) => {
          const y = (H / (nodes[0] + 1)) * (ni + 1)
          return layers[li + 1]?.map((_, nj) => {
            const y2 = (H / (layers[li + 1][0] + 1)) * (nj + 1)
            return (
              <line key={`${li}-${ni}-${nj}`}
                x1={layerX[li]} y1={y}
                x2={layerX[li + 1]} y2={y2}
                stroke="rgba(99,102,241,0.15)" strokeWidth={0.7}
              />
            )
          })
        })
      )}
      {/* Nodes */}
      {layers.map((nodes, li) =>
        Array.from({ length: nodes[0] + 1 }, (_, ni) => {
          if (ni === 0) return null
          const y = (H / (nodes[0] + 1)) * ni
          return (
            <g key={`node-${li}-${ni}`}>
              <circle
                cx={layerX[li]} cy={y} r={7}
                fill={`${layerColors[li]}30`}
                stroke={layerColors[li]} strokeWidth={1.2}
              />
              {/* Pulse animation */}
              <circle
                cx={layerX[li]} cy={y} r={7}
                fill="transparent"
                stroke={layerColors[li]} strokeWidth={0.5}
                opacity={0.3}
              >
                <animate attributeName="r" from="7" to="14" dur={`${2 + li * 0.5}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.3" to="0" dur={`${2 + li * 0.5}s`} repeatCount="indefinite" />
              </circle>
            </g>
          )
        })
      )}
    </svg>
  )
}
