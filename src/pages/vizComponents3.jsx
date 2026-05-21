import { useRef, useEffect } from "react"

export function CNNViz() {
  const layers = [
    { label: "Input\n3x224", w: 54, h: 54, color: "#06b6d4", count: 1 },
    { label: "Conv1\n64x112", w: 42, h: 42, color: "#7c3aed", count: 3 },
    { label: "Pool\n64x56", w: 32, h: 32, color: "#a855f7", count: 3 },
    { label: "Conv2\n128x28", w: 24, h: 24, color: "#ec4899", count: 4 },
    { label: "FC\n4096", w: 14, h: 56, color: "#f59e0b", count: 1 },
    { label: "Out\n1000", w: 10, h: 36, color: "#10b981", count: 1 },
  ]
  return (
    <div style={{textAlign:"center"}}>
      <h3 style={{color:"var(--p3)",marginBottom:6}}>CNN Architecture</h3>
      <p style={{color:"var(--t3)",fontSize:"0.82rem",marginBottom:20}}>Feature maps shrink spatially as depth increases through convolution and pooling.</p>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,flexWrap:"wrap",padding:24,background:"rgba(0,0,0,0.45)",borderRadius:14,border:"1px solid var(--border)"}}>
        {layers.map((layer,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{position:"relative",width:layer.w+12,height:layer.h}}>
              {Array.from({length:Math.min(layer.count,4)},(_,j)=>(
                <div key={j} style={{position:j===0?"relative":"absolute",top:j===0?0:-j*3,left:j===0?0:j*3,width:layer.w,height:layer.h,background:layer.color+"25",border:`2px solid ${layer.color}`,borderRadius:4,boxShadow:`0 0 10px ${layer.color}50`}}/>
              ))}
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"0.6rem",color:layer.color,fontWeight:700,whiteSpace:"pre",lineHeight:1.4}}>{layer.label}</div>
            </div>
            {i<layers.length-1&&<span style={{color:"var(--t3)",fontSize:"1.1rem"}}>{"?"}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function LossCurveViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  useEffect(()=>{
    const canvas = canvasRef.current; if(!canvas) return
    const ctx = canvas.getContext("2d")
    const W = canvas.width, H = canvas.height
    const pad = 50, maxEpoch = 50
    const loss = (e,noise,start,decay)=> start*Math.exp(-e*decay)+0.1+noise*(Math.random()-0.5)*0.12
    const trainPts=[], valPts=[]
    for(let e=1;e<=maxEpoch;e++){trainPts.push(loss(e,1,2.5,0.1));valPts.push(loss(e,1.5,2.8,0.08))}
    const maxL=Math.max(...trainPts,...valPts)
    const tx=e=>pad+(e/maxEpoch)*(W-2*pad)
    const ty=l=>H-pad-(l/maxL)*(H-2*pad)*0.85
    function draw(t){
      ctx.clearRect(0,0,W,H)
      const prog=Math.min(maxEpoch,Math.floor(t/2)+1)
      ctx.strokeStyle="rgba(255,255,255,0.05)";ctx.lineWidth=0.6
      for(let f of[0.25,0.5,0.75]){ctx.beginPath();ctx.moveTo(pad,ty(maxL*f));ctx.lineTo(W-pad,ty(maxL*f));ctx.stroke()}
      const drawLine=(pts,col,dash=[])=>{
        ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=col;ctx.lineWidth=2.5
        pts.slice(0,prog).forEach((v,i)=>{const px=tx(i+1),py=ty(v);i===0?ctx.moveTo(px,py):ctx.lineTo(px,py)})
        ctx.stroke();ctx.setLineDash([])
      }
      drawLine(trainPts,"#7c3aed",[])
      drawLine(valPts,"#ec4899",[6,4])
      if(prog>0){
        const px=tx(prog),py=ty(trainPts[prog-1])
        const g=ctx.createRadialGradient(px,py,0,px,py,10)
        g.addColorStop(0,"rgba(124,58,237,0.9)");g.addColorStop(1,"rgba(124,58,237,0)")
        ctx.beginPath();ctx.arc(px,py,10,0,Math.PI*2);ctx.fillStyle=g;ctx.fill()
      }
      ctx.fillStyle="rgba(148,163,184,0.6)";ctx.font="11px Inter";ctx.textAlign="center"
      ctx.fillText("Epoch",W/2,H-12)
      ctx.fillStyle="#7c3aed";ctx.textAlign="left";ctx.fillText("— Train",W-120,30)
      ctx.fillStyle="#ec4899";ctx.fillText("--- Val",W-120,48)
    }
    function loop(){tRef.current++;draw(tRef.current);animRef.current=requestAnimationFrame(loop)}
    loop()
    return()=>cancelAnimationFrame(animRef.current)
  },[])
  return(
    <div style={{textAlign:"center"}}>
      <h3 style={{color:"var(--p3)",marginBottom:6}}>Training & Validation Loss</h3>
      <p style={{color:"var(--t3)",fontSize:"0.82rem",marginBottom:16}}>Curves animate epoch by epoch. Gap between train/val signals overfitting.</p>
      <canvas ref={canvasRef} width={680} height={300} style={{maxWidth:"100%",borderRadius:14,background:"rgba(0,0,0,0.45)",border:"1px solid var(--border)"}}/>
    </div>
  )
}

