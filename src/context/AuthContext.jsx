
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { 
  listenAuth, 
  googleLogin, 
  logout as firebaseLogout, 
  getRedirectResult,
  loginWithEmail,
  registerWithEmail
} from '@/firebase/config.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = listenAuth((authUser) => {
      setUser(authUser)
      setLoading(false)
      setAuthChecked(true)
    }, (err) => {
      console.error('Auth error:', err)
      setError(err)
      setLoading(false)
      setAuthChecked(true)
    })

    return () => unsubscribe()
  }, [])

  // Login with Google
  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await googleLogin()
      if (result.redirecting) {
        // Handle redirect case (for mobile)
        return { redirecting: true }
      }
      return { success: true, user: result.user }
    } catch (err) {
      console.error('Google login error:', err)
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      setLoading(true)
      await firebaseLogout()
      setUser(null)
      return { success: true }
    } catch (err) {
      console.error('Logout error:', err)
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Login with email/password
  const loginWithEmailPassword = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await loginWithEmail(email, password);
      return { success: true, user: userCredential.user };
    } catch (err) {
      console.error('Email login error:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Register with email/password
  const registerWithEmailPassword = useCallback(async (email, password, displayName) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await registerWithEmail(email, password, displayName);
      return { success: true, user: userCredential };
    } catch (err) {
      console.error('Registration error:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return user?.role === 'admin' || user?.email === 'admin@dojogaming.com';
  }, [user])

  const value = {
    user,
    loading,
    error,
    authChecked,
    isAdmin: isAdmin(),
    loginWithGoogle,
    loginWithEmail: loginWithEmailPassword,
    registerWithEmail: registerWithEmailPassword,
    logout: handleLogout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hook for protected routes
export const useRequireAuth = (redirectUrl = '/') => {
  const { user, loading, authChecked } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && authChecked && !user) {
      navigate(redirectUrl, { state: { from: window.location.pathname } })
    }
  }, [user, loading, authChecked, navigate, redirectUrl])

  return { user, loading }
}
