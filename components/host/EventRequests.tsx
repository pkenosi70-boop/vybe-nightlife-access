import React, { useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/hooks/useAuth'
import { AccessRequest, Event, useAccessRequests, useUpdateRequestStatus } from '@/hooks/useEvents'
import { useCreateNotification } from '@/hooks/useNotifications'
import { COLORS, SPACING, RADIUS, FONT } from '@/lib/theme'
import { RequestItem } from './RequestItem'

interface EventRequestsProps {
  event: Event
}

export function EventRequests({ event }: EventRequestsProps) {
  const { user } = useAuth()
  const { data: requests = [], refetch } = useAccessRequests(event.id)
  const updateStatus = useUpdateRequestStatus()
  const createNotif = useCreateNotification()
  const [expanded, setExpanded] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const pending = requests.filter(request => request.status === 'pending').length

  const updateRequest = async (request: AccessRequest, status: 'approved' | 'denied') => {
    if (!user || user.id !== event.hostId || processingId) {
      if (!user || user.id !== event.hostId) Alert.alert('Not Authorised', 'Only this event host can manage requests.')
      return
    }

    setProcessingId(request.id)
    try {
      await updateStatus.mutateAsync({
        id: request.id,
        status,
        eventId: event.id,
        hostId: user.id,
      })

      await createNotif.mutateAsync({
        userId: request.userId,
        title: status === 'approved' ? '🎉 Access Approved!' : 'Access Update',
        message: status === 'approved'
          ? `You have been approved for "${event.title}". Your QR ticket is ready!`
          : `Your request for "${event.title}" was not approved this time.`,
        type: status,
        eventId: event.id,
      })
      await refetch()
    } catch (error) {
      Alert.alert('Unable to Update Request', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <View style={styles.eventBlock}>
      <TouchableOpacity style={styles.eventRow} onPress={() => setExpanded(current => !current)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.eventSub}>
            {new Date(event.dateTime).toLocaleDateString()} · {requests.length} requests
            {pending > 0 ? ` · ${pending} pending` : ''}
          </Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.requestList}>
          {requests.length === 0 ? (
            <Text style={styles.noRequests}>No requests yet</Text>
          ) : (
            requests.map(request => (
              <RequestItem
                key={request.id}
                request={request}
                disabled={processingId !== null}
                onApprove={() => updateRequest(request, 'approved')}
                onDeny={() => updateRequest(request, 'denied')}
              />
            ))
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  eventBlock: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  eventRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.base },
  eventTitle: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700' },
  eventSub: { color: COLORS.textTertiary, fontSize: FONT.sm, marginTop: 2 },
  requestList: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: SPACING.sm },
  noRequests: { color: COLORS.textTertiary, fontSize: FONT.sm, textAlign: 'center', padding: SPACING.md },
})
