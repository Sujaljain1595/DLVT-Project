import { useRef, useEffect, useState } from 'react'

/* ── Self-Attention ── */
export function AttentionViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const tokens = ['The', 'cat', 'sat', 'on', 'the', 'mat']
    const n = tokens.length
    const spacing = (W - 100) / (n - 1)
    const rowY = [80, H - 80]
    const attn = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => Math.exp(-Math.abs(i - j) * 0.6 + Math.random() * 0.5))
    )
    const sums = attn.map(row => row.reduce((a, b) => a + b, 0))
    const weights = attn.map((row, i) => row.map(v => v / sums[i]))
    function draw(t) {
      ctx.clearRect(0, 0, W, H)
      const focus = Math.floor(t / 60) % n
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const w = weights[focus][j]
          const x1 = 50 + focus * spacing, y1 = rowY[0]
          const x2 = 50 + j * spacing, y2 = rowY[1]
          if (w > 0.08) {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
            const pulse = Math.sin(t * 0.05 + j) * 0.3 + 0.7
            ctx.strokeStyle = `rgba(139,92,246,${w * pulse * 1.5})`
            ctx.lineWidth = w * 5; ctx.stroke()
          }
        }
      }
      for (let i = 0; i < n; i++) {
        for (let row = 0; row < 2; row++) {
          const x = 50 + i * spacing, y = rowY[row]
          const isActive = row === 0 ? i === focus : weights[focus][i] > 0.12
          const g = ctx.createRadialGradient(x, y, 0, x, y, isActive ? 22 : 14)
          g.addColorStop(0, isActive ? 'rgba(167,139,250,0.9)' : 'rgba(109,40,217,0.5)')
          g.addColorStop(1, 'rgba(109,40,217,0)')
          ctx.beginPath(); ctx.arc(x, y, isActive ? 22 : 14, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
          ctx.beginPath(); ctx.arc(x, y, isActive ? 14 : 10, 0, Math.PI * 2)
          ctx.fillStyle = isActive ? '#7c3aed' : 'rgba(109,40,217,0.6)'; ctx.fill()
          ctx.strokeStyle = isActive ? '#c4b5fd' : 'rgba(196,181,253,0.3)'; ctx.lineWidth = 1.5; ctx.stroke()
          ctx.fillStyle = isActive ? '#fff' : 'rgba(148,163,184,0.7)'
          ctx.font = `${isActive ? 'bold ' : ''}11px Inter`; ctx.textAlign = 'center'
          ctx.fillText(tokens[i], x, y + (row === 0 ? -28 : 30))
        }
      }
      ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '10px Inter'; ctx.textAlign = 'left'
      ctx.fillText(`Query: "${tokens[focus]}"`, 10, H / 2 + 5)
    }
    function loop() { tRef.current++; draw(tRef.current); animRef.current = requestAnimationFrame(loop) }
    loop()
    return () => cancelAnimationFrame(animRef.current)
  }, [])
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: 'var(--p3)', marginBottom: 6 }}>Self-Attention Mechanism</h3>
      <p style={{ color: 'var(--t3)', fontSize: '0.82rem', marginBottom: 16 }}>Line thickness = attention weight. Each query token attends to all keys.</p>
      <canvas ref={canvasRef} width={680} height={260} style={{ maxWidth: '100%', borderRadius: 14, background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)' }} />
    </div>
  )
}

