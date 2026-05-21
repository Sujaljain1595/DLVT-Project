import { useState } from 'react'
import { Layers, ChevronLeft, ChevronRight, RotateCcw, Star, Plus, Brain, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../services/api'

function makeFallbackCards(topic) {
  return [
    { front: `What is ${topic}?`, back: `${topic} is a deep learning technique that learns hierarchical representations from data through multiple layers of abstraction.` },
    { front: `What are the key components of ${topic}?`, back: 'Layers, activation functions, weight matrices, bias terms, and an optimization algorithm (like Adam or SGD).' },
    { front: `What loss function is used in ${topic}?`, back: 'Cross-entropy loss for classification, Mean Squared Error (MSE) for regression tasks.' },
    { front: `How does ${topic} handle overfitting?`, back: 'Through regularization techniques: Dropout, L1/L2 regularization, batch normalization, and data augmentation.' },
    { front: `What is backpropagation in ${topic}?`, back: 'Backpropagation computes gradients of the loss w.r.t. all model parameters using the chain rule, enabling weight updates.' },
  ]
}

export default function Flashcards() {
  const { progress, addFlashcards, addNotification } = useApp()
  const [topic, setTopic] = useState('')
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [starred, setStarred] = useState(new Set())

  const generate = async (e) => {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true)
    try {
      const data = await api.notes(topic, 'flashcard')
      const lines = (data.notes || data.content || '').split('\n')
      const parsed = []
      let cur = {}
      for (const line of lines) {
        if (line.startsWith('**Q**:') || line.startsWith('Q:')) {
          cur.front = line.replace(/^\*\*Q\*\*:|^Q:/, '').trim()
        } else if (line.startsWith('**A**:') || line.startsWith('A:')) {
          cur.back = line.replace(/^\*\*A\*\*:|^A:/, '').trim()
          if (cur.front && cur.back) { parsed.push({ ...cur }); cur = {} }
        }
      }
      setCards(parsed.length >= 2 ? parsed : makeFallbackCards(topic))
    } catch {
      setCards(makeFallbackCards(topic))
      addNotification('⚠️ Using sample flashcards', 'warn')
    } finally {
      setLoading(false)
      setCurrent(0)
      setFlipped(false)
    }
  }

  const prev = () => { setFlipped(false); setTimeout(() => setCurrent(c => Math.max(0, c - 1)), 150) }
  const next = () => { setFlipped(false); setTimeout(() => setCurrent(c => Math.min(cards.length - 1, c + 1)), 150) }
  const toggleStar = () => setStarred(s => { const n = new Set(s); n.has(current) ? n.delete(current) : n.add(current); return n })
  const saveAll = () => { addFlashcards(cards.map((c, i) => ({ ...c, topic, starred: starred.has(i) }))); addNotification('💾 Flashcards saved!') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-reveal-up">
      <div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 2, fontFamily: 'Outfit' }}>
          AI <span className="text-grad">Flashcard Decks</span>
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: '0.9rem' }}>Generate memory retention vector decks. Click any card to flip.</p>
      </div>

      {/* Generate form */}
      <div className="card" style={{ padding: '20px 24px', background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border)' }}>
        <form onSubmit={generate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <Brain size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
            <input
              className="input"
              style={{ paddingLeft: 40, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 42, color: 'var(--t1)' }}
              placeholder="e.g. Transformers, Backpropagation, CNN"
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading || !topic.trim()} style={{ height: 42, padding: '0 20px', boxShadow: 'var(--glow-p)' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Synthesize Deck</>}
          </button>
          {cards.length > 0 && (
            <button type="button" className="btn btn-ghost" onClick={saveAll} style={{ height: 42, padding: '0 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>💾 Save Deck</button>
          )}
        </form>
      </div>

      {/* Flashcard */}
      {cards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="badge badge-indigo" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--p4)', padding: '5px 12px', borderRadius: 99, fontSize: '0.78rem' }}>
              Card {current + 1} / {cards.length}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="badge badge-green" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--green)', padding: '5px 12px', borderRadius: 99, fontSize: '0.78rem' }}>
                ⭐ {starred.size} starred
              </div>
            </div>
          </div>

          {/* Card */}
          <div style={{ height: 280 }}>
            <div className={`flip-card ${flipped ? 'flipped' : ''}`} style={{ height: '100%' }} onClick={() => setFlipped(f => !f)}>
              <div className="flip-card-inner">
                {/* Front */}
                <div className="flip-card-front card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'linear-gradient(135deg, rgba(79,70,229,0.06) 0%, rgba(14,165,233,0.02) 100%)', border: '1px solid var(--border)' }}>
                  <div className="badge badge-indigo" style={{ marginBottom: 20, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--p4)', padding: '4px 12px', borderRadius: 99, fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Question Matrix</div>
                  <h2 style={{ fontSize: '1.25rem', textAlign: 'center', lineHeight: 1.5, fontFamily: 'Outfit', color: 'var(--t1)' }}>{cards[current].front}</h2>
                  <p style={{ color: 'var(--t3)', fontSize: '0.78rem', marginTop: 24, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Click to flip</p>
                </div>
                {/* Back */}
                <div className="flip-card-back card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'linear-gradient(135deg, rgba(14,165,233,0.05) 0%, rgba(79,70,229,0.02) 100%)', border: '1px solid var(--border)' }}>
                  <div className="badge badge-blue" style={{ marginBottom: 20, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', color: 'var(--accent3)', padding: '4px 12px', borderRadius: 99, fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Answer Synthesis</div>
                  <p style={{ fontSize: '1rem', textAlign: 'center', lineHeight: 1.6, color: 'var(--t1)', fontWeight: 500 }}>{cards[current].back}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
            <button className="btn btn-ghost" style={{ padding: 10, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)' }} onClick={prev} disabled={current === 0}><ChevronLeft size={18} /></button>
            <button className="btn btn-ghost" style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontSize: '0.85rem' }} onClick={() => setFlipped(f => !f)}><RotateCcw size={14} /> Flip</button>
            <button
              className="btn btn-ghost"
              onClick={toggleStar}
              style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontSize: '0.85rem', color: starred.has(current) ? 'var(--orange)' : 'var(--t2)' }}
            >
              <Star size={14} fill={starred.has(current) ? 'var(--orange)' : 'none'} style={{ marginRight: 4 }} /> Star
            </button>
            <button className="btn btn-ghost" style={{ padding: 10, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)' }} onClick={next} disabled={current === cards.length - 1}><ChevronRight size={18} /></button>
          </div>

          {/* Dot navigation */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {cards.map((_, i) => (
              <div
                key={i}
                onClick={() => { setFlipped(false); setCurrent(i) }}
                style={{
                  width: i === current ? 24 : 8, height: 8, borderRadius: 99,
                  background: i === current ? 'var(--p2)' : starred.has(i) ? 'var(--orange)' : 'var(--border)',
                  cursor: 'pointer', transition: 'all 0.25s var(--ease-spring)'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Saved flashcards */}
      {progress.flashcards.length > 0 && cards.length === 0 && (
        <div className="animate-reveal-up">
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Library Decks ({progress.flashcards.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {progress.flashcards.slice(0, 8).map((card, i) => (
              <div key={i} className="card" style={{ padding: 20, background: 'rgba(15,23,42,0.3)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 6, color: 'var(--t1)' }}>{card.front}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--t2)', lineHeight: 1.4 }}>{card.back?.substring(0, 80)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {cards.length === 0 && progress.flashcards.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--t2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
          <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>Memory Vectors</p>
          <p style={{ fontSize: '0.78rem', marginTop: 6, opacity: 0.8, maxWidth: 240, lineHeight: 1.4 }}>Input a deep learning subject above to synthesize an interactive flashcard deck.</p>
        </div>
      )}
    </div>
  )
}
