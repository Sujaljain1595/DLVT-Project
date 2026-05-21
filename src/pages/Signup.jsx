import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrainCircuit, User, Mail, Lock, Eye, EyeOff, Loader2, Check, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { SignUp } from '@clerk/clerk-react'

export default function Signup() {
  const { signup, verifySignupOTP, resendSignupOTP, googleLogin, isMock } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Verification step states
  const [step, setStep] = useState('form') // 'form' or 'otp'
  const [otpCode, setOtpCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const checks = {
    length:  form.password.length >= 8,
    upper:   /[A-Z]/.test(form.password),
    lower:   /[a-z]/.test(form.password),
    number:  /[0-9]/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
    match:   form.password === form.confirm && form.confirm.length > 0,
  }

  const satisfiedCount = [checks.length, checks.upper, checks.lower, checks.number, checks.special].filter(Boolean).length

  const handle = async (e) => {
    e.preventDefault()
    if (!checks.match) return setError("Passwords don't match")
    const allRulesMet = checks.length && checks.upper && checks.lower && checks.number && checks.special
    if (!allRulesMet) return setError("Please satisfy all password requirements first.")
    
    setError('')
    setLoading(true)
    try {
      await signup(form.firstName, form.lastName, form.email, form.password)
      setStep('otp')
    } catch (err) {
      let friendlyError = err.message || '';
      if (friendlyError.toLowerCase().includes('breach') || friendlyError.toLowerCase().includes('compromised') || friendlyError.toLowerCase().includes('pwned')) {
        friendlyError = "This password was found in known data breaches. Please choose a more secure password. Try using a stronger, unique password.";
      } else if (friendlyError.toLowerCase().includes('weak_password') || friendlyError.toLowerCase().includes('too weak')) {
        friendlyError = "This password is too weak. Try adding more letters, numbers, or symbols to make it unique.";
      }
      setError(friendlyError)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!otpCode || otpCode.length < 6) {
      return setError('Please enter the 6-digit code sent to your email.')
    }
    setError('')
    setVerifying(true)
    try {
      await verifySignupOTP(otpCode)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setResending(true)
    setResendSuccess(false)
    try {
      await resendSignupOTP()
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Premium ambient glows */}
      <div style={{ position: 'absolute', top: '15%', right: '20%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(79, 70, 229, 0.06) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '15%', left: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(14, 165, 233, 0.04) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="card animate-reveal-up" style={{ width: '100%', maxWidth: 440, padding: '40px 36px', zIndex: 1, boxShadow: 'var(--shadow-xl), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
        {step === 'form' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ display: 'inline-flex', background: 'var(--grad)', borderRadius: 18, padding: 14, marginBottom: 16, boxShadow: 'var(--glow-p)' }}>
                <BrainCircuit size={26} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 6, fontFamily: 'Outfit', letterSpacing: '-0.03em' }}>Create Account</h1>
              <p style={{ color: 'var(--t2)', fontSize: '0.88rem' }}>Start your journey toward neural network mastery</p>
            </div>

            <button
              className="btn btn-ghost"
              style={{ width: '100%', marginBottom: 20, padding: '12px', gap: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
              onClick={handleGoogle}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Sign up with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
              <span style={{ color: 'var(--t3)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>or fill email details</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
            </div>

            <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* First Name & Last Name (Side by Side) */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>First Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                    <input
                      id="su-first-name"
                      className="input"
                      type="text"
                      placeholder="First name"
                      style={{ paddingLeft: 38, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 42, color: 'var(--t1)' }}
                      value={form.firstName}
                      onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Last Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                    <input
                      id="su-last-name"
                      className="input"
                      type="text"
                      placeholder="Last name"
                      style={{ paddingLeft: 38, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 42, color: 'var(--t1)' }}
                      value={form.lastName}
                      onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                  <input
                    id="su-email"
                    className="input"
                    type="email"
                    placeholder="you@example.com"
                    style={{ paddingLeft: 38, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 42, color: 'var(--t1)' }}
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                  <input
                    id="su-password"
                    className="input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    style={{ paddingLeft: 38, paddingRight: 42, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 42, color: 'var(--t1)' }}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button 
                    type="button" 
                    style={{ 
                      position: 'absolute', 
                      right: 13, 
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
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--t2)', fontWeight: 500 }}>Password Strength:</span>
                    <span style={{ 
                      fontWeight: 700, 
                      color: form.password.length === 0 ? 'var(--t3)' : satisfiedCount <= 2 ? '#f43f5e' : satisfiedCount <= 4 ? '#fbbf24' : '#10b981',
                      transition: 'color 0.3s ease'
                    }}>
                      {form.password.length === 0 ? 'Not entered' : satisfiedCount <= 2 ? 'Weak' : satisfiedCount <= 4 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                  <div style={{ height: 5, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ 
                      height: '100%', 
                      width: form.password.length === 0 ? '0%' : `${(satisfiedCount / 5) * 100}%`, 
                      background: satisfiedCount <= 2 ? 'linear-gradient(90deg, #f43f5e, #fda4af)' : satisfiedCount <= 4 ? 'linear-gradient(90deg, #fbbf24, #fde047)' : 'linear-gradient(90deg, #10b981, #34d399)',
                      boxShadow: form.password.length === 0 ? 'none' : satisfiedCount <= 2 ? '0 0 8px rgba(244,63,94,0.4)' : satisfiedCount <= 4 ? '0 0 8px rgba(251,191,36,0.4)' : '0 0 8px rgba(16,185,129,0.4)',
                      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s ease, box-shadow 0.4s ease',
                      borderRadius: 3
                    }} />
                  </div>
                </div>

                {/* Password Live Validation Rules */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginTop: 10 }}>
                  {[
                    { label: 'Min 8 characters', ok: checks.length },
                    { label: 'Uppercase letter', ok: checks.upper },
                    { label: 'Lowercase letter', ok: checks.lower },
                    { label: 'Contains number', ok: checks.number },
                    { label: 'Special character', ok: checks.special },
                  ].map((rule, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        fontSize: '0.74rem', 
                        color: form.password ? (rule.ok ? '#34d399' : 'rgba(255,255,255,0.3)') : 'var(--t3)', 
                        fontWeight: rule.ok ? 600 : 400,
                        transition: 'color 0.25s ease, font-weight 0.25s ease'
                      }}
                    >
                      <div style={{ 
                        width: 14, 
                        height: 14, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: form.password ? (rule.ok ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.02)') : 'rgba(255,255,255,0.02)',
                        border: form.password ? (rule.ok ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.1)') : '1px solid rgba(255,255,255,0.08)',
                        color: form.password ? (rule.ok ? '#34d399' : 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.2)',
                        transition: 'all 0.25s ease'
                      }}>
                        {form.password ? (
                          rule.ok ? <Check size={9} strokeWidth={3} /> : <span style={{ fontSize: 9 }}>•</span>
                        ) : (
                          <span style={{ fontSize: 9 }}>•</span>
                        )}
                      </div>
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                  <input
                    id="su-confirm"
                    className="input"
                    type="password"
                    placeholder="Confirm password"
                    style={{ paddingLeft: 38, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 42, color: 'var(--t1)' }}
                    value={form.confirm}
                    onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                    required
                  />
                  {form.confirm && (
                    <div style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600, 
                        color: checks.match ? '#34d399' : '#f43f5e',
                        background: checks.match ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)',
                        padding: '2px 6px',
                        borderRadius: 6,
                        border: checks.match ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(244,63,94,0.2)'
                      }}>
                        {checks.match ? 'Match' : 'Mismatch'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: '0.83rem', lineHeight: 1.4 }}>
                  {error}
                </div>
              )}

              <button id="su-submit" className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px', marginTop: 4, height: 44, boxShadow: 'var(--glow-p)' }}>
                {loading ? <Loader2 size={17} className="animate-spin" /> : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--t2)', fontSize: '0.85rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent2)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </>
        ) : (
          /* Verification Screen (OTP Flow) */
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ display: 'inline-flex', background: 'var(--grad)', borderRadius: 18, padding: 14, marginBottom: 16, boxShadow: 'var(--glow-p)' }}>
                <ShieldCheck size={26} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 6, fontFamily: 'Outfit', letterSpacing: '-0.03em' }}>Verify Email</h1>
              <p style={{ color: 'var(--t2)', fontSize: '0.88rem', lineHeight: 1.4 }}>
                We've sent a 6-digit confirmation code to <strong style={{ color: 'var(--accent2)' }}>{form.email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600, textAlign: 'center' }}>
                  Verification Code
                </label>
                <input
                  id="su-otp-code"
                  className="input"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    letterSpacing: '0.4em',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    background: 'rgba(7,11,20,0.3)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    width: '100%',
                    height: 52,
                    color: 'var(--t1)'
                  }}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: '0.83rem', lineHeight: 1.4 }}>
                  {error}
                </div>
              )}

              <button id="su-otp-submit" className="btn btn-primary" type="submit" disabled={verifying} style={{ width: '100%', padding: '12px', height: 44, boxShadow: 'var(--glow-p)' }}>
                {verifying ? <Loader2 size={17} className="animate-spin" /> : 'Confirm Code'}
              </button>
            </form>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
              <button
                onClick={handleResend}
                disabled={resending || resendSuccess}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendSuccess ? 'var(--green)' : 'var(--accent2)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {resending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Sending Code...
                  </>
                ) : resendSuccess ? (
                  '✓ Verification Code Resent!'
                ) : (
                  'Resend Verification Code'
                )}
              </button>

              <button
                onClick={() => {
                  setError('')
                  setStep('form')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--t3)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.target.style.color = 'var(--t1)'}
                onMouseLeave={e => e.target.style.color = 'var(--t3)'}
              >
                <ArrowLeft size={13} /> Back to Sign Up
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
