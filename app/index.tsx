import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { COLORS } from '@/lib/theme'

export default function Index() {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }
  return <Redirect href={user ? '/(tabs)' : '/auth'} />
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
})
