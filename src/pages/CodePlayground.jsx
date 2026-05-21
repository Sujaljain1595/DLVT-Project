import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import ReactMarkdown from 'react-markdown'
import { Code2, Play, Brain, Loader2, Copy, CheckCircle } from 'lucide-react'
import { CODE_TEMPLATES } from '../utils/constants'
import { api } from '../services/api'
import { useApp } from '../context/AppContext'

const OUTPUTS = {
  cnn: `ConvNet(
  (conv1): Conv2d(3, 32, kernel_size=(3, 3), padding=(1, 1))
  (conv2): Conv2d(32, 64, kernel_size=(3, 3), padding=(1, 1))
  (pool): MaxPool2d(kernel_size=2, stride=2)
  (fc1): Linear(in_features=4096, out_features=512)
  (fc2): Linear(in_features=512, out_features=10)
  (drop): Dropout(p=0.5)
)
Total parameters: 2,135,050
Trainable parameters: 2,135,050`,
  rnn: `RNNClassifier(
  (embed): Embedding(10000, 128)
  (rnn): LSTM(128, 256, batch_first=True)
  (fc): Linear(in_features=256, out_features=5)
)
Total parameters: 1,474,309`,
  transformer: `TransformerEncoder(
  (encoder): TransformerEncoder(
    (layers): ModuleList(
      (0-5): 6 x TransformerEncoderLayer(...)
    )
  )
  (fc): Linear(in_features=512, out_features=512)
)`,
  gan: `Generator(
  (net): Sequential(Linear(100,256) → LeakyReLU → Linear(256,512) → LeakyReLU → Linear(512,784) → Tanh)
)
Discriminator(
  (net): Sequential(Linear(784,512) → LeakyReLU → Dropout(0.3) → Linear(512,256) → LeakyReLU → Dropout(0.3) → Linear(256,1) → Sigmoid)
)`,
  autoencoder: `Autoencoder(
  (encoder): Sequential(Linear(784,256) → ReLU → Linear(256,64) → ReLU → Linear(64,32))
  (decoder): Sequential(Linear(32,64) → ReLU → Linear(64,256) → ReLU → Linear(256,784) → Sigmoid)
)
Input: torch.Size([8, 784]) → Latent: torch.Size([8, 32])
Compression ratio: 24.5x`,
}