export function EmbeddingViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  useEffect(()=>{
    const canvas = canvasRef.current; if(!canvas) return
    const ctx = canvas.getContext("2d")
    const W = canvas.width, H = canvas.height
    const words=[
      {w:"king",x:0.75,y:0.25,c:"#f472b6"},
      {w:"queen",x:0.78,y:0.4,c:"#f472b6"},
      {w:"man",x:0.55,y:0.27,c:"#60a5fa"},
      {w:"woman",x:0.58,y:0.42,c:"#60a5fa"},
      {w:"dog",x:0.2,y:0.7,c:"#34d399"},
      {w:"cat",x:0.28,y:0.72,c:"#34d399"},
      {w:"Paris",x:0.7,y:0.75,c:"#fb923c"},
      {w:"France",x:0.62,y:0.68,c:"#fb923c"},
      {w:"deep",x:0.15,y:0.3,c:"#a78bfa"},
      {w:"learning",x:0.22,y:0.35,c:"#a78bfa"},
    ]
    const pairs=[[0,1],[2,3],[4,5],[6,7],[8,9]]
    function draw(t){
      ctx.clearRect(0,0,W,H)
      pairs.forEach(([a,b])=>{
        const wa=words[a],wb=words[b]
        const pulse=Math.sin(t*0.04)*0.3+0.7
        ctx.beginPath()
        ctx.moveTo(wa.x*W,wa.y*H);ctx.lineTo(wb.x*W,wb.y*H)
        ctx.strokeStyle=wa.c+(Math.round(pulse*100).toString(16).padStart(2,"0"))
        ctx.lineWidth=1.5;ctx.stroke()
      })
      words.forEach(({w,x,y,c})=>{
        const px=x*W,py=y*H
        const pulse=Math.sin(t*0.03+px*0.01)*0.3+0.7
        const g=ctx.createRadialGradient(px,py,0,px,py,20)
        g.addColorStop(0,c+"99");g.addColorStop(1,c+"00")
        ctx.beginPath();ctx.arc(px,py,20,0,Math.PI*2);ctx.fillStyle=g;ctx.fill()
        ctx.beginPath();ctx.arc(px,py,6,0,Math.PI*2);ctx.fillStyle=c;ctx.fill()
        ctx.fillStyle="#fff";ctx.font="11px Inter";ctx.textAlign="left"
        ctx.fillText(w,px+10,py+4)
      })
      ctx.strokeStyle="rgba(251,191,36,0.6)";ctx.lineWidth=1;ctx.setLineDash([4,4])
      ctx.beginPath();ctx.moveTo(words[0].x*W,words[0].y*H);ctx.lineTo(words[2].x*W,words[2].y*H);ctx.stroke()
      ctx.beginPath();ctx.moveTo(words[1].x*W,words[1].y*H);ctx.lineTo(words[3].x*W,words[3].y*H);ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle="rgba(251,191,36,0.6)";ctx.font="9px Inter"
      ctx.fillText("king-man ˜ queen-woman",W/2-50,H-10)
    }
    function loop(){tRef.current++;draw(tRef.current);animRef.current=requestAnimationFrame(loop)}
    loop()
    return()=>cancelAnimationFrame(animRef.current)
  },[])
  return(
    <div style={{textAlign:"center"}}>
      <h3 style={{color:"var(--p3)",marginBottom:6}}>Word Embeddings</h3>
      <p style={{color:"var(--t3)",fontSize:"0.82rem",marginBottom:16}}>Similar words cluster together. Dashed lines show analogy: king - man + woman = queen.</p>
      <canvas ref={canvasRef} width={680} height={300} style={{maxWidth:"100%",borderRadius:14,background:"rgba(0,0,0,0.45)",border:"1px solid var(--border)"}}/>
    </div>
  )
}

