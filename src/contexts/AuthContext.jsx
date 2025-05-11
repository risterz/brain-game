import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check active session on mount
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setCurrentUser(data.session)
      setLoading(false)
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session)
      })
    }
    
    checkSession()
  }, [])

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error signing up:', error.message)
      return { data: null, error }
    }
  }

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error logging in:', error.message)
      return { data: null, error }
    }
  }

  // Log out user
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Redirect to home page
      navigate('/')
      return { error: null }
    } catch (error) {
      console.error('Error logging out:', error.message)
      return { error }
    }
  }

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error resetting password:', error.message)
      return { error }
    }
  }

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export default AuthContext