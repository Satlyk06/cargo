import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'

export default function LoginScreen() {
  const { t } = useTranslation()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert(t('common.error') || 'Hata', t('auth.fillAllFields'))
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/login', {
        phoneNumber,
        password,
      })

      const { access_token, user } = response.data
      await login(access_token, user)
    } catch (error: any) {
      Alert.alert(
        t('auth.loginError'),
        error.response?.data?.message || t('auth.loginError')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.brandIcon}><Ionicons name="cube-outline" size={19} color="#fff" /></View>
          <Text style={styles.brandText}>Cargo Logistics</Text>
        </View>
        <View style={styles.languageControl}><LanguageSwitcher withLabel /></View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Form */}
          <View style={styles.formContainer}>
           
            <Text style={styles.title}>{t('common.welcome')}</Text>
            <Text style={styles.subtitle}></Text>
            <View style={styles.inputCard}>
            {/* Telefon */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.phone')}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={18} color="#cbd5e1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.phonePlaceholder')}
                  placeholderTextColor="#94a3b8"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Şifre */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#cbd5e1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(p => !p)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#cbd5e1"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Giriş Butonu */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
              )}
            </TouchableOpacity>

           {/* Yardım Metni */}
            <Text style={styles.helpText}>{t('auth.loginHelp')}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 112,
    paddingBottom: 40,
  },
  topBar: {
    height: 70,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#edf0f5',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  languageControl: { height: 34, minWidth: 86, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  eyebrow: {
    color: '#6366f1',
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: '700',
    marginBottom: 11,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 7,
    marginBottom: 24,
  },
  formContainer: {
    padding: 0,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  inputIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loginButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  helpText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 16,
  },
})