export function AutoencoderViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  useEffect(()=>{
    const canvas = canvasRef.current; if(!canvas) return
    const ctx = canvas.getContext("2d")
    const W = canvas.width, H = canvas.height
    const encLayers=[6,4,2],decLayers=[2,4,6]
    const allLayers=[...encLayers,...decLayers.slice(1)]
    const nodePos=allLayers.map((n,li)=>{
      const x=50+(li*(W-100))/(allLayers.length-1)
      return Array.from({length:n},(_,ni)=>({x,y:(H/(n+1))*(ni+1)}))
    })
    function draw(t){
      ctx.clearRect(0,0,W,H)
      const bottleneck=Math.floor(allLayers.length/2)
      for(let li=0;li<allLayers.length-1;li++){
        const isEnc=li<bottleneck
        for(const n1 of nodePos[li]) for(const n2 of nodePos[li+1]){
          const w=Math.sin(t*0.02+n1.y*0.02)*0.4+0.6
          ctx.beginPath();ctx.moveTo(n1.x,n1.y);ctx.lineTo(n2.x,n2.y)
          ctx.strokeStyle=isEnc?`rgba(96,165,250,${0.08+w*0.12})`:`rgba(52,211,153,${0.08+w*0.12})`
          ctx.lineWidth=0.7;ctx.stroke()
        }
      }
      nodePos.forEach((lnodes,li)=>{
        const isBottleneck=li===bottleneck
        const isEnc=li<bottleneck
        const col=isBottleneck?"#f59e0b":isEnc?"#60a5fa":"#34d399"
        lnodes.forEach((node,ni)=>{
          const pulse=Math.sin(t*0.04+li+ni)*0.4+0.6
          const r=isBottleneck?14:9
          const g=ctx.createRadialGradient(node.x,node.y,0,node.x,node.y,r*2)
          g.addColorStop(0,col+(Math.round((0.5+pulse*0.4)*255).toString(16).padStart(2,"0")))
          g.addColorStop(1,col+"00")
          ctx.beginPath();ctx.arc(node.x,node.y,r*2,0,Math.PI*2);ctx.fillStyle=g;ctx.fill()
          ctx.beginPath();ctx.arc(node.x,node.y,r,0,Math.PI*2);ctx.fillStyle=col+"99";ctx.fill()
          ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.stroke()
        })
      })
      ctx.fillStyle="rgba(148,163,184,0.6)";ctx.font="10px Inter";ctx.textAlign="center"
      ctx.fillText("Encoder",W*0.25,H-8)
      ctx.fillStyle="#f59e0b";ctx.fillText("Latent",W*0.5,H-8)
      ctx.fillStyle="rgba(148,163,184,0.6)";ctx.fillText("Decoder",W*0.75,H-8)
    }
    function loop(){tRef.current++;draw(tRef.current);animRef.current=requestAnimationFrame(loop)}
    loop()
    return()=>cancelAnimationFrame(animRef.current)
  },[])
  return(
    <div style={{textAlign:"center"}}>
      <h3 style={{color:"var(--p3)",marginBottom:6}}>Autoencoder</h3>
      <p style={{color:"var(--t3)",fontSize:"0.82rem",marginBottom:16}}>Blue = encoder compresses. Gold = latent bottleneck. Green = decoder reconstructs.</p>
      <canvas ref={canvasRef} width={680} height={290} style={{maxWidth:"100%",borderRadius:14,background:"rgba(0,0,0,0.45)",border:"1px solid var(--border)"}}/>
    </div>
  )
}

