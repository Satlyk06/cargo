import React from 'react'
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface ConfirmModalProps {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <View style={styles.iconWrap}>
            <View style={[styles.iconCircle, destructive && styles.iconCircleDanger]}>
              <Text style={styles.iconText}>{destructive ? '!' : '✓'}</Text>
            </View>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, destructive ? styles.confirmDangerButton : styles.confirmButton]} onPress={onConfirm}>
              <Text style={[styles.confirmText, destructive && styles.confirmDangerText]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    shadowColor: '#0f172a',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDanger: {
    backgroundColor: '#fef2f2',
  },
  iconText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6366f1',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
  },
  confirmButton: {
    backgroundColor: '#6366f1',
  },
  confirmDangerButton: {
    backgroundColor: '#ef4444',
  },
  cancelText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmDangerText: {
    color: '#fff',
  },
})
