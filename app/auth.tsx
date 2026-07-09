import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Image,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { COLORS, SPACING, RADIUS, FONT } from '@/lib/theme'

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const handleSubmit = async () => {
    setError('')
    if (!email || !password) { setError('Please fill in all fields'); return }
    if (mode === 'signup' && !name) { setError('Please enter your name'); return }
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password, name)
      }
      router.replace('/(tabs)')
    } catch (e: any) {
      setError(e.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      router.replace('/(tabs)')
    } catch (e: any) {
      setError(e.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0F', '#12081F', '#0A0A0F']}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Neon glow orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <Text style={styles.logo}>VYBE</Text>
            <Text style={styles.tagline}>Access the Night</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Mode toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'signin' && styles.toggleActive]}
                onPress={() => setMode('signin')}
              >
                <Text style={[styles.toggleText, mode === 'signin' && styles.toggleTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'signup' && styles.toggleActive]}
                onPress={() => setMode('signup')}
              >
                <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fields */}
            {mode === 'signup' && (
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* CTA */}
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogle}
              disabled={loading}
            >
              <Text style={styles.googleText}>🌐  Continue with Google</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  orb1: {
    position: 'absolute', width: 300, height: 300,
    borderRadius: 150, top: -80, left: -100,
    backgroundColor: COLORS.primary, opacity: 0.12,
  },
  orb2: {
    position: 'absolute', width: 250, height: 250,
    borderRadius: 125, bottom: 100, right: -80,
    backgroundColor: COLORS.accent, opacity: 0.1,
  },
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xxxl,
  },
  logoArea: { alignItems: 'center', marginBottom: SPACING.xxxl },
  logo: {
    fontSize: 56, fontWeight: '900', letterSpacing: 12,
    color: COLORS.textPrimary,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: FONT.base, color: COLORS.textSecondary,
    letterSpacing: 4, marginTop: SPACING.xs, textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  toggleRow: {
    flexDirection: 'row', backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg, padding: 4, marginBottom: SPACING.xl,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  toggleActive: { backgroundColor: COLORS.bgElevated },
  toggleText: { color: COLORS.textTertiary, fontWeight: '600', fontSize: FONT.sm },
  toggleTextActive: { color: COLORS.primary },
  inputWrap: { marginBottom: SPACING.md },
  label: { color: COLORS.textSecondary, fontSize: FONT.sm, marginBottom: SPACING.xs, fontWeight: '500' },
  input: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.base, paddingVertical: 14,
    color: COLORS.textPrimary, fontSize: FONT.base,
  },
  error: {
    color: COLORS.error, fontSize: FONT.sm,
    marginBottom: SPACING.md, textAlign: 'center',
  },
  ctaBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.xs },
  ctaGradient: {
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: FONT.md, letterSpacing: 0.5 },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textTertiary, marginHorizontal: SPACING.md, fontSize: FONT.sm },
  googleBtn: {
    backgroundColor: COLORS.bgSurface, borderRadius: RADIUS.lg,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  googleText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: FONT.base },
})
