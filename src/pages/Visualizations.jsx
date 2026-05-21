import { useState, useEffect } from "react"
import { Search, Brain, Activity, GitBranch, TrendingDown, BarChart2, Layers, Eye, Repeat, Shuffle, Scale, Hash, Box, Swords, Divide, LineChart, Wand2, Loader2 } from "lucide-react"
import { VIZ_REGISTRY, searchViz } from "./vizData.js"
import { NeuralNetViz, BackpropViz, GradientViz, ActivationViz } from "./vizComponents1.jsx"
import { AttentionViz, RNNViz, DropoutViz, BatchNormViz } from "./vizComponents2.jsx"
import { CNNViz, LossCurveViz, EmbeddingViz, AutoencoderViz, GANViz, SoftmaxViz, LRScheduleViz } from "./vizComponents3.jsx"
import UniversalGraphViz from "./UniversalGraphViz.jsx"

const ICON_MAP = {
  "neural-network": Activity,
  "backpropagation": GitBranch,
  "gradient-descent": TrendingDown,
  "cnn": Layers,
  "loss-curve": BarChart2,
  "activation": ZapIcon,
  "attention": Eye,
  "rnn": Repeat,
  "dropout": Shuffle,
  "batch-norm": Scale,
  "embedding": Hash,
  "autoencoder": Box,
  "gan": Swords,
  "softmax": Divide,
  "learning-rate": LineChart,
}

// Simple fallback if Zap is imported as default or something
function ZapIcon(props) {
  return <Activity {...props} />
}

const COMP_MAP = {
  "neural-network": NeuralNetViz,
  "backpropagation": BackpropViz,
  "gradient-descent": GradientViz,
  "cnn": CNNViz,
  "loss-curve": LossCurveViz,
  "activation": ActivationViz,
  "attention": AttentionViz,
  "rnn": RNNViz,
  "dropout": DropoutViz,
  "batch-norm": BatchNormViz,
  "embedding": EmbeddingViz,
  "autoencoder": AutoencoderViz,
  "gan": GANViz,
  "softmax": SoftmaxViz,
  "learning-rate": LRScheduleViz,
}

const SUGGESTIONS = [
  "neural network", "attention", "gradient descent",
  "CNN", "LSTM", "dropout", "GAN", "autoencoder",
]

function AICustomViz({ topic, onRedirect }) {
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!topic) return
    let isMounted = true
    setLoading(true)
    setError(null)
    setGraphData(null)
    
    fetch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/analyze_topic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic })
    })
    .then(res => res.json())
    .then(data => {
      if (isMounted) {
        if (data.type === "existing" && data.id) {
          if (onRedirect) onRedirect(data.id)
        } else {
          setGraphData(data.data)
        }
        setLoading(false)
      }
    })
    .catch(err => {
      if (isMounted) {
        setError(err.message)
        setLoading(false)
      }
    })
    
    return () => { isMounted = false }
  }, [topic])

  if (loading) {
    return (
      <div style={{ textAlign: "center", color: "var(--t2)", paddingTop: 80 }} className="animate-reveal-up">
        <Loader2 size={36} className="animate-spin" style={{ marginBottom: 16, color: "var(--accent)", margin: "0 auto" }} />
        <h3 style={{ color: "var(--t1)", fontWeight: 700, fontFamily: 'Outfit' }}>Neural Sandbox Processing...</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--t2)' }}>Synthesizing custom node layer architecture for <strong>"{topic}"</strong></p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", color: "var(--t2)", paddingTop: 80 }}>
        <p style={{ color: "var(--red)" }}>Synthesis error: {error}</p>
      </div>
    )
  }

  if (!graphData) return null

  return <UniversalGraphViz data={graphData} topic={topic} />
}