export function GANViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  useEffect(()=>{
    const canvas = canvasRef.current; if(!canvas) return
    const ctx = canvas.getContext("2d")
    const W = canvas.width, H = canvas.height
    const fakeScore={current:0.3},realScore={current:0.9}
    function draw(t){
      ctx.clearRect(0,0,W,H)
      const phase=Math.floor(t/120)%2
      fakeScore.current=0.3+0.6*Math.abs(Math.sin(t*0.015))
      realScore.current=0.7+0.25*Math.abs(Math.sin(t*0.01+1))
      const genCol="#8b5cf6",discCol="#f472b6"
      const gx=W*0.22,gy=H*0.5,gw=130,gh=80
      ctx.beginPath();ctx.roundRect(gx-gw/2,gy-gh/2,gw,gh,10)
      ctx.fillStyle="rgba(139,92,246,0.15)";ctx.fill()
      ctx.strokeStyle=genCol+(phase===0?"ff":"66");ctx.lineWidth=2;ctx.stroke()
      ctx.fillStyle=genCol;ctx.font="bold 13px Inter";ctx.textAlign="center"
      ctx.fillText("Generator",gx,gy+5)
      const dx=W*0.78,dy=H*0.5,dw=130,dh=80
      ctx.beginPath();ctx.roundRect(dx-dw/2,dy-dh/2,dw,dh,10)
      ctx.fillStyle="rgba(244,114,182,0.15)";ctx.fill()
      ctx.strokeStyle=discCol+(phase===1?"ff":"66");ctx.lineWidth=2;ctx.stroke()
      ctx.fillStyle=discCol;ctx.font="bold 13px Inter"
      ctx.fillText("Discriminator",dx,dy+5)
      const fakeX=W*0.5,fakeY=H*0.35
      ctx.beginPath();ctx.roundRect(fakeX-45,fakeY-18,90,36,8)
      ctx.fillStyle="rgba(139,92,246,0.2)";ctx.fill();ctx.strokeStyle="#8b5cf6";ctx.lineWidth=1.5;ctx.stroke()
      ctx.fillStyle="#c4b5fd";ctx.font="11px Inter";ctx.fillText("Fake Sample",fakeX,fakeY+5)
      const realX=W*0.5,realY=H*0.65
      ctx.beginPath();ctx.roundRect(realX-45,realY-18,90,36,8)
      ctx.fillStyle="rgba(52,211,153,0.2)";ctx.fill();ctx.strokeStyle="#34d399";ctx.lineWidth=1.5;ctx.stroke()
      ctx.fillStyle="#6ee7b7";ctx.font="11px Inter";ctx.fillText("Real Sample",realX,realY+5)
      const drawArrow=(x1,y1,x2,y2,col)=>{
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2)
        ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.stroke()
      }
      drawArrow(gx+gw/2,gy,fakeX-46,fakeY,genCol)
      drawArrow(fakeX+46,fakeY,dx-dw/2,dy-10,discCol)
      drawArrow(fakeX+46,realY,dx-dw/2,dy+10,"#34d399")
      const scoreX=dx+dw/2+20,scoreY=dy
      ctx.fillStyle="rgba(148,163,184,0.7)";ctx.font="10px Inter";ctx.textAlign="left"
      ctx.fillText(`P(real|fake): ${fakeScore.current.toFixed(2)}`,scoreX,scoreY-10)
      ctx.fillText(`P(real|real): ${realScore.current.toFixed(2)}`,scoreX,scoreY+10)
      const bw=120,bh=8,bx=scoreX,by=scoreY+28
      ctx.fillStyle="rgba(255,255,255,0.1)";ctx.fillRect(bx,by,bw,bh)
      ctx.fillStyle=fakeScore.current>0.5?"#34d399":"#ef4444"
      ctx.fillRect(bx,by,bw*fakeScore.current,bh)
      ctx.fillStyle="rgba(148,163,184,0.5)";ctx.font="9px Inter"
      ctx.fillText("Discriminator fooled?",bx,by+22)
      ctx.fillStyle=phase===0?genCol:discCol;ctx.textAlign="center"
      ctx.font="10px Inter"
      ctx.fillText(phase===0?"Training Generator":"Training Discriminator",W/2,H-10)
    }
    function loop(){tRef.current++;draw(tRef.current);animRef.current=requestAnimationFrame(loop)}
    loop()
    return()=>cancelAnimationFrame(animRef.current)
  },[])
  return(
    <div style={{textAlign:"center"}}>
      <h3 style={{color:"var(--p3)",marginBottom:6}}>GAN Training Dynamics</h3>
      <p style={{color:"var(--t3)",fontSize:"0.82rem",marginBottom:16}}>Generator fools Discriminator; Discriminator learns to tell real from fake — a minimax game.</p>
      <canvas ref={canvasRef} width={680} height={300} style={{maxWidth:"100%",borderRadius:14,background:"rgba(0,0,0,0.45)",border:"1px solid var(--border)"}}/>
    </div>
  )
}

