import { useEffect, useRef, useState } from "react"

export default function UniversalGraphViz({ data, topic }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])

  useEffect(() => {
    if (!data || !data.nodes || !data.edges) return
    // Scale nodes from 0-100 to canvas coordinates
    setNodes(data.nodes)
    setEdges(data.edges)
  }, [data])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || nodes.length === 0) return
    const ctx = canvas.getContext('2d')
    let W = canvas.width
    let H = canvas.height

    const getCoord = (id) => {
      const n = nodes.find(n => n.id === id)
      if (!n) return {x: 0, y: 0}
      return {
        x: (n.x / 100) * (W - 100) + 50,
        y: (n.y / 100) * (H - 100) + 50
      }
    }

    const drawBaseEdge = (p1, p2, label) => {
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.strokeStyle = "rgba(99, 102, 241, 0.25)"
      ctx.lineWidth = 1.5
      ctx.stroke()
      if (label) {
         const mx = (p1.x + p2.x)/2
         const my = (p1.y + p2.y)/2
         ctx.fillStyle = "rgba(148, 163, 184, 0.85)"
         ctx.font = "600 12px Outfit"
         ctx.textAlign = "center"
         ctx.fillText(label, mx, my - 10)
      }
    }

    const drawParticle = (p1, p2, t, color="#0ea5e9", size=2.5) => {
      const progress = (t * 0.01) % 1
      const px = p1.x + (p2.x - p1.x) * progress
      const py = p1.y + (p2.y - p1.y) * progress
      ctx.beginPath()
      ctx.arc(px, py, size, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.shadowBlur = 8
      ctx.shadowColor = color
      ctx.fill()
      ctx.shadowBlur = 0
    }

    const drawNode = (n, nx, ny, t, arch) => {
      const pulse = Math.sin(t * 0.05 + n.x) * 0.12 + 0.88
      
      ctx.beginPath()
      if (arch === "cnn" || arch === "detection") {
        const size = 18 * pulse
        ctx.rect(nx - size, ny - size, size * 2, size * 2)
      } else if (arch === "segmentation") {
        // Draw irregular "blob" shape for segments
        for(let i=0; i<8; i++) {
            const ang = (i/8) * Math.PI * 2
            const r = 22 * pulse + Math.sin(t * 0.1 + i) * 4
            const px = nx + Math.cos(ang) * r
            const py = ny + Math.sin(ang) * r
            if(i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
        }
        ctx.closePath()
      } else if (arch === "transformer") {
        // Draw rounded rects
        const w = 55, h = 32
        ctx.roundRect ? ctx.roundRect(nx - w/2, ny - h/2, w, h, 8) : ctx.rect(nx - w/2, ny - h/2, w, h)
      } else {
        ctx.arc(nx, ny, 18 * pulse, 0, Math.PI * 2)
      }
      
      ctx.fillStyle = n.color || "rgba(79, 70, 229, 0.65)"
      ctx.fill()
      ctx.strokeStyle = "#38bdf8"
      ctx.lineWidth = 1.5
      ctx.stroke()
      
      ctx.fillStyle = "#f1f5f9"
      ctx.font = "700 13px Outfit"
      ctx.textAlign = "center"
      ctx.fillText(n.label, nx, ny + 40)
    }

    function loop() {
      tRef.current++
      const t = tRef.current
      ctx.clearRect(0, 0, W, H)
      
      const arch = data.architectureType || "fnn"

      // Background effects
      if (arch === "diffusion") {
        const noiseLevel = Math.max(0, 1 - (t % 200) / 100)
        for(let i=0; i<30; i++) {
          ctx.fillStyle = `rgba(255,255,255,${noiseLevel * 0.15})`
          ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5)
        }
      }

      // Draw Edges & Animations
      edges.forEach(e => {
        const p1 = getCoord(e.source)
        const p2 = getCoord(e.target)
        if(p1 && p2) {
          drawBaseEdge(p1, p2, e.label)
          
          if (arch === "cnn" || arch === "detection") {
            // Moving filter scanner (square particle)
            const progress = ((e.source.length * 8 + t) * 0.01) % 1
            const px = p1.x + (p2.x - p1.x) * progress
            const py = p1.y + (p2.y - p1.y) * progress
            ctx.fillStyle = arch === "detection" ? "rgba(16, 185, 129, 0.85)" : "rgba(14, 165, 233, 0.85)"
            ctx.fillRect(px - 4, py - 4, 8, 8)
            ctx.strokeStyle = "#fff"
            ctx.strokeRect(px - 4, py - 4, 8, 8)
            
            if (arch === "detection" && progress > 0.8) {
              // Draw a bounding box at the target
              ctx.strokeStyle = "rgba(16, 185, 129, 0.5)"
              ctx.strokeRect(p2.x - 20, p2.y - 20, 40, 40)
              ctx.fillStyle = "rgba(16, 185, 129, 0.9)"
              ctx.font = "8px Outfit"
              ctx.fillText("BOX", p2.x - 20, p2.y - 22)
            }
          } else if (arch === "transformer") {
            // Multiple attention rays
            drawParticle(p1, p2, t, "#38bdf8", 2)
            drawParticle(p1, p2, t + 30, "#818cf8", 2)
            drawParticle(p1, p2, t + 60, "#14b8a6", 2)
          } else if (arch === "gan") {
            // Adversarial flow (Generator vs Discriminator)
            const isGen = e.source === "n1" || e.source === "n2"
            drawParticle(p1, p2, t, isGen ? "#38bdf8" : "#818cf8", 3.5)
          } else if (arch === "diffusion") {
            // Gradual flow
            drawParticle(p1, p2, t, "#94a3b8", 2.5)
          } else if (arch === "rnn") {
            // Flow with memory loop indication
            drawParticle(p1, p2, t, "#38bdf8", 2.5)
          } else {
            drawParticle(p1, p2, t, "#10b981", 2.5)
          }
        }
      })

      // Architecture specific overlays before nodes
      if (arch === "transformer") {
        // Draw attention connection arcs randomly between nodes
        if (Math.sin(t*0.1) > 0.8 && nodes.length > 2) {
            const n1 = nodes[1], n2 = nodes[2]
            if (n1 && n2) {
                const p1 = getCoord(n1.id), p2 = getCoord(n2.id)
                ctx.beginPath()
                ctx.moveTo(p1.x, p1.y)
                ctx.quadraticCurveTo(p1.x, p1.y - 40, p2.x, p2.y)
                ctx.strokeStyle = "rgba(56, 189, 248, 0.35)"
                ctx.stroke()
            }
        }
      }

      // Draw Nodes
      nodes.forEach(n => {
        const nx = (n.x / 100) * (W - 100) + 50
        const ny = (n.y / 100) * (H - 100) + 50
        drawNode(n, nx, ny, t, arch)
        
        // Extra node decorations
        if (arch === "rnn" && n.label.toLowerCase().includes("memory")) {
          // Draw self-loop
          ctx.beginPath()
          ctx.arc(nx, ny - 22, 12, Math.PI, 0)
          ctx.strokeStyle = "rgba(56, 189, 248, 0.5)"
          ctx.stroke()
        }
      })

      animRef.current = requestAnimationFrame(loop)
    }
    
    loop()
    return () => cancelAnimationFrame(animRef.current)
  }, [nodes, edges, data])

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <h3 style={{ color: "var(--accent2)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>{topic} Architecture</h3>
      <p style={{ color: "var(--t2)", fontSize: "0.85rem", marginBottom: 20 }}>
        {data.description || "Dynamic AI-generated visualization."}
      </p>
      <div style={{ 
        position: "relative", 
        width: "100%", 
        overflow: "hidden", 
        borderRadius: "var(--r-lg)", 
        background: "rgba(10, 15, 30, 0.45)", 
        border: "1px solid var(--border)", 
        boxShadow: "var(--shadow-xl), inset 0 0 40px rgba(0,0,0,0.5)" 
      }}>
         <canvas 
           ref={canvasRef} 
           width={1000} 
           height={500} 
           style={{ width: "100%", height: "auto", display: "block" }} 
         />
      </div>
    </div>
  )
}
