import React from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native'

interface CustomAlertProps {
  visible: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

const { width } = Dimensions.get('window')

export default function CustomAlert({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = 'danger'
}: CustomAlertProps) {
  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          confirmBg: '#ef4444',
          confirmText: '#fff',
          icon: '🚪'
        }
      case 'warning':
        return {
          confirmBg: '#f59e0b',
          confirmText: '#fff',
          icon: '⚠️'
        }
      case 'info':
        return {
          confirmBg: '#6366f1',
          confirmText: '#fff',
          icon: 'ℹ️'
        }
      default:
        return {
          confirmBg: '#ef4444',
          confirmText: '#fff',
          icon: '🚪'
        }
    }
  }

  const colors = getColors()

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{colors.icon}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: colors.confirmBg }]}
              onPress={onConfirm}
            >
              <Text style={[styles.confirmButtonText, { color: colors.confirmText }]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: width * 0.85,
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: '#ef4444',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
})