import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { FileText, Loader2, Copy, Download, Bookmark, CheckCircle, Brain, Wand2, FileUp, X } from 'lucide-react'
import { api } from '../services/api'
import { useApp } from '../context/AppContext'
import { NOTE_TYPES } from '../utils/constants'

const QUICK_TOPICS = ['CNN', 'Transformers', 'Backpropagation', 'LSTM', 'GANs', 'Attention', 'Diffusion', 'BERT']

function generateFallbackNotes(topic, type) {
  const content = {
    short: `# ${topic} — Short Notes\n\n## Key Concepts\n- Core idea of ${topic}\n- Mathematical foundations\n- Practical applications\n\n## Summary\n${topic} is a fundamental concept in deep learning used for learning complex patterns from data.`,
    detailed: `# ${topic} — Detailed Notes\n\n## Introduction\n${topic} is a foundational technique in modern deep learning.\n\n## Mathematical Background\n- Forward pass: $f(x) = W^T x + b$\n- Activation: $a = \\sigma(f(x))$\n\n## Architecture\n1. Input layer processes raw features\n2. Hidden layers transform representations\n3. Output layer produces predictions\n\n## Applications\n- Image classification\n- Natural language processing\n- Speech recognition`,
    exam: `# ${topic} — Exam Notes ⚡\n\n> **Must Know**: These are the most tested concepts\n\n## Top 5 Key Points\n1. **Definition**: ${topic} enables hierarchical feature learning\n2. **Key equation**: $\\nabla L = \\frac{\\partial L}{\\partial W}$\n3. **Advantage**: Automatic feature extraction\n4. **Limitation**: Requires large datasets\n5. **Use case**: State-of-the-art benchmarks\n\n## Common Exam Questions\n- Explain the working of ${topic}\n- Derive the gradient update rule\n- Compare ${topic} with traditional ML`,
    flashcard: `# ${topic} — Flashcards\n\n---\n**Q**: What is ${topic}?\n**A**: A deep learning technique that learns representations through multiple layers of abstraction.\n\n---\n**Q**: What is the key equation?\n**A**: $y = f(Wx + b)$ where W is the weight matrix\n\n---\n**Q**: What are the main advantages?\n**A**: Automatic feature learning, scalability, state-of-the-art performance`,
    formula: `# ${topic} — Formula Sheet\n\n| Symbol | Description |\n|--------|-------------|\n| $W$ | Weight matrix |\n| $b$ | Bias vector |\n| $\\alpha$ | Learning rate |\n| $L$ | Loss function |\n\n## Key Formulas\n$$f(x) = \\sigma(Wx + b)$$\n$$L_{CE} = -\\sum_i y_i \\log(\\hat{y}_i)$$\n$$W := W - \\alpha \\nabla_W L$$`,
  }
  return content[type] || content.detailed
}

