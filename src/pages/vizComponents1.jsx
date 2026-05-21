import { useRef, useEffect } from 'react'

/* ── Neural Network ── */
export function NeuralNetViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const layers = [4, 6, 6, 4, 2]
    const nodePos = layers.map((n, li) => {
      const x = 60 + (li * (W - 120)) / (layers.length - 1)
      return Array.from({ length: n }, (_, ni) => ({ x, y: (H / (n + 1)) * (ni + 1) }))
    })
    const signals = []
    function spawnSignal() {
      const li = Math.floor(Math.random() * (layers.length - 1))
      const ni = Math.floor(Math.random() * layers[li])
      const nj = Math.floor(Math.random() * layers[li + 1])
      signals.push({ li, ni, nj, t: 0 })
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H)
      for (let li = 0; li < layers.length - 1; li++) {
        for (const n1 of nodePos[li]) for (const n2 of nodePos[li + 1]) {
          const w = Math.sin(t * 0.015 + n1.y * 0.03) * 0.5 + 0.5
          ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y)
          ctx.strokeStyle = `rgba(139,92,246,${0.05 + w * 0.15})`; ctx.lineWidth = 0.7; ctx.stroke()
        }
      }
      for (let i = signals.length - 1; i >= 0; i--) {
        const s = signals[i]; s.t += 0.02
        const p = s.t; if (p > 1) { signals.splice(i, 1); continue }
        const n1 = nodePos[s.li][s.ni], n2 = nodePos[s.li + 1][s.nj]
        const bx = n1.x + (n2.x - n1.x) * p, by = n1.y + (n2.y - n1.y) * p
        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 8)
        grd.addColorStop(0, 'rgba(236,72,153,0.9)'); grd.addColorStop(1, 'rgba(236,72,153,0)')
        ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill()
      }
      if (t % 8 === 0) spawnSignal()
      nodePos.forEach((lnodes, li) => lnodes.forEach((node, ni) => {
        const pulse = Math.sin(t * 0.03 + li * 1.2 + ni * 0.8) * 0.5 + 0.5
        const r = 7 + pulse * 3
        const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 2)
        grd.addColorStop(0, `rgba(139,92,246,${0.5 + pulse * 0.5})`); grd.addColorStop(1, 'rgba(109,40,217,0)')
        ctx.beginPath(); ctx.arc(node.x, node.y, r * 2, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill()
        ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(109,40,217,${0.5 + pulse * 0.4})`; ctx.fill()
        ctx.strokeStyle = `rgba(196,181,253,${0.6 + pulse * 0.4})`; ctx.lineWidth = 1.5; ctx.stroke()
      }))
      const lbls = ['Input', 'Hidden 1', 'Hidden 2', 'Hidden 3', 'Output']
      ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '11px Inter'; ctx.textAlign = 'center'
      nodePos.forEach((ln, li) => ctx.fillText(lbls[li], ln[0].x, H - 8))
    }
    function loop() { tRef.current++; draw(tRef.current); animRef.current = requestAnimationFrame(loop) }
    loop()
    return () => cancelAnimationFrame(animRef.current)
  }, [])
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: 'var(--p3)', marginBottom: 6 }}>Animated Neural Network</h3>
      <p style={{ color: 'var(--t3)', fontSize: '0.82rem', marginBottom: 16 }}>Signals (pink) travel through layers. Node brightness = activation level.</p>
      <canvas ref={canvasRef} width={680} height={300} style={{ maxWidth: '100%', borderRadius: 14, background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)' }} />
    </div>
  )
}

/* ── Backpropagation ── */
export function BackpropViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const layers = [3, 5, 5, 3]
    const nodePos = layers.map((n, li) => {
      const x = 70 + (li * (W - 140)) / (layers.length - 1)
      return Array.from({ length: n }, (_, ni) => ({ x, y: (H / (n + 1)) * (ni + 1) }))
    })
    const fwdSignals = [], bwdSignals = []
    function draw(t) {
      ctx.clearRect(0, 0, W, H)
      ctx.font = '11px Inter'; ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(34,211,238,0.7)'; ctx.fillText('Forward Pass →', W * 0.3, 18)
      ctx.fillStyle = 'rgba(251,113,133,0.7)'; ctx.fillText('← Backward Pass', W * 0.7, 18)
      for (let li = 0; li < layers.length - 1; li++)
        for (const n1 of nodePos[li]) for (const n2 of nodePos[li + 1]) {
          ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y)
          ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 0.8; ctx.stroke()
        }
      const phase = Math.floor(t / 80) % 2
      if (t % 6 === 0) {
        if (phase === 0) {
          const li = Math.floor(Math.random() * (layers.length - 1))
          fwdSignals.push({ li, ni: Math.floor(Math.random() * layers[li]), nj: Math.floor(Math.random() * layers[li + 1]), p: 0 })
        } else {
          const li = Math.floor(Math.random() * (layers.length - 1))
          bwdSignals.push({ li, ni: Math.floor(Math.random() * layers[li]), nj: Math.floor(Math.random() * layers[li + 1]), p: 0 })
        }
      }
      for (let i = fwdSignals.length - 1; i >= 0; i--) {
        const s = fwdSignals[i]; s.p += 0.025; if (s.p > 1) { fwdSignals.splice(i, 1); continue }
        const n1 = nodePos[s.li][s.ni], n2 = nodePos[s.li + 1][s.nj]
        const bx = n1.x + (n2.x - n1.x) * s.p, by = n1.y + (n2.y - n1.y) * s.p
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, 7)
        g.addColorStop(0, 'rgba(34,211,238,1)'); g.addColorStop(1, 'rgba(34,211,238,0)')
        ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
      }
      for (let i = bwdSignals.length - 1; i >= 0; i--) {
        const s = bwdSignals[i]; s.p += 0.025; if (s.p > 1) { bwdSignals.splice(i, 1); continue }
        const n1 = nodePos[s.li + 1][s.nj], n2 = nodePos[s.li][s.ni]
        const bx = n1.x + (n2.x - n1.x) * s.p, by = n1.y + (n2.y - n1.y) * s.p
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, 7)
        g.addColorStop(0, 'rgba(251,113,133,1)'); g.addColorStop(1, 'rgba(251,113,133,0)')
        ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
      }
      nodePos.forEach((lnodes, li) => lnodes.forEach(node => {
        const col = phase === 0 ? '34,211,238' : '251,113,133'
        const pulse = Math.sin(t * 0.04 + node.y * 0.02) * 0.5 + 0.5
        ctx.beginPath(); ctx.arc(node.x, node.y, 8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${col},${0.3 + pulse * 0.4})`; ctx.fill()
        ctx.strokeStyle = `rgba(${col},0.8)`; ctx.lineWidth = 1.5; ctx.stroke()
      }))
      const lbls = ['Input', 'Hidden 1', 'Hidden 2', 'Output']
      ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '10px Inter'
      nodePos.forEach((ln, li) => ctx.fillText(lbls[li], ln[0].x, H - 6))
    }
    function loop() { tRef.current++; draw(tRef.current); animRef.current = requestAnimationFrame(loop) }
    loop()
    return () => cancelAnimationFrame(animRef.current)
  }, [])
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: 'var(--p3)', marginBottom: 6 }}>Backpropagation</h3>
      <p style={{ color: 'var(--t3)', fontSize: '0.82rem', marginBottom: 16 }}>Cyan = forward pass activations. Pink = backward gradient flow via chain rule.</p>
      <canvas ref={canvasRef} width={680} height={300} style={{ maxWidth: '100%', borderRadius: 14, background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)' }} />
    </div>
  )
}

