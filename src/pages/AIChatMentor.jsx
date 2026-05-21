import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Loader2, RotateCcw, User, Bot, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { api } from '../services/api'
import { useApp } from '../context/AppContext'

const SUGGESTIONS = [
  'Explain how attention mechanism works',
  'What is vanishing gradient problem?',
  'How does dropout prevent overfitting?',
  'Explain backpropagation step by step',
  'What is the difference between CNN and RNN?',
  'How does batch normalization work?',
]

const WELCOME = {
  role: 'ai',
  content: `👋 **Greetings! Welcome to your Premium AI Deep Learning Sandbox.**\n\nI am your specialized neural architecture mentor. Ask me any question, and we can explore the math, implementation, or intuition together.\n\nHere are some directions we can take:\n- 🧮 **Mathematical Explanations** (deriving backpropagation, loss curves, etc.)\n- 🖥️ **PyTorch Code Debugging** (interpreting shape errors, optimizer quirks)\n- 🗺️ **Intuitive Metaphors** (visualizing attention layers, latent spaces)\n\nWhat topic shall we explore first?`,
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AIChatMentor() {
  const { addChatMessage, progress } = useApp()
  const [messages, setMessages] = useState(() => {
    const hist = progress.chatHistory
    return hist.length > 0 ? hist : [WELCOME]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => [...prev, userMsg])
    addChatMessage(userMsg)
    setLoading(true)

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
      const data = await api.chat(msg, history)
      const aiMsg = {
        role: 'ai',
        content: data.reply || data.message || data.response || '...',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiMsg])
      addChatMessage(aiMsg)
    } catch {
      const fallback = {
        role: 'ai',
        content: `I apologize — the AI backend seems to be offline right now. 🔌\n\nTo get AI responses:\n1. Make sure the FastAPI backend is running: \`python api.py\`\n2. Verify it's accessible at ${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}\n3. Check your xAI/Grok API key is configured\n\nYour question was: **"${msg}"**`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, fallback])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([WELCOME])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: 16 }} className="animate-reveal-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 2, fontFamily: 'Outfit' }}>
            AI <span className="text-grad">Chat Mentor</span>
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: '0.88rem' }}>Your personal neural architectures researcher, available 24/7.</p>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '7px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }} onClick={clearChat}>
          <RotateCcw size={14} /> Reset Session
        </button>
      </div>

      {/* Chat window */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border)' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'ai' ? 'var(--grad)' : 'rgba(99,102,241,0.12)',
                border: `1px solid ${msg.role === 'ai' ? 'transparent' : 'rgba(99,102,241,0.25)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: msg.role === 'ai' ? 'var(--glow-p)' : 'none'
              }}>
                {msg.role === 'ai' ? <Bot size={16} color="#fff" /> : <User size={16} color="var(--accent3)" />}
              </div>
              <div style={{ maxWidth: '80%' }}>
                <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'} style={{ boxShadow: 'var(--shadow-sm)' }}>
                  {msg.role === 'ai' ? (
                    <div className="md" style={{ fontSize: '0.92rem', color: 'var(--t1)' }}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.92rem', color: 'var(--t1)', margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
                  )}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--t3)', marginTop: 6, textAlign: msg.role === 'user' ? 'right' : 'left', fontWeight: 500 }}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-p)' }}>
                <Bot size={16} color="#fff" />
              </div>
              <div className="chat-bubble-ai" style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '14px 18px' }}>
                {[0,1,2].map(i => (
                  <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div style={{ padding: '0 24px 20px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--t2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={12} color="var(--accent)" /> Prompt Suggestions
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 99,
                    border: '1px solid var(--border)',
                    background: 'rgba(99,102,241,0.04)',
                    color: 'var(--t2)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'
                    e.currentTarget.style.color = 'var(--t1)'
                    e.currentTarget.style.background = 'rgba(99,102,241,0.08)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--t2)'
                    e.currentTarget.style.background = 'rgba(99,102,241,0.04)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, background: 'rgba(7,11,20,0.3)' }}>
          <input
            className="input"
            style={{
              flex: 1,
              height: 44,
              background: 'rgba(7,11,20,0.4)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '0 16px',
              color: 'var(--t1)',
              fontSize: '0.92rem'
            }}
            placeholder="Ask anything about deep learning architectures..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          />
          <button
            className="btn btn-primary"
            style={{ padding: '0 20px', height: 44, flexShrink: 0, boxShadow: 'var(--glow-p)' }}
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
