import { createContext, useContext, useState, useEffect } from 'react'
import { useUser, useAuth as useClerkAuth, useSignIn, useSignUp, useClerk } from '@clerk/clerk-react'

const AuthContext = createContext(null)

const CLERK_KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim()
const HAS_CLERK_KEY = CLERK_KEY && 
                      CLERK_KEY !== 'your_clerk_publishable_key_here' && 
                      (CLERK_KEY.startsWith('pk_test_') || CLERK_KEY.startsWith('pk_live_'))

const SHOULD_USE_CLERK = HAS_CLERK_KEY && localStorage.getItem('dlvt_clerk_bypass') !== 'true'

// ----------------------------------------------------
// 1. Clerk Live Authentication Provider
// ----------------------------------------------------
function ClerkAuthProvider({ children }) {
  const { isLoaded: isUserLoaded, isSignedIn, user: clerkUser } = useUser()
  const { isLoaded: isAuthLoaded, signOut } = useClerkAuth()
  const { signIn, isLoaded: isSignInLoaded } = useSignIn()
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp()
  const clerk = useClerk()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isUserLoaded && isAuthLoaded) {
      if (isSignedIn && clerkUser) {
        const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] || "AI Learner"
        setUser({
          id: clerkUser.id,
          username: fullName,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          avatar: clerkUser.imageUrl,
          createdAt: clerkUser.createdAt,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    }
  }, [isUserLoaded, isAuthLoaded, isSignedIn, clerkUser])

  const login = async (email, password) => {
    if (!isSignInLoaded) throw new Error('Sign in is not loaded yet. Please try again.')
    const result = await signIn.create({
      identifier: email,
      password,
    })
    if (result.status === 'complete') {
      await clerk.setActive({ session: result.createdSessionId })
      return result
    } else {
      throw new Error(`Sign in status incomplete: ${result.status}`)
    }
  }

  const signup = async (firstName, lastName, email, password) => {
    if (!isSignUpLoaded) throw new Error('Sign up is not loaded yet. Please try again.')
    
    const result = await signUp.create({
      emailAddress: email,
      password,
      firstName,
      lastName,
    })

    await signUp.prepareEmailAddressVerification({
      strategy: 'email_code',
    })

    return result
  }

  const logout = async () => {
    await signOut()
    setUser(null)
  }

  const verifySignupOTP = async (code) => {
    if (!isSignUpLoaded) throw new Error('Sign up is not loaded yet.')
    const result = await signUp.attemptEmailAddressVerification({ code })
    if (result.status === 'complete') {
      await clerk.setActive({ session: result.createdSessionId })
      return result
    } else {
      throw new Error(`Verification status incomplete: ${result.status}`)
    }
  }

  const resendSignupOTP = async () => {
    if (!isSignUpLoaded) throw new Error('Sign up is not loaded yet.')
    await signUp.prepareEmailAddressVerification({
      strategy: 'email_code',
    })
  }

  const googleLogin = async () => {
    if (!isSignInLoaded) throw new Error('Sign in is not loaded yet. Please try again.')
    await signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    })
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading: loading || !isSignInLoaded || !isSignUpLoaded,
      login,
      signup,
      logout,
      googleLogin,
      verifySignupOTP,
      resendSignupOTP,
      clerkUser,
      signIn,
      signUp,
      isMock: false
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// ----------------------------------------------------
// 2. Mock Local Storage-backed Auth Provider
// ----------------------------------------------------
function MockAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('dlvt_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('dlvt_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const users = JSON.parse(localStorage.getItem('dlvt_users') || '[]')
    const found = users.find(u => u.email === email && u.password === password)
    if (!found) throw new Error('Invalid email or password (Mock Mode)')
    const { password: _, ...safeUser } = found
    setUser(safeUser)
    localStorage.setItem('dlvt_user', JSON.stringify(safeUser))
    return safeUser
  }

  const signup = async (firstName, lastName, email, password) => {
    const users = JSON.parse(localStorage.getItem('dlvt_users') || '[]')
    if (users.find(u => u.email === email)) throw new Error('Email already registered')
    const username = [firstName, lastName].filter(Boolean).join(' ') || 'AI Learner'
    const newUser = {
      id: 'mock_' + Date.now(),
      username,
      firstName,
      lastName,
      email,
      password,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`,
      createdAt: new Date().toISOString()
    }
    users.push(newUser)
    localStorage.setItem('dlvt_users', JSON.stringify(users))
    const { password: _, ...safeUser } = newUser
    setUser(safeUser)
    localStorage.setItem('dlvt_user', JSON.stringify(safeUser))
    return safeUser
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem('dlvt_user')
  }

  const googleLogin = async () => {
    const mockUser = {
      id: 'google_' + Date.now(),
      username: 'AI Learner',
      email: 'learner@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google',
      provider: 'google'
    }
    setUser(mockUser)
    localStorage.setItem('dlvt_user', JSON.stringify(mockUser))
  }

  // Satisfy signatures for signup/recovery code confirmations in mock mode
  const verifySignupOTP = async () => { return { status: 'complete' } }
  const resendSignupOTP = async () => {}

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout,
      googleLogin,
      verifySignupOTP,
      resendSignupOTP,
      clerkUser: null,
      signIn: null,
      signUp: null,
      isMock: true
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// ----------------------------------------------------
// 3. Context Bridge & Selection
// ----------------------------------------------------
export function AuthProvider({ children }) {
  if (SHOULD_USE_CLERK) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>
  } else {
    return <MockAuthProvider>{children}</MockAuthProvider>
  }
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