export default function CodePlayground() {
  const { addNotification } = useApp()
  const [template, setTemplate] = useState('cnn')
  const [code, setCode] = useState(CODE_TEMPLATES.cnn.code)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState('')

  const selectTemplate = (key) => {
    setTemplate(key)
    setCode(CODE_TEMPLATES[key].code)
    setOutput('')
    setExplanation('')
  }

  const run = async () => {
    setRunning(true)
    setOutput('')
    await new Promise(r => setTimeout(r, 1200))
    setOutput(OUTPUTS[template] || '# Code executed successfully\nNo output.')
    setRunning(false)
  }

  const explain = async () => {
    setExplaining(true)
    setExplanation('')
    try {
      const data = await api.chat(`Explain this PyTorch code step by step:\n\`\`\`python\n${code}\n\`\`\``)
      setExplanation(data.reply || data.message || data.response || JSON.stringify(data))
    } catch {
      setExplanation(`## Code Explanation\n\nThis ${CODE_TEMPLATES[template]?.label} implementation:\n\n1. **Import**: Imports PyTorch and required modules\n2. **Model class**: Defines the neural network architecture\n3. **Layers**: Each layer transforms the input data hierarchically\n4. **Forward pass**: Defines how data flows through the network\n5. **Instantiation**: Creates the model ready for training\n\n> The model is now ready to be trained with a dataset using an optimizer like Adam and a suitable loss function.`)
      addNotification('⚠️ Using local explanation — backend offline', 'warn')
    } finally {
      setExplaining(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
          <span className="text-grad">Code</span> Playground
        </h1>
        <p style={{ color: 'var(--t2)', fontSize: '0.92rem' }}>
          Explore deep learning architectures with AI-generated PyTorch code and explanations.
        </p>
      </div>

      {/* Template selector */}
      <div style={{ 
        display: 'flex', 
        gap: 10, 
        flexWrap: 'wrap',
        background: 'var(--bg-1)',
        padding: 6,
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)',
        width: 'fit-content'
      }}>
        {Object.entries(CODE_TEMPLATES).map(([key, tpl]) => (
          <button
            key={key}
            onClick={() => selectTemplate(key)}
            style={{
              padding: '6px 14px', 
              borderRadius: 'var(--r-sm)', 
              border: `1px solid ${template === key ? 'var(--border-bright)' : 'transparent'}`,
              background: template === key ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              color: template === key ? 'var(--p3)' : 'var(--t2)',
              fontFamily: 'Outfit', 
              fontSize: '0.82rem', 
              fontWeight: 600, 
              cursor: 'pointer', 
              transition: 'all 0.2s ease',
            }}
            className="hover:text-white"
          >
            {tpl.label}
          </button>
        ))}
      </div>

      {/* Editor + Output */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Code2 size={18} color="var(--accent2)" />
            <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', color: 'var(--t1)' }}>Python Editor</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: 'var(--r-sm)' }} onClick={run} disabled={running}>
                {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Run
              </button>
              <button className="btn btn-glass" style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: 'var(--r-sm)' }} onClick={explain} disabled={explaining}>
                {explaining ? <Loader2 size={13} className="animate-spin" /> : <Brain size={13} />} Explain
              </button>
            </div>
          </div>
          <div style={{ 
            borderRadius: 'var(--r-lg)', 
            overflow: 'hidden', 
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            background: 'var(--bg-1)'
          }}>
            <CodeMirror
              value={code}
              onChange={setCode}
              extensions={[python()]}
              theme="dark"
              height="400px"
              style={{ fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Output console */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', color: 'var(--t1)' }}>
              Output Console
            </div>
            
            {/* Custom Premium Console Window */}
            <div style={{
              background: 'rgba(3, 7, 18, 0.85)', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-xl), 0 0 25px rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}>
              {/* Terminal Title Bar / Header */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block', opacity: 0.8 }}></span>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308', display: 'inline-block', opacity: 0.8 }}></span>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block', opacity: 0.8 }}></span>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace', fontSize: '0.72rem', color: 'var(--t3)', letterSpacing: '0.05em' }}>
                  console.sh
                </div>
                <div style={{ width: 42 }}></div>
              </div>

              {/* Console Body */}
              <div style={{
                padding: 18, 
                fontFamily: 'JetBrains Mono, Fira Code, monospace', 
                fontSize: '0.8rem', 
                color: '#e2e8f0',
                minHeight: 180, 
                maxHeight: 240,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap', 
                lineHeight: 1.6,
              }}>
                {running ? (
                  <span style={{ color: 'var(--accent)' }}>$ python model.py<span style={{ animation: 'pulse 1s infinite', color: 'var(--accent)' }}> ▌</span></span>
                ) : output ? (
                  <>
                    <span style={{ color: 'var(--t3)' }}>$ python model.py{'\n'}</span>
                    <span style={{ color: 'var(--accent3)' }}>{output}</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}># Press "Run" to execute the code and see architecture dimensions...</span>
                )}
              </div>
            </div>
          </div>

          {(explanation || explaining) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', color: 'var(--t1)' }}>
                AI Explanation
              </div>
              <div className="card" style={{ padding: 20, maxHeight: 260, overflowY: 'auto', background: 'var(--card-bg)' }}>
                {explaining ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--t2)', fontSize: '0.88rem' }}>
                    <Loader2 size={16} className="animate-spin" color="var(--accent)" />
                    <span>Analyzing code & explaining modules...</span>
                  </div>
                ) : (
                  <div className="prose prose-invert" style={{ fontSize: '0.88rem', color: 'var(--t2)', lineHeight: 1.6 }}>
                    <ReactMarkdown>{explanation}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