/* ── Gradient Descent ── */
export function GradientViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const ballRef = useRef({ x: 0.08, vx: 0 })
  const trailRef = useRef([])
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const loss = x => 2 * Math.pow(x - 0.5, 2) + 0.3 * Math.sin(x * 12) * 0.4 + 0.05
    const pad = 50
    const cx = x => pad + x * (W - 2 * pad)
    const cy = y => H - pad - y * (H - 2 * pad) * 0.85
    function draw() {
      ctx.clearRect(0, 0, W, H)
      ctx.beginPath()
      for (let xi = 0; xi <= 1; xi += 0.005) {
        const px = cx(xi), py = cy(loss(xi))
        xi === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2.5; ctx.stroke()
      ctx.lineTo(cx(1), H - pad); ctx.lineTo(cx(0), H - pad); ctx.closePath()
      ctx.fillStyle = 'rgba(109,40,217,0.07)'; ctx.fill()
      const trail = trailRef.current
      trail.forEach((pt, i) => {
        const alpha = (i / trail.length) * 0.5
        ctx.beginPath(); ctx.arc(cx(pt), cy(loss(pt)), 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(251,113,133,${alpha})`; ctx.fill()
      })
      const bx = cx(ballRef.current.x), by = cy(loss(ballRef.current.x))
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, 18)
      g.addColorStop(0, 'rgba(236,72,153,0.9)'); g.addColorStop(1, 'rgba(236,72,153,0)')
      ctx.beginPath(); ctx.arc(bx, by, 18, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
      ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2); ctx.fillStyle = '#ec4899'; ctx.fill()
      ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '11px Inter'
      ctx.textAlign = 'center'; ctx.fillText('Parameter θ', W / 2, H - 10)
      ctx.textAlign = 'left'; ctx.fillText(`Loss: ${loss(ballRef.current.x).toFixed(3)}`, pad + 8, pad + 20)
    }
    function animate() {
      const b = ballRef.current, eps = 0.001, lr = 0.006
      const grad = (loss(b.x + eps) - loss(b.x - eps)) / (2 * eps)
      b.vx = 0.88 * b.vx - lr * grad
      b.x = Math.max(0.02, Math.min(0.98, b.x + b.vx))
      if (Math.abs(b.x - 0.5) < 0.015 && Math.abs(b.vx) < 0.0003) { b.x = 0.08; b.vx = 0; trailRef.current = [] }
      trailRef.current.push(b.x)
      if (trailRef.current.length > 60) trailRef.current.shift()
      draw(); animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [])
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: 'var(--p3)', marginBottom: 6 }}>Gradient Descent</h3>
      <p style={{ color: 'var(--t3)', fontSize: '0.82rem', marginBottom: 16 }}>Ball rolls down the loss surface. Trail shows optimization path toward the minimum.</p>
      <canvas ref={canvasRef} width={680} height={300} style={{ maxWidth: '100%', borderRadius: 14, background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)' }} />
    </div>
  )
}

/* ── Activation Functions ── */
export function ActivationViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const fns = [
      { name: 'ReLU',    f: x => Math.max(0, x),                           color: '#34d399' },
      { name: 'Sigmoid', f: x => 1 / (1 + Math.exp(-x)),                   color: '#60a5fa' },
      { name: 'Tanh',    f: x => Math.tanh(x),                             color: '#f472b6' },
      { name: 'GELU',    f: x => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))), color: '#fb923c' },
    ]
    const pad = { l: 50, r: 20, t: 30, b: 40 }
    const cw = (W - pad.l - pad.r) / 2, ch = (H - pad.t - pad.b) / 2
    function drawFn(fn, ox, oy, label) {
      const rx = [-3, 3], ry = [-1.2, 1.2]
      const tx = x => ox + ((x - rx[0]) / (rx[1] - rx[0])) * cw
      const ty = y => oy + ch - ((y - ry[0]) / (ry[1] - ry[0])) * ch
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.6
      for (let v = -1; v <= 1; v += 0.5) {
        ctx.beginPath(); ctx.moveTo(ox, ty(v)); ctx.lineTo(ox + cw, ty(v)); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(tx(v * 3), oy); ctx.lineTo(tx(v * 3), oy + ch); ctx.stroke()
      }
      ctx.beginPath(); ctx.moveTo(ox, ty(0)); ctx.lineTo(ox + cw, ty(0)); ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.stroke()
      ctx.beginPath(); ctx.moveTo(tx(0), oy); ctx.lineTo(tx(0), oy + ch); ctx.stroke()
      ctx.beginPath()
      for (let xi = rx[0]; xi <= rx[1]; xi += 0.05) {
        const px = tx(xi), py = ty(fn.f(xi))
        xi === rx[0] ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.strokeStyle = fn.color; ctx.lineWidth = 2.5; ctx.stroke()
      ctx.fillStyle = fn.color; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'left'
      ctx.fillText(label, ox + 6, oy + 20)
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H)
      const positions = [
        [pad.l, pad.t], [pad.l + cw + 10, pad.t],
        [pad.l, pad.t + ch + 20], [pad.l + cw + 10, pad.t + ch + 20]
      ]
      fns.forEach((fn, i) => drawFn(fn, positions[i][0], positions[i][1], fn.name))
      const probe = Math.sin(t * 0.04) * 2.5
      fns.forEach((fn, i) => {
        const ox = positions[i][0], oy = positions[i][1]
        const rx = [-3, 3], ry = [-1.2, 1.2]
        const tx = x => ox + ((x - rx[0]) / (rx[1] - rx[0])) * cw
        const ty = y => oy + ch - ((y - ry[0]) / (ry[1] - ry[0])) * ch
        const px = tx(probe), py = ty(fn.f(probe))
        const g = ctx.createRadialGradient(px, py, 0, px, py, 9)
        g.addColorStop(0, fn.color + 'ff'); g.addColorStop(1, fn.color + '00')
        ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
      })
    }
    function loop() { tRef.current++; draw(tRef.current); animRef.current = requestAnimationFrame(loop) }
    loop()
    return () => cancelAnimationFrame(animRef.current)
  }, [])
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ color: 'var(--p3)', marginBottom: 6 }}>Activation Functions</h3>
      <p style={{ color: 'var(--t3)', fontSize: '0.82rem', marginBottom: 16 }}>White dot scans each function simultaneously — see how outputs differ for the same input.</p>
      <canvas ref={canvasRef} width={680} height={320} style={{ maxWidth: '100%', borderRadius: 14, background: 'rgba(0,0,0,0.45)', border: '1px solid var(--border)' }} />
    </div>
  )
}
