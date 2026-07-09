import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useCreateEvent } from '@/hooks/useEvents';
import { COLORS, SPACING, RADIUS, FONT } from '@/lib/theme';

const VIBE_OPTIONS = ['Amapiano', 'Afrohouse', 'Chill', 'VIP', 'Deep House', 'Techno', 'Electronic', 'Soul', 'Live', 'Exclusive'];

interface CreateEventFormProps {
  onClose: () => void;
}

export function CreateEventForm({ onClose }: CreateEventFormProps) {
  const { user } = useAuth();
  const createEvent = useCreateEvent();
  const [form, setForm] = useState({
    title: '', description: '', location: '', address: '',
    dateTime: '', capacity: '100', isPublic: true,
  });
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleVibe = (v: string) => {
    setSelectedVibes(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  };

  const handleCreate = async () => {
    if (!form.title || !form.location || !form.dateTime) {
      Alert.alert('Missing Fields', 'Title, location, and date/time are required.');
      return;
    }
    setLoading(true);
    try {
      const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await createEvent.mutateAsync({
        id,
        hostId: user!.id,
        hostName: user!.displayName || user!.email || 'Host',
        title: form.title,
        description: form.description,
        location: form.location,
        address: form.address,
        dateTime: form.dateTime,
        capacity: parseInt(form.capacity) || 100,
        isPublic: form.isPublic ? 1 : 0,
        vibeTags: selectedVibes.join(','),
        coverImage: `https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80`,
        attendeeCount: 0,
      });
      Alert.alert('Event Created!', 'Your event is now live.');
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Create Event</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Event Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Give your event a name"
          placeholderTextColor={COLORS.textTertiary}
          value={form.title}
          onChangeText={v => setForm(f => ({ ...f, title: v }))}
        />
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Tell people about the vibe..."
          placeholderTextColor={COLORS.textTertiary}
          value={form.description}
          onChangeText={v => setForm(f => ({ ...f, description: v }))}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Venue Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Club / Bar / Venue"
          placeholderTextColor={COLORS.textTertiary}
          value={form.location}
          onChangeText={v => setForm(f => ({ ...f, location: v }))}
        />
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Street Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Street, City"
          placeholderTextColor={COLORS.textTertiary}
          value={form.address}
          onChangeText={v => setForm(f => ({ ...f, address: v }))}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputWrap, { flex: 1 }]}>
          <Text style={styles.label}>Date & Time *</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-05-15T22:00:00"
            placeholderTextColor={COLORS.textTertiary}
            value={form.dateTime}
            onChangeText={v => setForm(f => ({ ...f, dateTime: v }))}
          />
        </View>
        <View style={[styles.inputWrap, { width: 100, marginLeft: SPACING.md }]}>
          <Text style={styles.label}>Capacity</Text>
          <TextInput
            style={styles.input}
            placeholder="100"
            placeholderTextColor={COLORS.textTertiary}
            value={form.capacity}
            onChangeText={v => setForm(f => ({ ...f, capacity: v }))}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.label}>Visibility</Text>
          <Text style={styles.switchSub}>{form.isPublic ? 'Public — Anyone can see it' : 'Private — Invite only'}</Text>
        </View>
        <Switch
          value={form.isPublic}
          onValueChange={v => setForm(f => ({ ...f, isPublic: v }))}
          trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
          thumbColor={form.isPublic ? COLORS.primary : COLORS.textTertiary}
        />
      </View>

      <Text style={[styles.label, { marginBottom: SPACING.sm }]}>Vibe Tags</Text>
      <View style={styles.vibeGrid}>
        {VIBE_OPTIONS.map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.vibeChip, selectedVibes.includes(v) && styles.vibeChipActive]}
            onPress={() => toggleVibe(v)}
          >
            <Text style={[styles.vibeText, selectedVibes.includes(v) && styles.vibeTextActive]}>
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.createBtn}
        onPress={handleCreate}
        disabled={loading}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.createBtnGrad}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Create Event</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  formScroll: { flex: 1, padding: SPACING.xl },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  formTitle: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800' },
  inputWrap: { marginBottom: SPACING.md },
  row: { flexDirection: 'row' },
  label: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600', marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.base,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: FONT.base,
  },
  textarea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  switchSub: { color: COLORS.textTertiary, fontSize: FONT.xs, marginTop: 2 },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  vibeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vibeChipActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  vibeText: { color: COLORS.textTertiary, fontSize: FONT.sm, fontWeight: '600' },
  vibeTextActive: { color: COLORS.primary },
  createBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.xxxl },
  createBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.md },
});