export function SoftmaxViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  useEffect(()=>{
    const canvas = canvasRef.current; if(!canvas) return
    const ctx = canvas.getContext("2d")
    const W = canvas.width, H = canvas.height
    const classes=["Cat","Dog","Bird","Fish","Horse"]
    function softmax(logits){
      const mx=Math.max(...logits)
      const ex=logits.map(l=>Math.exp(l-mx))
      const s=ex.reduce((a,b)=>a+b)
      return ex.map(v=>v/s)
    }
    function draw(t){
      ctx.clearRect(0,0,W,H)
      const logits=classes.map((_,i)=>2*Math.sin(t*0.02+i*1.3)+i*0.3)
      const probs=softmax(logits)
      const bw=80,gap=20,totalW=classes.length*(bw+gap)-gap
      const startX=(W-totalW)/2,maxH=H*0.55,botY=H*0.75
      classes.forEach((cls,i)=>{
        const x=startX+i*(bw+gap)
        const barH=probs[i]*maxH
        const hue=200+i*40
        const col=`hsl(${hue},80%,65%)`
        const isMax=probs[i]===Math.max(...probs)
        if(isMax){
          ctx.shadowColor=col;ctx.shadowBlur=20
        }
        ctx.beginPath();ctx.roundRect(x,botY-barH,bw,barH,6)
        ctx.fillStyle=col+(isMax?"ff":"bb");ctx.fill()
        ctx.shadowBlur=0
        ctx.fillStyle="#fff";ctx.font=`${isMax?"bold ":""}11px Inter`;ctx.textAlign="center"
        ctx.fillText(cls,x+bw/2,botY+18)
        ctx.fillStyle=col;ctx.font="bold 12px Inter"
        ctx.fillText((probs[i]*100).toFixed(1)+"%",x+bw/2,botY-barH-8)
        ctx.fillStyle="rgba(148,163,184,0.5)";ctx.font="10px Inter"
        ctx.fillText(logits[i].toFixed(1),x+bw/2,H-10)
      })
      ctx.fillStyle="rgba(148,163,184,0.5)";ctx.font="10px Inter";ctx.textAlign="center"
      ctx.fillText("Logits (raw scores)",W/2,H-2+10)
      ctx.fillText("Softmax ? Probabilities",W/2,30)
    }
    function loop(){tRef.current++;draw(tRef.current);animRef.current=requestAnimationFrame(loop)}
    loop()
    return()=>cancelAnimationFrame(animRef.current)
  },[])
  return(
    <div style={{textAlign:"center"}}>
      <h3 style={{color:"var(--p3)",marginBottom:6}}>Softmax & Cross-Entropy</h3>
      <p style={{color:"var(--t3)",fontSize:"0.82rem",marginBottom:16}}>Logits (bottom) are transformed by softmax into a probability distribution summing to 1.</p>
      <canvas ref={canvasRef} width={680} height={320} style={{maxWidth:"100%",borderRadius:14,background:"rgba(0,0,0,0.45)",border:"1px solid var(--border)"}}/>
    </div>
  )
}

