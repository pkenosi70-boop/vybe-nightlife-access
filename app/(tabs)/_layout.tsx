import type { ComponentProps } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Redirect, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/lib/theme'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadCount } from '@/hooks/useNotifications'

function TabIcon({ name, color, size, badge }: {
  name: ComponentProps<typeof Ionicons>['name']
  color: string
  size: number
  badge?: number
}) {
  return (
    <View style={{ width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size} color={color} />
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </View>
  )
}

function NotifIcon({ color, size }: { color: string; size: number }) {
  const { user } = useAuth()
  const { data: unread = 0 } = useUnreadCount(user?.id || '')
  return <TabIcon name="notifications" color={color} size={size} badge={unread} />
}

export default function TabsLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (!user) return <Redirect href="/auth" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgCard,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: ({ color, size }) => <TabIcon name="compass" color={color} size={size} /> }} />
      <Tabs.Screen name="host" options={{ title: 'Host', tabBarIcon: ({ color, size }) => <TabIcon name="add-circle" color={color} size={size} /> }} />
      <Tabs.Screen name="tickets" options={{ title: 'My Tickets', tabBarIcon: ({ color, size }) => <TabIcon name="ticket" color={color} size={size} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts', tabBarIcon: ({ color, size }) => <NotifIcon color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <TabIcon name="person-circle" color={color} size={size} /> }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  badge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: COLORS.neonPink,
    borderRadius: 9, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
})