export default function NotesGenerator() {
  const { saveNote, addNotification } = useApp()
  const [input, setInput]   = useState({ topic: '', text: '', type: 'detailed' })
  const [loading, setLoading] = useState(false)
  const [notes, setNotes]   = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError]   = useState('')
  const [extracting, setExtracting] = useState(false)

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setExtracting(true)
    setError('')
    try {
      const data = await api.extractText(file)
      if (data && data.text) {
        setInput(p => ({ ...p, text: data.text }))
        addNotification(`✨ Successfully extracted content from ${file.name}!`, 'success')
      } else if (data && data.error) {
        setError(data.error)
        addNotification(data.error, 'error')
      }
    } catch (err) {
      console.error(err)
      setError('AI extraction failed. Please try again or paste text manually.')
      addNotification('AI extraction failed.', 'error')
    } finally {
      setExtracting(false)
      e.target.value = '' // Reset input
    }
  }

  const generate = async (e) => {
    e.preventDefault()
    if (!input.topic.trim() && !input.text.trim()) return
    setLoading(true); setError(''); setNotes('')
    try {
      const data = await api.notes(input.topic, input.type, input.text)
      setNotes(data.notes || data.content || JSON.stringify(data))
    } catch {
      setNotes(generateFallbackNotes(input.topic || 'Your Topic', input.type))
      addNotification('⚠️ Backend offline — showing sample notes', 'warn')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(notes)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const download = () => {
    const blob = new Blob([notes], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${input.topic || 'notes'}_${input.type}.md`
    a.click()
  }

  const save = () => {
    saveNote({ topic: input.topic, type: input.type, content: notes })
    addNotification('📌 Notes saved to library!', 'success')
  }

  const TYPE_ICONS = { short: '📝', detailed: '📚', exam: '⚡', flashcard: '🃏', formula: '📐' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-reveal-up">
      <div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 2, fontFamily: 'Outfit' }}>
          AI <span className="text-grad">Notes Sandbox</span>
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: '0.9rem' }}>
          Generate highly structured, visually clean markdown study vectors from any source.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>
        {/* Input panel */}
        <div className="card" style={{ padding: 24, background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border)' }}>
          <form onSubmit={generate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Topic Subject</label>
              <input
                className="input"
                style={{ background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 42, color: 'var(--t1)' }}
                placeholder="e.g. Backpropagation, Transformers, Attention Mechanism..."
                value={input.topic}
                onChange={e => setInput(p => ({ ...p, topic: e.target.value }))}
              />
              {/* Quick topic chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {QUICK_TOPICS.map(t => {
                  const isAct = input.topic === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setInput(p => ({ ...p, topic: t }))}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: `1px solid ${isAct ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
                        background: isAct ? 'rgba(99,102,241,0.08)' : 'rgba(7,11,20,0.3)',
                        color: isAct ? 'var(--t1)' : 'var(--t2)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontWeight: 500
                      }}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--t2)', fontWeight: 600 }}>Reference Material</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="file"
                    id="notes-file-upload"
                    accept=".pdf,image/*,text/plain"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="notes-file-upload"
                    className="btn-glass"
                    style={{
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.72rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: 'rgba(255,255,255,0.02)',
                      color: 'var(--t2)',
                      fontWeight: 600
                    }}
                  >
                    {extracting ? <Loader2 size={12} className="animate-spin" /> : <FileUp size={12} />}
                    {extracting ? 'Extracting...' : 'Upload PDF/Image'}
                  </label>
                </div>
              </div>
              
              <div style={{ position: 'relative' }}>
                <textarea
                  className="input"
                  rows={5}
                  placeholder="Paste lecture logs, textbook notes, or any raw material to analyze..."
                  value={input.text}
                  onChange={e => setInput(p => ({ ...p, text: e.target.value }))}
                  style={{ resize: 'vertical', minHeight: 120, paddingRight: 40, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', color: 'var(--t1)', padding: 12 }}
                />
                {input.text && (
                  <button
                    type="button"
                    onClick={() => setInput(p => ({ ...p, text: '' }))}
                    style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                )}
                {extracting && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,11,20,0.6)', backdropFilter: 'blur(2px)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, zIndex: 10 }}>
                    <Loader2 size={22} className="animate-spin" color="var(--accent)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--t1)', fontWeight: 600 }}>Analyzing document matrix...</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 8, display: 'block', fontWeight: 600 }}>Notes Structure Vector</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {NOTE_TYPES.map(nt => {
                  const isAct = input.type === nt.value
                  return (
                    <button
                      key={nt.value}
                      type="button"
                      onClick={() => setInput(p => ({ ...p, type: nt.value }))}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        border: `1px solid ${isAct ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
                        background: isAct ? 'rgba(99,102,241,0.08)' : 'rgba(7,11,20,0.3)',
                        color: isAct ? 'var(--t1)' : 'var(--t2)',
                        fontFamily: 'Inter',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span>{TYPE_ICONS[nt.value]}</span> {nt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <button id="notes-generate" className="btn btn-primary" type="submit"
              disabled={loading || (!input.topic.trim() && !input.text.trim())}
              style={{ width: '100%', height: 44, marginTop: 4, boxShadow: 'var(--glow-p)' }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Synthesizing notes...</> : <><Wand2 size={15} /> Synthesize Study Guide</>}
            </button>
          </form>
        </div>

        {/* Output panel */}
        <div className="card" style={{ padding: 24, minHeight: 400, background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border)' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '56px 0' }} className="animate-reveal-up">
              <div className="animate-glow" style={{ display: 'inline-flex', background: 'var(--grad)', borderRadius: 18, padding: 14, marginBottom: 18, boxShadow: 'var(--glow-p)' }}>
                <FileText size={26} color="#fff" />
              </div>
              <p style={{ color: 'var(--t2)', fontSize: '0.9rem' }}>Synthesizing {input.type} notes for <strong style={{ color: 'var(--accent3)' }}>{input.topic || 'Your Topic'}</strong>...</p>
            </div>
          )}

          {notes && !loading && (
            <div className="animate-reveal-up">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }} onClick={copy}>
                  {copied ? <CheckCircle size={13} color="var(--green)" /> : <Copy size={13} />}
                  {copied ? 'Copied Matrix!' : 'Copy Matrix'}
                </button>
                <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }} onClick={download}>
                  <Download size={13} /> Download .md
                </button>
                <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }} onClick={save}>
                  <Bookmark size={13} /> Pin to Library
                </button>
              </div>
              <div className="md" style={{ maxHeight: 520, overflowY: 'auto' }}>
                <ReactMarkdown>{notes}</ReactMarkdown>
              </div>
            </div>
          )}

          {!notes && !loading && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--t2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
              <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--t1)' }}>Sandbox Guide Output</p>
              <p style={{ fontSize: '0.78rem', marginTop: 6, opacity: 0.8, maxWidth: 260, lineHeight: 1.4 }}>Pills or search terms will formulate study notes here instantly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