export default function Visualizations() {
  const [query, setQuery] = useState("")
  const [active, setActive] = useState("neural-network")
  const results = searchViz(query)
  
  const displayResults = [...results]
  if (query && !results.some(r => r.label.toLowerCase() === query.toLowerCase())) {
    displayResults.unshift({ id: 'custom-ai', label: `AI Gen: "${query}"`, isCustom: true, query })
  }

  const activeItem = displayResults.find(r => r.id === active) || displayResults[0]
  const Comp = activeItem?.isCustom ? null : COMP_MAP[activeItem?.id]

  function handleSearch(e) {
    const v = e.target.value
    setQuery(v)
    const hits = searchViz(v)
    if (hits.length > 0) {
      if (!hits.find(h => h.id === active)) setActive(hits[0].id)
    } else if (v.trim()) {
      setActive('custom-ai')
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="animate-reveal-up">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 800, marginBottom: 2, fontFamily: 'Outfit' }}>
          Interactive <span className="text-grad">Visualizers</span>
        </h1>
        <p style={{ color: "var(--t2)", fontSize: "0.9rem" }}>
          Query any mathematical network layer to render live physical animations of their nodes.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--t3)" }} />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder='Type a term: "transformer", "backpropagation", "dropout", or ANY math topic...'
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "12px 16px 12px 42px",
            background: "rgba(7,11,20,0.4)",
            border: "1px solid var(--border)",
            borderRadius: 12, color: "var(--t1)",
            fontFamily: "Inter", fontSize: "0.92rem",
            outline: "none", transition: "all 0.2s ease",
          }}
          onFocus={e => {
            e.target.style.borderColor = "rgba(99,102,241,0.3)"
            e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.06)"
          }}
          onBlur={e => {
            e.target.style.borderColor = "var(--border)"
            e.target.style.boxShadow = "none"
          }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setActive(results[0]?.id || "neural-network") }} style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "var(--t2)", cursor: "pointer", fontSize: 16,
          }}>×</button>
        )}
      </div>

      {/* Quick suggestions */}
      {!query && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "var(--t2)", fontSize: "0.78rem", fontWeight: 600, marginRight: 4 }}>Curated suggestions:</span>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => { setQuery(s); const h = searchViz(s); if (h.length) setActive(h[0].id) }}
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                border: "1px solid var(--border)",
                background: "rgba(99,102,241,0.04)",
                color: "var(--t2)",
                fontFamily: "Inter",
                fontSize: "0.78rem",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                e.target.style.background = "rgba(99,102,241,0.08)"
                e.target.style.borderColor = "rgba(99,102,241,0.25)"
                e.target.style.color = "var(--t1)"
              }}
              onMouseLeave={e => {
                e.target.style.background = "rgba(99,102,241,0.04)"
                e.target.style.borderColor = "var(--border)"
                e.target.style.color = "var(--t2)"
              }}
            >{s}</button>
          ))}
        </div>
      )}

      {displayResults.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center", background: 'rgba(15,23,42,0.4)' }}>
          <Brain size={36} style={{ color: "var(--t3)", marginBottom: 12, margin: '0 auto' }} />
          <p style={{ color: "var(--t2)", fontSize: '0.9rem' }}>No modules found. Try a different search parameter.</p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Sidebar topic list */}
          <div style={{
            width: 220, display: "flex", flexDirection: "column", gap: 6,
            background: "rgba(7,11,20,0.4)", borderRadius: 14, padding: 10,
            border: "1px solid var(--border)", flexShrink: 0,
          }}>
            <p style={{ color: "var(--t2)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: '0.08em', padding: "4px 8px 8px" }}>
              {displayResults.length} interactive fields
            </p>
            {displayResults.map(v => {
              const Icon = v.isCustom ? Wand2 : (ICON_MAP[v.id] || Brain)
              const isAct = activeItem?.id === v.id
              const activeColor = v.isCustom ? "var(--accent)" : "var(--p3)"
              const activeBg = v.isCustom ? "rgba(14,165,233,0.08)" : "rgba(99,102,241,0.08)"
              const activeBorder = v.isCustom ? "rgba(14,165,233,0.25)" : "rgba(99,102,241,0.25)"
              return (
                <button key={v.id} onClick={() => setActive(v.id)} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: isAct ? `1px solid ${activeBorder}` : "1px solid transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  background: isAct ? activeBg : "transparent",
                  color: isAct ? "var(--t1)" : "var(--t2)",
                  fontFamily: "Inter",
                  fontSize: "0.85rem",
                  fontWeight: isAct ? 600 : 500,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => {
                  if (!isAct) e.currentTarget.style.color = "var(--t1)"
                }}
                onMouseLeave={e => {
                  if (!isAct) e.currentTarget.style.color = "var(--t2)"
                }}
                >
                  <Icon size={14} style={{ color: isAct ? activeColor : "inherit", flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.label}</span>
                </button>
              )
            })}
          </div>

          {/* Visualization panel */}
          <div className="card" style={{ flex: 1, padding: 24, minHeight: 460, background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            {activeItem?.isCustom ? (
              <AICustomViz topic={activeItem.query} onRedirect={(id) => {
                setQuery("")
                setActive(id)
              }} />
            ) : Comp ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className="animate-reveal-up">
                <Comp />
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "var(--t2)", paddingTop: 100, flex: 1 }}>
                <Brain size={36} style={{ marginBottom: 12, margin: '0 auto', opacity: 0.3 }} />
                <p style={{ fontSize: '0.88rem' }}>Select a topic tab to display the interactive sandbox.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
