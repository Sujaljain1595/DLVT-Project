import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignIn, useClerk } from '@clerk/clerk-react'
import { BrainCircuit, Mail, ArrowLeft, Loader2, KeyRound, ShieldCheck, Lock, Eye, EyeOff, Check } from 'lucide-react'

export default function ForgotPassword() {
  const { isLoaded, signIn } = useSignIn()
  const clerk = useClerk()
  const navigate = useNavigate()

  const [step, setStep] = useState('email') // 'email' or 'reset'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match: password === confirmPassword && confirmPassword.length > 0,
  }

  const satisfiedCount = [passwordChecks.length, passwordChecks.upper, passwordChecks.lower, passwordChecks.number, passwordChecks.special].filter(Boolean).length

  const handleSendCode = async (e) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    setLoading(true)
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      setStep('reset')
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!isLoaded) return
    if (!passwordChecks.match) {
      return setError("Passwords don't match")
    }
    const allRulesMet = passwordChecks.length && passwordChecks.upper && passwordChecks.lower && passwordChecks.number && passwordChecks.special
    if (!allRulesMet) {
      return setError("Please satisfy all password requirements first.")
    }
    if (code.length < 6) {
      return setError('Please enter the 6-digit verification code.')
    }

    setError('')
    setLoading(true)
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      })

      if (result.status === 'complete') {
        await clerk.setActive({ session: result.createdSessionId })
        navigate('/dashboard')
      } else {
        setError(`Reset incomplete: status is ${result.status}`)
      }
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Premium ambient glows */}
      <div style={{ position: 'absolute', top: '20%', left: '25%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(79, 70, 229, 0.05) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="card animate-reveal-up" style={{ width: '100%', maxWidth: 420, padding: '40px 36px', zIndex: 1, boxShadow: 'var(--shadow-xl), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
        
        {step === 'email' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ display: 'inline-flex', background: 'var(--grad)', borderRadius: 18, padding: 14, marginBottom: 16, boxShadow: 'var(--glow-p)' }}>
                <BrainCircuit size={26} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 6, fontFamily: 'Outfit', letterSpacing: '-0.03em' }}>Reset Password</h1>
              <p style={{ color: 'var(--t2)', fontSize: '0.88rem' }}>Enter your email to receive a password reset code</p>
            </div>

            <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                  <input
                    id="fp-email"
                    className="input"
                    type="email"
                    placeholder="you@example.com"
                    style={{ paddingLeft: 38, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 42, color: 'var(--t1)' }}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: '0.83rem', lineHeight: 1.4 }}>
                  {error}
                </div>
              )}

              <button className="btn btn-primary" type="submit" disabled={loading || !isLoaded} style={{ width: '100%', padding: '12px', height: 44, boxShadow: 'var(--glow-p)' }}>
                {loading ? <Loader2 size={17} className="animate-spin" /> : 'Send Reset Code'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link to="/login" style={{ color: 'var(--t2)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--t1)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--t2)'}>
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ display: 'inline-flex', background: 'var(--grad)', borderRadius: 18, padding: 14, marginBottom: 16, boxShadow: 'var(--glow-p)' }}>
                <KeyRound size={26} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 6, fontFamily: 'Outfit', letterSpacing: '-0.03em' }}>Set New Password</h1>
              <p style={{ color: 'var(--t2)', fontSize: '0.88rem', lineHeight: 1.4 }}>
                We've sent a verification code to <strong style={{ color: 'var(--accent2)' }}>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600, textAlign: 'center' }}>
                  Verification Code
                </label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', zIndex: 2 }} />
                  <input
                    id="fp-otp-code"
                    className="input"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    style={{
                      paddingLeft: 38,
                      textAlign: 'center',
                      fontSize: '1.2rem',
                      letterSpacing: '0.2em',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      background: 'rgba(7,11,20,0.3)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)',
                      width: '100%',
                      height: 44,
                      color: 'var(--t1)'
                    }}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                  <input
                    id="fp-new-password"
                    className="input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    style={{ paddingLeft: 38, paddingRight: 42, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 42, color: 'var(--t1)' }}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
                      color: password.length === 0 ? 'var(--t3)' : satisfiedCount <= 2 ? '#f43f5e' : satisfiedCount <= 4 ? '#fbbf24' : '#10b981',
                      transition: 'color 0.3s ease'
                    }}>
                      {password.length === 0 ? 'Not entered' : satisfiedCount <= 2 ? 'Weak' : satisfiedCount <= 4 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                  <div style={{ height: 5, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ 
                      height: '100%', 
                      width: password.length === 0 ? '0%' : `${(satisfiedCount / 5) * 100}%`, 
                      background: satisfiedCount <= 2 ? 'linear-gradient(90deg, #f43f5e, #fda4af)' : satisfiedCount <= 4 ? 'linear-gradient(90deg, #fbbf24, #fde047)' : 'linear-gradient(90deg, #10b981, #34d399)',
                      boxShadow: password.length === 0 ? 'none' : satisfiedCount <= 2 ? '0 0 8px rgba(244,63,94,0.4)' : satisfiedCount <= 4 ? '0 0 8px rgba(251,191,36,0.4)' : '0 0 8px rgba(16,185,129,0.4)',
                      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s ease, box-shadow 0.4s ease',
                      borderRadius: 3
                    }} />
                  </div>
                </div>

                {/* Password Live Validation Rules */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginTop: 10 }}>
                  {[
                    { label: 'Min 8 characters', ok: passwordChecks.length },
                    { label: 'Uppercase letter', ok: passwordChecks.upper },
                    { label: 'Lowercase letter', ok: passwordChecks.lower },
                    { label: 'Contains number', ok: passwordChecks.number },
                    { label: 'Special character', ok: passwordChecks.special },
                  ].map((rule, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        fontSize: '0.74rem', 
                        color: password ? (rule.ok ? '#34d399' : 'rgba(255,255,255,0.3)') : 'var(--t3)', 
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
                        background: password ? (rule.ok ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.02)') : 'rgba(255,255,255,0.02)',
                        border: password ? (rule.ok ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.1)') : '1px solid rgba(255,255,255,0.08)',
                        color: password ? (rule.ok ? '#34d399' : 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.2)',
                        transition: 'all 0.25s ease'
                      }}>
                        {password ? (
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
                <label style={{ fontSize: '0.8rem', color: 'var(--t2)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                  <input
                    id="fp-confirm-password"
                    className="input"
                    type="password"
                    placeholder="Confirm new password"
                    style={{ paddingLeft: 38, background: 'rgba(7,11,20,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', width: '100%', height: 42, color: 'var(--t1)' }}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword && (
                    <div style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600, 
                        color: passwordChecks.match ? '#34d399' : '#f43f5e',
                        background: passwordChecks.match ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)',
                        padding: '2px 6px',
                        borderRadius: 6,
                        border: passwordChecks.match ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(244,63,94,0.2)'
                      }}>
                        {passwordChecks.match ? 'Match' : 'Mismatch'}
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

              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px', height: 44, boxShadow: 'var(--glow-p)' }}>
                {loading ? <Loader2 size={17} className="animate-spin" /> : 'Reset Password'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button
                onClick={() => {
                  setError('')
                  setStep('email')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--t2)',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--t1)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--t2)'}
              >
                <ArrowLeft size={14} /> Back to Email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