/* ── RNN / LSTM ── */
export function RNNViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const steps = 6
    const sx = Array.from({ length: steps }, (_, i) => 80 + i * ((W - 100) / (steps - 1)))
    const cy_cell = H / 2, cy_inp = H * 0.82, cy_out = H * 0.18
    function drawArrow(x1, y1, x2, y2, col, alpha, lw = 1.5) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
      ctx.strokeStyle = `${col}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
      ctx.lineWidth = lw; ctx.stroke()
      const angle = Math.atan2(y2 - y1, x2 - x1)
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - 8 * Math.cos(angle - 0.4), y2 - 8 * Math.sin(angle - 0.4))
      ctx.lineTo(x2 - 8 * Math.cos(angle + 0.4), y2 - 8 * Math.sin(angle + 0.4))
      ctx.closePath(); ctx.fillStyle = `${col}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`; ctx.fill()
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H)
      const active = Math.floor(t / 40) % steps
      const pulse = Math.sin(t * 0.08) * 0.4 + 0.6
      for (let i = 0; i < steps; i++) {
        const x = sx[i], isAct = i === active, isFade = i < active
        if (i < steps - 1) {
          const wave = Math.sin(t * 0.06 - i * 0.8) * 0.4 + 0.6
          drawArrow(x + 22, cy_cell, sx[i + 1] - 22, cy_cell, '#8b5cf6', isAct ? wave : (isFade ? 0.8 : 0.2), isAct ? 3 : 1.5)
        }
        drawArrow(x, cy_inp + 14, x, cy_cell + 22, '#34d399', isAct ? pulse : (isFade ? 0.6 : 0.2))
        drawArrow(x, cy_cell - 22, x, cy_out - 14, '#f472b6', isAct ? pulse : (isFade ? 0.6 : 0.2))
        const r = isAct ? 22 : 16
        const g = ctx.createRadialGradient(x, cy_cell, 0, x, cy_cell, r)
        g.addColorStop(0, isAct ? 'rgba(139,92,246,0.9)' : 'rgba(109,40,217,0.4)')
        g.addColorStop(1, 'rgba(109,40,217,0)')
        ctx.beginPath(); ctx.arc(x, cy_cell, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); ctx.arc(x, cy_cell, isAct ? 14 : 10, 0, Math.PI * 2)
        ctx.fillStyle = isAct ? '#6d28d9' : 'rgba(109,40,217,0.5)'; ctx.fill()
        ctx.strokeStyle = isAct ? '#c4b5fd' : 'rgba(196,181,253,0.3)'; ctx.lineWidth = 1.5; ctx.stroke()
        ctx.fillStyle = 'rgba(148,163,184,0.7)'; ctx.font = '10px Inter'; ctx.textAlign = 'center'
        ctx.fillText(`LSTM`, x, cy_cell + 30)
        ctx.fillStyle = '#34d399'; ctx.font = '10px Inter'
        ctx.fillText(`x${i + 1}`, x, cy_inp + 32)
        ctx.fillStyle = '#f472b6'
        ctx.fillText(`h${i + 1}`, x, cy_out - 20)
      }
      ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '10px Inter'; ctx.textAlign = 'left'
      ctx.fillText('Hidden state flows →', 12, cy_cell + 5)
    }
    function loop() { tRef.current++; draw(tRef.current); animRef.current = requestAnimationFrame(loop) }
    loop()
    return () => cancelAnimationFrame(animRef.current)
  }, [])
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: 'var(--p3)', marginBottom: 6 }}>RNN / LSTM Unrolled</h3>
      <p style={{ color: 'var(--t3)', fontSize: '0.82rem', marginBottom: 16 }}>Green = input xₜ. Purple = hidden state hₜ flowing right. Pink = output at each step.</p>
      <canvas ref={canvasRef} width={680} height={280} style={{ maxWidth: '100%', borderRadius: 14, background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)' }} />
    </div>
  )
}

/* ── Dropout ── */
export function DropoutViz() {
  const [rate, setRate] = useState(0.5)
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  const droppedRef = useRef(new Set())
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const layers = [5, 8, 8, 5]
    const nodes = layers.map((n, li) => {
      const x = 70 + (li * (W - 140)) / (layers.length - 1)
      return Array.from({ length: n }, (_, ni) => ({ x, y: (H / (n + 1)) * (ni + 1) }))
    })
    let frameCount = 0
    function reshuffleDrop() {
      droppedRef.current = new Set()
      nodes.slice(1, -1).forEach((lnodes, lIdx) =>
        lnodes.forEach((_, ni) => { if (Math.random() < rate) droppedRef.current.add(`${lIdx + 1}-${ni}`) })
      )
    }
    reshuffleDrop()
    function isDropped(li, ni) { return droppedRef.current.has(`${li}-${ni}`) }
    function draw(t) {
      ctx.clearRect(0, 0, W, H)
      for (let li = 0; li < layers.length - 1; li++)
        for (let ni = 0; ni < nodes[li].length; ni++)
          for (let nj = 0; nj < nodes[li + 1].length; nj++) {
            if (isDropped(li, ni) || isDropped(li + 1, nj)) continue
            const n1 = nodes[li][ni], n2 = nodes[li + 1][nj]
            const w = Math.sin(t * 0.02 + ni * 0.5) * 0.4 + 0.6
            ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y)
            ctx.strokeStyle = `rgba(139,92,246,${0.1 + w * 0.2})`; ctx.lineWidth = 0.8; ctx.stroke()
          }
      nodes.forEach((lnodes, li) => lnodes.forEach((node, ni) => {
        const dropped = isDropped(li, ni)
        const pulse = Math.sin(t * 0.04 + li + ni) * 0.4 + 0.6
        ctx.beginPath(); ctx.arc(node.x, node.y, dropped ? 7 : 9, 0, Math.PI * 2)
        ctx.fillStyle = dropped ? 'rgba(100,100,100,0.2)' : `rgba(139,92,246,${0.4 + pulse * 0.4})`; ctx.fill()
        ctx.strokeStyle = dropped ? 'rgba(100,100,100,0.3)' : `rgba(196,181,253,${0.5 + pulse * 0.4})`
        ctx.lineWidth = 1.5; ctx.stroke()
        if (dropped) {
          ctx.fillStyle = 'rgba(239,68,68,0.7)'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'
          ctx.fillText('×', node.x, node.y + 4)
        }
      }))
    }
    function loop() {
      tRef.current++; frameCount++
      if (frameCount % 80 === 0) reshuffleDrop()
      draw(tRef.current); animRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(animRef.current)
  }, [rate])
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: 'var(--p3)', marginBottom: 6 }}>Dropout Regularization</h3>
      <p style={{ color: 'var(--t3)', fontSize: '0.82rem', marginBottom: 12 }}>Red × = dropped neurons. Active neurons form a thinner random sub-network each forward pass.</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
        <span style={{ color: 'var(--t2)', fontSize: '0.85rem' }}>Dropout Rate:</span>
        <input type="range" min={0} max={0.9} step={0.1} value={rate} onChange={e => setRate(+e.target.value)}
          style={{ width: 140, accentColor: '#7c3aed' }} />
        <span style={{ color: '#a78bfa', fontWeight: 700, minWidth: 32 }}>{(rate * 100).toFixed(0)}%</span>
      </div>
      <canvas ref={canvasRef} width={680} height={280} style={{ maxWidth: '100%', borderRadius: 14, background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)' }} />
    </div>
  )
}

/* ── Batch Normalization ── */
export function BatchNormViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    function gaussians(mean, std, n) { return Array.from({ length: n }, () => mean + std * (Math.random() * 2 - 1) * Math.sqrt(3)) }
    const rawData = [...gaussians(80, 30, 40), ...gaussians(-40, 20, 30)]
    const mu = rawData.reduce((a, b) => a + b) / rawData.length
    const sig = Math.sqrt(rawData.reduce((a, v) => a + (v - mu) ** 2, 0) / rawData.length)
    const normData = rawData.map(v => (v - mu) / (sig + 1e-5))
    function drawHist(data, ox, ow, oh, col, label) {
      const min = Math.min(...data), max = Math.max(...data)
      const bins = 20
      const counts = new Array(bins).fill(0)
      data.forEach(v => { const b = Math.min(bins - 1, Math.floor(((v - min) / (max - min)) * bins)); counts[b]++ })
      const maxC = Math.max(...counts)
      const bw = ow / bins
      counts.forEach((c, i) => {
        const bh = (c / maxC) * oh * 0.8
        ctx.beginPath()
        ctx.rect(ox + i * bw, H / 2 - bh - 10 + 60, bw - 1, bh)
        ctx.fillStyle = col + '99'; ctx.fill()
        ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.stroke()
      })
      ctx.fillStyle = col; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'
      ctx.fillText(label, ox + ow / 2, H / 2 + 65)
      ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '10px Inter'
      ctx.fillText(`μ=${mean(data).toFixed(1)}  σ=${std(data).toFixed(1)}`, ox + ow / 2, H / 2 + 80)
    }
    const mean = d => d.reduce((a, b) => a + b) / d.length
    const std = d => { const m = mean(d); return Math.sqrt(d.reduce((a, v) => a + (v - m) ** 2, 0) / d.length) }
    function draw(t) {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '11px Inter'; ctx.textAlign = 'center'
      ctx.fillText('Before BatchNorm', W * 0.25, 30)
      ctx.fillText('After BatchNorm', W * 0.75, 30)
      drawHist(rawData, 20, W / 2 - 40, H * 0.5, '#f472b6', 'Raw Activations')
      drawHist(normData, W / 2 + 20, W / 2 - 40, H * 0.5, '#34d399', 'Normalized (μ≈0, σ≈1)')
      const ax = W / 2; const ay = H * 0.2
      const pulse = Math.abs(Math.sin(t * 0.04)) * 0.5 + 0.5
      ctx.fillStyle = `rgba(251,191,36,${pulse})`; ctx.font = 'bold 22px Inter'
      ctx.textAlign = 'center'; ctx.fillText('→', ax, ay + 5)
      ctx.fillStyle = 'rgba(251,191,36,0.5)'; ctx.font = '9px Inter'
      ctx.fillText('normalize', ax, ay + 20)
    }
    function loop() { tRef.current++; draw(tRef.current); animRef.current = requestAnimationFrame(loop) }
    loop()
    return () => cancelAnimationFrame(animRef.current)
  }, [])
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: 'var(--p3)', marginBottom: 6 }}>Batch Normalization</h3>
      <p style={{ color: 'var(--t3)', fontSize: '0.82rem', marginBottom: 16 }}>BatchNorm shifts and scales activations to zero mean and unit variance — stabilizing training.</p>
      <canvas ref={canvasRef} width={680} height={300} style={{ maxWidth: '100%', borderRadius: 14, background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)' }} />
    </div>
  )
}
