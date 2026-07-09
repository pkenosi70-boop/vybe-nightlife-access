import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '@/hooks/useAuth'
import { useCreateEvent } from '@/hooks/useEvents'
import { blink } from '@/lib/blink'
import { COLORS, SPACING, RADIUS, FONT } from '@/lib/theme'

const VIBE_OPTIONS = ['Amapiano', 'Afrohouse', 'Chill', 'VIP', 'Deep House', 'Techno', 'Electronic', 'Soul', 'Live', 'Exclusive']
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80'

interface CreateEventFormProps {
  onClose: () => void
}

function parseEventDate(value: string): Date | null {
  const normalized = value.trim().replace(' ', 'T')
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) return null
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function CreateEventForm({ onClose }: CreateEventFormProps) {
  const { user } = useAuth()
  const createEvent = useCreateEvent()
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    address: '',
    dateTime: '',
    capacity: '100',
    isPublic: true,
  })
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(current => current.includes(vibe) ? current.filter(item => item !== vibe) : [...current, vibe])
  }

  const pickCoverImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Photo Permission Required', 'Allow photo access to add an event cover image.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]?.uri) setCoverImageUri(result.assets[0].uri)
  }

  const uploadCoverImage = async (eventId: string) => {
    if (!coverImageUri) return FALLBACK_COVER
    setUploadProgress(1)
    const response = await fetch(coverImageUri)
    const blob = await response.blob()
    const cleanUri = coverImageUri.split('?')[0]
    const extension = cleanUri.split('.').pop()?.toLowerCase() || 'jpg'
    const { publicUrl } = await blink.storage.upload(
      blob,
      `events/${eventId}-${Date.now()}.${extension}`,
      { upsert: true, onProgress: percent => setUploadProgress(percent) },
    )
    return publicUrl
  }

  const handleCreate = async () => {
    if (loading || createEvent.isPending) return
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in before creating an event.')
      return
    }

    const title = form.title.trim()
    const location = form.location.trim()
    const eventDate = parseEventDate(form.dateTime)
    const capacity = Number(form.capacity)

    if (!title || !location || !form.dateTime.trim()) {
      Alert.alert('Missing Fields', 'Title, venue and date/time are required.')
      return
    }
    if (!eventDate) {
      Alert.alert('Invalid Date', 'Use the format YYYY-MM-DD HH:mm, for example 2026-08-29 20:00.')
      return
    }
    if (eventDate.getTime() <= Date.now()) {
      Alert.alert('Invalid Date', 'The event must be scheduled in the future.')
      return
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      Alert.alert('Invalid Capacity', 'Capacity must be a positive whole number.')
      return
    }

    setLoading(true)
    setUploadProgress(0)
    try {
      const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const coverImage = await uploadCoverImage(id)
      await createEvent.mutateAsync({
        id,
        hostId: user.id,
        hostName: user.displayName || user.email || 'Host',
        title,
        description: form.description.trim(),
        location,
        address: form.address.trim(),
        dateTime: eventDate.toISOString(),
        capacity,
        isPublic: form.isPublic ? 1 : 0,
        vibeTags: selectedVibes.join(','),
        coverImage,
        attendeeCount: 0,
      })
      Alert.alert('Event Created', 'Your event is now available in Vybe.')
      onClose()
    } catch (error) {
      Alert.alert('Unable to Create Event', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const busy = loading || createEvent.isPending

  return (
    <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Create Event</Text>
        <TouchableOpacity onPress={onClose} disabled={busy}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.coverPicker} onPress={pickCoverImage} disabled={busy}>
        {coverImageUri ? (
          <Image source={{ uri: coverImageUri }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="image-outline" size={34} color={COLORS.primary} />
            <Text style={styles.coverTitle}>Add a cover image</Text>
            <Text style={styles.coverHint}>Recommended: landscape photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Event Title *</Text>
        <TextInput style={styles.input} placeholder="Give your event a name" placeholderTextColor={COLORS.textTertiary} value={form.title} onChangeText={title => setForm(current => ({ ...current, title }))} editable={!busy} />
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textarea]} placeholder="Tell people about the vibe..." placeholderTextColor={COLORS.textTertiary} value={form.description} onChangeText={description => setForm(current => ({ ...current, description }))} multiline numberOfLines={4} editable={!busy} />
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Venue Name *</Text>
        <TextInput style={styles.input} placeholder="Club / Bar / Venue" placeholderTextColor={COLORS.textTertiary} value={form.location} onChangeText={location => setForm(current => ({ ...current, location }))} editable={!busy} />
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>Street Address</Text>
        <TextInput style={styles.input} placeholder="Street, City" placeholderTextColor={COLORS.textTertiary} value={form.address} onChangeText={address => setForm(current => ({ ...current, address }))} editable={!busy} />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputWrap, styles.dateField]}>
          <Text style={styles.label}>Date & Time *</Text>
          <TextInput style={styles.input} placeholder="2026-08-29 20:00" placeholderTextColor={COLORS.textTertiary} value={form.dateTime} onChangeText={dateTime => setForm(current => ({ ...current, dateTime }))} autoCapitalize="none" editable={!busy} />
          <Text style={styles.fieldHint}>Format: YYYY-MM-DD HH:mm</Text>
        </View>
        <View style={[styles.inputWrap, styles.capacityField]}>
          <Text style={styles.label}>Capacity</Text>
          <TextInput style={styles.input} placeholder="100" placeholderTextColor={COLORS.textTertiary} value={form.capacity} onChangeText={capacity => setForm(current => ({ ...current, capacity: capacity.replace(/[^0-9]/g, '') }))} keyboardType="number-pad" editable={!busy} />
        </View>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.label}>Visibility</Text>
          <Text style={styles.switchSub}>{form.isPublic ? 'Public — Anyone can see it' : 'Private — Invite only'}</Text>
        </View>
        <Switch value={form.isPublic} onValueChange={isPublic => setForm(current => ({ ...current, isPublic }))} trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }} thumbColor={form.isPublic ? COLORS.primary : COLORS.textTertiary} disabled={busy} />
      </View>

      <Text style={[styles.label, styles.vibeLabel]}>Vibe Tags</Text>
      <View style={styles.vibeGrid}>
        {VIBE_OPTIONS.map(vibe => (
          <TouchableOpacity key={vibe} style={[styles.vibeChip, selectedVibes.includes(vibe) && styles.vibeChipActive]} onPress={() => toggleVibe(vibe)} disabled={busy}>
            <Text style={[styles.vibeText, selectedVibes.includes(vibe) && styles.vibeTextActive]}>{vibe}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.createBtn, busy && styles.disabled]} onPress={handleCreate} disabled={busy}>
        <LinearGradient colors={[COLORS.primary, COLORS.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnGrad}>
          {busy ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.createBtnText}>{uploadProgress > 0 ? `Uploading ${Math.round(uploadProgress)}%` : 'Creating event...'}</Text>
            </View>
          ) : (
            <Text style={styles.createBtnText}>Create Event</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  formScroll: { flex: 1, paddingHorizontal: SPACING.xl },
  formContent: { paddingTop: SPACING.xl, paddingBottom: SPACING.xxxl },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  formTitle: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800' },
  coverPicker: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border },
  coverImage: { width: '100%', height: 180 },
  coverPlaceholder: { height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgCard },
  coverTitle: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700', marginTop: SPACING.sm },
  coverHint: { color: COLORS.textTertiary, fontSize: FONT.xs, marginTop: 4 },
  inputWrap: { marginBottom: SPACING.md },
  row: { flexDirection: 'row' },
  dateField: { flex: 1 },
  capacityField: { width: 100, marginLeft: SPACING.md },
  label: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600', marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.base, paddingVertical: 12, color: COLORS.textPrimary, fontSize: FONT.base },
  textarea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  fieldHint: { color: COLORS.textMuted, fontSize: FONT.xs, marginTop: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
  switchText: { flex: 1, marginRight: SPACING.md },
  switchSub: { color: COLORS.textTertiary, fontSize: FONT.xs, marginTop: 2 },
  vibeLabel: { marginBottom: SPACING.sm },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  vibeChip: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  vibeChipActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  vibeText: { color: COLORS.textTertiary, fontSize: FONT.sm, fontWeight: '600' },
  vibeTextActive: { color: COLORS.primary },
  createBtn: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  createBtnGrad: { minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.md },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.md },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  disabled: { opacity: 0.65 },
})
