import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '@/lib/theme';

interface RequestItemProps {
  request: any;
  onApprove: () => void;
  onDeny: () => void;
  disabled?: boolean;
}

export function getStatusBg(status: string) {
  switch (status) {
    case 'approved': return COLORS.approved + '20';
    case 'denied': return COLORS.denied + '20';
    default: return COLORS.warning + '20';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'approved': return COLORS.approved;
    case 'denied': return COLORS.denied;
    default: return COLORS.warning;
  }
}

export function RequestItem({ request, onApprove, onDeny, disabled = false }: RequestItemProps) {
  return (
    <View style={styles.requestCard}>
      <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.reqAvatar}>
        <Text style={styles.reqAvatarText}>
          {(request.userName || request.userEmail || 'U')[0].toUpperCase()}
        </Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={styles.reqName}>{request.userName || 'Anonymous'}</Text>
        <Text style={styles.reqEmail}>{request.userEmail || ''}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(request.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
            {request.status.toUpperCase()}
          </Text>
        </View>
      </View>
      {request.status === 'pending' && (
        <View style={styles.reqActions}>
          <TouchableOpacity style={[styles.approveBtn, disabled && styles.disabled]} onPress={onApprove} disabled={disabled}>
            <Ionicons name="checkmark" size={18} color={COLORS.approved} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.denyBtn, disabled && styles.disabled]} onPress={onDeny} disabled={disabled}>
            <Ionicons name="close" size={18} color={COLORS.denied} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
    marginBottom: SPACING.xs,
  },
  reqAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqAvatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: FONT.sm,
  },
  reqName: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: FONT.sm,
  },
  reqEmail: {
    color: COLORS.textTertiary,
    fontSize: FONT.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  statusText: {
    fontSize: FONT.xs,
    fontWeight: '700',
  },
  reqActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.approved + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.45 },
  denyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.denied + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