export function LRScheduleViz() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  useEffect(()=>{
    const canvas = canvasRef.current; if(!canvas) return
    const ctx = canvas.getContext("2d")
    const W = canvas.width, H = canvas.height
    const T=100,pad=50
    const schedules=[
      {name:"Step Decay",f:t=>0.1*Math.pow(0.5,Math.floor(t/25)),col:"#60a5fa"},
      {name:"Cosine Annealing",f:t=>0.1*0.5*(1+Math.cos(Math.PI*t/T)),col:"#f472b6"},
      {name:"Warmup+Decay",f:t=>t<10?0.1*(t/10):0.1*Math.exp(-(t-10)*0.03),col:"#34d399"},
      {name:"Cyclic LR",f:t=>0.005+0.095*Math.abs(Math.sin(Math.PI*t/20)),col:"#fb923c"},
    ]
    const tx=t=>pad+(t/T)*(W-2*pad)
    const ty=lr=>H-pad-(lr/0.12)*(H-2*pad)*0.85
    function draw(time){
      ctx.clearRect(0,0,W,H)
      ctx.strokeStyle="rgba(255,255,255,0.05)";ctx.lineWidth=0.6
      for(let f of[0.25,0.5,0.75]){ctx.beginPath();ctx.moveTo(pad,ty(0.12*f));ctx.lineTo(W-pad,ty(0.12*f));ctx.stroke()}
      schedules.forEach(s=>{
        ctx.beginPath();ctx.strokeStyle=s.col;ctx.lineWidth=2
        for(let t=0;t<=T;t+=0.5){const px=tx(t),py=ty(s.f(t));t===0?ctx.moveTo(px,py):ctx.lineTo(px,py)}
        ctx.stroke()
      })
      const prog=Math.floor(time/2)%T
      schedules.forEach((s,i)=>{
        const px=tx(prog),py=ty(s.f(prog))
        const g=ctx.createRadialGradient(px,py,0,px,py,9)
        g.addColorStop(0,s.col+"cc");g.addColorStop(1,s.col+"00")
        ctx.beginPath();ctx.arc(px,py,9,0,Math.PI*2);ctx.fillStyle=g;ctx.fill()
        ctx.fillStyle=s.col;ctx.font="10px Inter";ctx.textAlign="left"
        ctx.fillText(s.name,W-150,30+i*18)
        const dot=ctx.createRadialGradient(W-160,25+i*18,0,W-160,25+i*18,4)
        dot.addColorStop(0,s.col);dot.addColorStop(1,s.col+"00")
        ctx.beginPath();ctx.arc(W-162,24+i*18,4,0,Math.PI*2);ctx.fillStyle=dot;ctx.fill()
      })
      ctx.fillStyle="rgba(148,163,184,0.6)";ctx.font="11px Inter";ctx.textAlign="center"
      ctx.fillText("Training Step",W/2,H-12)
      ctx.save();ctx.translate(15,H/2);ctx.rotate(-Math.PI/2)
      ctx.fillText("Learning Rate",0,0);ctx.restore()
    }
    function loop(){tRef.current++;draw(tRef.current);animRef.current=requestAnimationFrame(loop)}
    loop()
    return()=>cancelAnimationFrame(animRef.current)
  },[])
  return(
    <div style={{textAlign:"center"}}>
      <h3 style={{color:"var(--p3)",marginBottom:6}}>Learning Rate Schedules</h3>
      <p style={{color:"var(--t3)",fontSize:"0.82rem",marginBottom:16}}>Different strategies for decaying LR over training — dots animate current step.</p>
      <canvas ref={canvasRef} width={680} height={300} style={{maxWidth:"100%",borderRadius:14,background:"rgba(0,0,0,0.45)",border:"1px solid var(--border)"}}/>
    </div>
  )
}
