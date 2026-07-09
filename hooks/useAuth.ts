import { useState, useEffect } from 'react'
import { blink } from '@/lib/blink'

export interface AuthUser {
  id: string
  email?: string
  displayName?: string
  avatar?: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      if (state.user) {
        setUser({
          id: state.user.id,
          email: state.user.email,
          displayName: state.user.displayName || state.user.email?.split('@')[0] || 'VYBE User',
          avatar: state.user.avatar,
        })
      } else {
        setUser(null)
      }
      if (!state.isLoading) setIsLoading(false)
    })
    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    return blink.auth.signInWithEmail(email, password)
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    return blink.auth.signUp({ email, password, displayName })
  }

  const signInWithGoogle = async () => {
    return blink.auth.signInWithGoogle()
  }

  const signOut = async () => {
    return blink.auth.signOut()
  }

  return { user, isLoading, signIn, signUp, signInWithGoogle, signOut }
}
