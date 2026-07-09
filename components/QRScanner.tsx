import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, RADIUS, FONT } from '@/lib/theme'

interface QRScannerProps {
  visible: boolean
  onClose: () => void
  onScan: (data: string) => Promise<boolean>
}

export default function QRScanner({ visible, onClose, onScan }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!visible) {
      setScanned(false)
      setProcessing(false)
      return
    }
    if (!permission?.granted) requestPermission()
  }, [visible, permission?.granted, requestPermission])

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing || !data) return
    setScanned(true)
    setProcessing(true)
    try {
      const completed = await onScan(data.trim())
      if (!completed) setTimeout(() => setScanned(false), 900)
    } finally {
      setProcessing(false)
    }
  }

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.text}>Checking camera permission…</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Text style={styles.text}>Camera access is required to scan event tickets.</Text>
            <TouchableOpacity style={styles.btn} onPress={requestPermission}>
              <Text style={styles.btnText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            active={visible}
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned || processing ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          >
            <View style={styles.overlay}>
              <View style={styles.unfocusedContainer} />
              <View style={styles.middleContainer}>
                <View style={styles.unfocusedContainer} />
                <View style={styles.focusedContainer}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                  {processing && (
                    <View style={styles.processingOverlay}>
                      <ActivityIndicator color="#fff" size="large" />
                      <Text style={styles.processingText}>Validating ticket…</Text>
                    </View>
                  )}
                </View>
                <View style={styles.unfocusedContainer} />
              </View>
              <View style={styles.unfocusedContainer}>
                <Text style={styles.hint}>{scanned ? 'Ticket detected' : 'Scan the guest QR code'}</Text>
                <TouchableOpacity style={styles.closeFab} onPress={onClose}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        )}
      </View>
    </Modal>
  )
}

const { width } = Dimensions.get('window')
const scannerSize = Math.min(width * 0.7, 320)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { color: '#fff', textAlign: 'center', marginTop: 16, marginBottom: 20, fontSize: FONT.md },
  btn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.md },
  btnText: { color: '#fff', fontWeight: 'bold' },
  closeBtn: { marginTop: 20 },
  closeText: { color: COLORS.textTertiary },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  unfocusedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  middleContainer: { flexDirection: 'row', height: scannerSize },
  focusedContainer: { width: scannerSize, height: scannerSize, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: COLORS.primary, borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: { color: '#fff', marginTop: 12, fontSize: FONT.sm, fontWeight: '600' },
  hint: { color: '#fff', fontSize: FONT.md, fontWeight: '600', marginTop: 20 },
  closeFab: {
    marginTop: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
})
