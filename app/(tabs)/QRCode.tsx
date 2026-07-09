import React from 'react'
import { View, StyleSheet } from 'react-native'
import QRCodeSVG from 'react-native-qrcode-svg'

interface QRCodeProps {
  value: string
  size?: number
}

export default function QRCode({ value, size = 180 }: QRCodeProps) {
  if (!value) return null;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <QRCodeSVG
        value={value}
        size={size}
        color="#0A0A0F"
        backgroundColor="#FFFFFF"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { 
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
})