import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessRequests, useUpdateRequestStatus, Event } from '@/hooks/useEvents';
import { useCreateNotification } from '@/hooks/useNotifications';
import { COLORS, SPACING, RADIUS, FONT } from '@/lib/theme';
import { RequestItem } from './RequestItem';

interface EventRequestsProps {
  event: Event;
}

export function EventRequests({ event }: EventRequestsProps) {
  const { data: requests = [], refetch } = useAccessRequests(event.id);
  const updateStatus = useUpdateRequestStatus();
  const createNotif = useCreateNotification();
  const [expanded, setExpanded] = useState(false);
  const pending = requests.filter(r => r.status === 'pending').length;

  const handleApprove = async (r: any) => {
    await updateStatus.mutateAsync({ id: r.id, status: 'approved', eventId: event.id });
    await createNotif.mutateAsync({
      userId: r.userId,
      title: '🎉 Access Approved!',
      message: `You've been approved for "${event.title}". Your QR ticket is ready!`,
      type: 'approved',
      eventId: event.id,
    });
    refetch();
  };

  const handleDeny = async (r: any) => {
    await updateStatus.mutateAsync({ id: r.id, status: 'denied', eventId: event.id });
    await createNotif.mutateAsync({
      userId: r.userId,
      title: 'Access Update',
      message: `Your request for "${event.title}" was not approved this time.`,
      type: 'denied',
      eventId: event.id,
    });
    refetch();
  };

  return (
    <View style={styles.eventBlock}>
      <TouchableOpacity
        style={styles.eventRow}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.eventSub}>
            {new Date(event.dateTime).toLocaleDateString()} · {requests.length} requests
            {pending > 0 ? ` · ${pending} pending` : ''}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20} color={COLORS.textTertiary}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.requestList}>
          {requests.length === 0 ? (
            <Text style={styles.noRequests}>No requests yet</Text>
          ) : (
            requests.map(r => (
              <RequestItem
                key={r.id}
                request={r}
                onApprove={() => handleApprove(r)}
                onDeny={() => handleDeny(r)}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
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
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    fontWeight: '700',
  },
  eventSub: {
    color: COLORS.textTertiary,
    fontSize: FONT.sm,
    marginTop: 2,
  },
  requestList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.sm,
  },
  noRequests: {
    color: COLORS.textTertiary,
    fontSize: FONT.sm,
    textAlign: 'center',
    padding: SPACING.md,
  },
});
