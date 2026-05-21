import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Bookmark, Trash2, Eye, Download, Search, FileText, Filter } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function SavedNotes() {
  const { progress, updateProgress, addNotification } = useApp()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [viewing, setViewing] = useState(null)

  const types = ['all', ...new Set(progress.savedNotes.map(n => n.type).filter(Boolean))]

  const filtered = progress.savedNotes.filter(n => {
    const matchSearch = !search || (n.topic || '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || n.type === filterType
    return matchSearch && matchType
  })

  const deleteNote = (id) => {
    const savedNotes = progress.savedNotes.filter(n => n.id !== id)
    updateProgress({ savedNotes })
    addNotification('🗑️ Note deleted', 'warn')
    if (viewing?.id === id) setViewing(null)
  }

  const download = (note) => {
    const blob = new Blob([note.content || ''], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${note.topic || 'notes'}_${note.type || 'saved'}.md`
    a.click()
  }

  const TYPE_LABELS = {
    short: 'Short', detailed: 'Detailed', exam: 'Exam', flashcard: 'Flashcard', formula: 'Formula'
  }
  const TYPE_COLORS = {
    short: 'var(--green)', detailed: 'var(--p2)', exam: 'var(--orange)', flashcard: 'var(--accent)', formula: 'var(--teal)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bookmark size={24} color="var(--accent)" />
          <span>Saved <span className="text-grad">Notes</span></span>
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: '0.92rem' }}>
          Your personal library of AI-generated notes. {progress.savedNotes.length} notes saved.
        </p>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
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
            placeholder="Search by topic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--border-bright)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t3)', fontSize: '0.82rem', fontWeight: 600 }}>
            <Filter size={14} />
            <span>Filter:</span>
          </div>
          <div style={{
            display: 'flex',
            gap: 6,
            background: 'var(--bg-1)',
            padding: 4,
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)'
          }}>
            {types.map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '6px 12px', 
                  borderRadius: 'var(--r-sm)',
                  border: `1px solid ${filterType === t ? 'var(--border-bright)' : 'transparent'}`,
                  background: filterType === t ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  color: filterType === t ? 'var(--p3)' : 'var(--t2)',
                  fontFamily: 'Outfit', 
                  fontSize: '0.78rem', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {t === 'all' ? 'All Types' : TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 24px', 
          color: 'var(--t3)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--r-lg)',
          background: 'rgba(15, 23, 42, 0.2)'
        }}>
          <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.2, color: 'var(--t2)' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: 8, color: 'var(--t2)' }}>
            {progress.savedNotes.length === 0 ? 'No notes saved yet' : 'No notes match your search'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--t3)', maxWidth: 360, margin: '0 auto' }}>
            {progress.savedNotes.length === 0
              ? 'Generate notes from any topic and save them here for quick access.'
              : 'Try adjusting your search query or choosing a different note type filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: viewing ? '1.1fr 0.9fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>
          {/* Notes grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, ...(viewing ? {} : { gridColumn: '1/-1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }) }}>
            {filtered.map(note => {
              const color = TYPE_COLORS[note.type] || 'var(--p2)'
              const isActive = viewing?.id === note.id
              return (
                <div
                  key={note.id}
                  className="card"
                  style={{
                    padding: 20,
                    cursor: 'pointer',
                    border: `1px solid ${isActive ? 'var(--border-bright)' : 'var(--border)'}`,
                    background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'var(--card-bg)',
                    boxShadow: isActive ? 'var(--glow-p), var(--shadow-md)' : 'var(--shadow-sm)',
                    transition: 'all 0.25s ease',
                  }}
                  onClick={() => setViewing(isActive ? null : note)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ padding: 8, borderRadius: 'var(--r-sm)', background: `${color}14`, border: `1px solid ${color}24`, flexShrink: 0 }}>
                      <FileText size={16} color={color} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <h3 style={{ fontSize: '0.94rem', fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--t1)' }}>
                        {note.topic || 'Untitled'}
                      </h3>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {TYPE_LABELS[note.type] || note.type || 'Notes'}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--t3)' }}>•</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--t2)' }}>
                          {note.savedAt ? new Date(note.savedAt).toLocaleDateString() : 'Saved'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--t2)', lineHeight: 1.5, marginBottom: 16,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {(note.content || '').replace(/[#*`]/g, '').substring(0, 120)}...
                  </p>

                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-glass"
                      style={{ flex: 1, padding: '6px 12px', fontSize: '0.75rem', borderRadius: 'var(--r-sm)' }}
                      onClick={() => setViewing(isActive ? null : note)}
                    >
                      <Eye size={12} /> {isActive ? 'Close' : 'View'}
                    </button>
                    <button
                      className="btn btn-glass"
                      style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: 'var(--r-sm)' }}
                      onClick={() => download(note)}
                    >
                      <Download size={12} />
                    </button>
                    <button
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: 'var(--r-sm)', 
                        border: '1px solid rgba(239,68,68,0.2)', 
                        background: 'rgba(239,68,68,0.06)', 
                        color: 'var(--red)', 
                        cursor: 'pointer', 
                        fontSize: '0.75rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 4,
                        transition: 'all 0.2s'
                      }}
                      onClick={() => deleteNote(note.id)}
                      onMouseEnter={e => {
                        e.target.style.background = 'rgba(239,68,68,0.12)'
                        e.target.style.borderColor = 'rgba(239,68,68,0.4)'
                      }}
                      onMouseLeave={e => {
                        e.target.style.background = 'rgba(239,68,68,0.06)'
                        e.target.style.borderColor = 'rgba(239,68,68,0.2)'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Full note viewer */}
          {viewing && (
            <div className="card" style={{ 
              padding: 24, 
              position: 'sticky', 
              top: 24, 
              maxHeight: 'calc(100vh - 120px)', 
              overflowY: 'auto',
              background: 'var(--card-bg)',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--t1)' }}>{viewing.topic || 'Notes'}</h2>
                  <span style={{ fontSize: '0.72rem', color: TYPE_COLORS[viewing.type] || 'var(--p2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {TYPE_LABELS[viewing.type] || viewing.type}
                  </span>
                </div>
                <button
                  className="btn btn-glass"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 'var(--r-sm)' }}
                  onClick={() => download(viewing)}
                >
                  <Download size={13} /> Download
                </button>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1, padding: '0 4px', display: 'flex', alignItems: 'center' }}
                  onClick={() => setViewing(null)}
                >×</button>
              </div>
              <div className="prose prose-invert" style={{ fontSize: '0.88rem', color: 'var(--t2)', lineHeight: 1.6 }}>
                <ReactMarkdown>{viewing.content || '*No content available*'}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
