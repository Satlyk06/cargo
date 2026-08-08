import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { UserCircleIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function AdminProfile() {
  const { t } = useTranslation()
  const { user, token, login } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error(t('profile.nameMinLength') || 'İsim en az 2 karakter olmalı')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        storedUser.name = name.trim()
        localStorage.setItem('user', JSON.stringify(storedUser))
        
        login(token!, { ...user!, name: name.trim() })
        
        toast.success(t('profile.updateSuccess'))
        setIsEditing(false)
      } else {
        toast.error(t('profile.updateError'))
      }
    } catch (error) {
      console.error('Profil güncelleme hatası:', error)
      toast.error(t('profile.updateError'))
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleLabel = () => {
    switch(user?.role) {
      case 'super_admin': return t('profile.roles.super_admin')
      case 'admin': return t('profile.roles.admin')
      case 'user': return t('profile.roles.user')
      default: return t('profile.roles.user')
    }
  }

  const getRoleColor = () => {
    switch(user?.role) {
      case 'super_admin': return 'bg-purple-100 text-purple-700'
      case 'admin': return 'bg-blue-100 text-blue-700'
      case 'user': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('admin.profile')}</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        {/* Avatar */}
        <div className="flex items-center justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center">
            <UserCircleIcon className="h-16 w-16 text-primary-600" />
          </div>
        </div>

        {/* Phone Number */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile.phone')}
          </label>
          <div className="bg-gray-50 px-4 py-2 rounded-lg text-gray-600 font-medium">
            {user?.phoneNumber}
          </div>
          <p className="text-xs text-gray-400 mt-1">{t('profile.phoneHint')}</p>
        </div>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile.name')}
          </label>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('profile.enterName')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setName(user?.name || '')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
              <span className="text-gray-600 font-medium">
                {user?.name || t('profile.noName')}
              </span>
              <button
                onClick={() => {
                  setIsEditing(true)
                  setName(user?.name || '')
                }}
                className="flex items-center gap-1 text-primary-500 hover:text-primary-600 font-medium"
              >
                <PencilIcon className="h-4 w-4" />
                {t('profile.edit')}
              </button>
            </div>
          )}
        </div>

        {/* Role */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile.role')}
          </label>
          <div className="bg-gray-50 px-4 py-2 rounded-lg">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor()}`}>
              {user?.role === 'super_admin' ? '⭐ ' : ''}
              {getRoleLabel()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}