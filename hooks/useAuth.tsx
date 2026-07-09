import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { blink } from '@/lib/blink'

export interface AuthUser {
  id: string
  email?: string
  displayName?: string
  avatar?: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<unknown>
  signUp: (email: string, password: string, displayName: string) => Promise<unknown>
  signInWithGoogle: () => Promise<unknown>
  signOut: () => Promise<unknown>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function mapAuthUser(rawUser: any): AuthUser | null {
  if (!rawUser?.id) return null
  return {
    id: rawUser.id,
    email: rawUser.email,
    displayName: rawUser.displayName || rawUser.metadata?.displayName || rawUser.email?.split('@')[0] || 'VYBE User',
    avatar: rawUser.avatar || rawUser.metadata?.avatar,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const unsubscribe = blink.auth.onAuthStateChanged((state: any) => {
      if (!mounted) return
      setUser(mapAuthUser(state?.user))
      setIsLoading(Boolean(state?.isLoading))
    })
    return () => {
      mounted = false
      unsubscribe?.()
    }
  }, [])

  const signIn = useCallback((email: string, password: string) => {
    return blink.auth.signInWithEmail(email.trim().toLowerCase(), password)
  }, [])

  const signUp = useCallback((email: string, password: string, displayName: string) => {
    return blink.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      metadata: { displayName: displayName.trim() },
    })
  }, [])

  const signInWithGoogle = useCallback(() => blink.auth.signInWithGoogle(), [])
  const signOut = useCallback(() => blink.auth.signOut(), [])

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signInWithGoogle, signOut }),
    [user, isLoading, signIn, signUp, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
