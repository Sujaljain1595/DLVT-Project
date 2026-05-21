import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrainCircuit, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { SignIn } from '@clerk/clerk-react'

export default function Login() {
  const { login, googleLogin, isMock } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      let friendlyError = err.message || '';
      if (friendlyError.toLowerCase().includes('breach') || friendlyError.toLowerCase().includes('compromised') || friendlyError.toLowerCase().includes('pwned')) {
        friendlyError = "This password was found in known data breaches. Please choose a more secure password.";
      } else if (friendlyError.toLowerCase().includes('user_not_found') || friendlyError.toLowerCase().includes('no user') || friendlyError.toLowerCase().includes('invalid')) {
        friendlyError = "Incorrect email address or password. Please verify your credentials and try again.";
      }
      setError(friendlyError)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      await googleLogin()
    } catch (err) {
      setError(err.message)
    }
  }


  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Premium ambient glows */}
      <div style={{ position: 'absolute', top: '15%', left: '20%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(79, 70, 229, 0.07) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(14, 165, 233, 0.04) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="card animate-reveal-up" style={{ width: '100%', maxWidth: 420, padding: '40px 36px', zIndex: 1, boxShadow: 'var(--shadow-xl), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', background: 'var(--grad)', borderRadius: 18, padding: 14, marginBottom: 18, boxShadow: 'var(--glow-p)' }}>
            <BrainCircuit size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6, fontFamily: 'Outfit', letterSpacing: '-0.03em' }}>Welcome Back</h1>
          <p style={{ color: 'var(--t2)', fontSize: '0.9rem' }}>Sign in to continue your deep learning quest</p>
        </div>

        {/* Google button */}
        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginBottom: 22, padding: '12px', gap: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
          onClick={handleGoogle}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
          <span style={{ color: 'var(--t3)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>or email credentials</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
        </div>

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
              <input
                id="login-email"
                className="input"
                type="email"
                placeholder="you@example.com"
                style={{ paddingLeft: 40, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 44, color: 'var(--t1)' }}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
              <input
                id="login-password"
                className="input"
                type={showPass ? 'text' : 'password'}
                placeholder="Your password"
                style={{ paddingLeft: 40, paddingRight: 44, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 44, color: 'var(--t1)' }}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
              <button 
                type="button" 
                style={{ 
                  position: 'absolute', 
                  right: 14, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--t3)', 
                  cursor: 'pointer',
                  transition: 'color 0.2s, transform 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none',
                  padding: 4
                }} 
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--t1)'
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--t3)'
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                }}
                onClick={() => setShowPass(s => !s)}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: -6 }}>
            <Link to="/forgot-password" style={{ color: 'var(--accent2)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: '0.83rem', lineHeight: 1.4 }}>
              {error}
            </div>
          )}

          <button id="login-submit" className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px', marginTop: 4, height: 44, boxShadow: 'var(--glow-p)' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 26, color: 'var(--t2)', fontSize: '0.85rem' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent2)', fontWeight: 600 }}>Create account</Link>
        </p>
      </div>
    </div>
  )
}
