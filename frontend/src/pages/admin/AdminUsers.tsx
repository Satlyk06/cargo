import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  PencilIcon,
  UserMinusIcon,
  UserPlusIcon,
  XMarkIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface User {
  id: string
  phoneNumber: string
  name: string
  role: string
  isBanned: boolean
  banReason: string | null
  createdAt: string
}

type PendingUserAction = {
  type: 'ban' | 'unban' | 'delete'
  user: User
}

export default function AdminUsers() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingAction, setPendingAction] = useState<PendingUserAction | null>(null)
  const [banReason, setBanReason] = useState('')
  const [processingAction, setProcessingAction] = useState(false)

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saving, setSaving] = useState(false)

  // Modal içine tıklamayı yakalamak için ref
  const editModalRef = useRef<HTMLDivElement>(null)
  const actionModalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error(error)
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleBan = async (id: string, isBanned: boolean) => {
    const action = isBanned ? 'unban' : 'ban'
    const reason = isBanned ? '' : banReason.trim()

    try {
      const response = await fetch(`${API_URL}/api/users/${id}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      })
      
      if (response.ok) {
        toast.success(isBanned ? t('common.unbanSuccess') : t('common.banSuccess'))
        fetchUsers()
      } else {
        toast.error(t('common.error'))
      }
    } catch (error) {
      console.error('Ban hatası:', error)
      toast.error(t('common.error'))
    }
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    const user = users.find(u => u.id === id)
    if (user?.role === 'super_admin') {
      toast.error(t('common.superAdminProtected'))
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/users/${id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })
      
      if (response.ok) {
        toast.success(t('common.roleUpdated'))
        fetchUsers()
      } else {
        toast.error(t('common.error'))
      }
    } catch (error) {
      console.error('Rol hatası:', error)
      toast.error(t('common.error'))
    }
  }

  const handleDelete = async (id: string) => {
    const user = users.find(u => u.id === id)
    if (user?.role === 'super_admin') {
      toast.error(t('common.superAdminProtected'))
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        toast.success(t('common.deleted'))
        fetchUsers()
      } else {
        toast.error(t('common.error'))
      }
    } catch (error) {
      console.error('Silme hatası:', error)
      toast.error(t('common.error'))
    }
  }

  // Edit Functions
  const openEditModal = (user: User) => {
    if (user.role === 'super_admin') {
      toast.error(t('common.superAdminProtected'))
      return
    }
    setEditingUser(user)
    setEditName(user.name || '')
    setEditPhone(user.phoneNumber)
    setEditModalOpen(true)
  }

  const handleEditSave = async () => {
    if (!editingUser) return
    if (!editName.trim()) {
      toast.error(t('common.nameRequired'))
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          phoneNumber: editPhone.trim(),
        }),
      })

      if (response.ok) {
        toast.success(t('common.updateSuccess'))
        setEditModalOpen(false)
        fetchUsers()
      } else {
        toast.error(t('common.error'))
      }
    } catch (error) {
      console.error('Düzenleme hatası:', error)
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const requestUserAction = (type: PendingUserAction['type'], user: User) => {
    if (user.role === 'super_admin') {
      toast.error(t('common.superAdminProtected'))
      return
    }

    setBanReason('')
    setPendingAction({ type, user })
  }

  const confirmPendingAction = async () => {
    if (!pendingAction) return
    if (pendingAction.type === 'ban' && !banReason.trim()) {
      toast.error(t('common.banReasonRequired'))
      return
    }

    setProcessingAction(true)
    try {
      if (pendingAction.type === 'delete') {
        await handleDelete(pendingAction.user.id)
      } else {
        await handleBan(pendingAction.user.id, pendingAction.type === 'unban')
      }
      setPendingAction(null)
    } finally {
      setProcessingAction(false)
    }
  }

  // Modal dışına tıklama handler'ları
  const handleEditModalOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editModalRef.current && !editModalRef.current.contains(e.target as Node)) {
      setEditModalOpen(false)
    }
  }

  const handleActionModalOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (actionModalRef.current && !actionModalRef.current.contains(e.target as Node)) {
      setPendingAction(null)
    }
  }

  const filteredUsers = users.filter(u =>
    u.phoneNumber.includes(searchTerm) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('admin.users')}</h1>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder={t('common.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">#</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('profile.phone')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('profile.name')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('profile.role')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('common.status')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('common.date')}</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">{t('common.loading')}</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">{t('common.noData')}</td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => {
                const isSuperAdminUser = user.role === 'super_admin'
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{user.phoneNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.name || '-'}</td>
                    <td className="px-4 py-3">
                      {isSuperAdminUser ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          ⭐ {t('common.superAdmin')}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          disabled={isSuperAdminUser}
                        >
                          <option value="user">👤 {t('common.user')}</option>
                          <option value="admin">🛡️ {t('common.admin')}</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.isBanned ? (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                          <XCircleIcon className="h-4 w-4" />
                          {t('common.banned')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircleIcon className="h-4 w-4" />
                          {t('common.active')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      {isSuperAdminUser ? (
                        <span className="text-xs text-gray-400">{t('common.protected')}</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            title={t('common.edit')}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => requestUserAction(user.isBanned ? 'unban' : 'ban', user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.isBanned
                                ? 'text-green-500 hover:bg-green-50 hover:text-green-700'
                                : 'text-orange-500 hover:bg-orange-50 hover:text-orange-700'
                            }`}
                            title={user.isBanned ? t('common.unban') : t('common.ban')}
                          >
                            {user.isBanned ? <UserPlusIcon className="h-4 w-4" /> : <UserMinusIcon className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => requestUserAction('delete', user)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                            title={t('common.delete')}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal - Şık ve Modern */}
      {editModalOpen && editingUser && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
          onClick={handleEditModalOutsideClick}
        >
          <div 
            ref={editModalRef}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 id="edit-user-title" className="text-lg font-semibold text-slate-900">
                  {t('common.editUser')}
                </h2>
                
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {t('profile.name')}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder={t('profile.enterName')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  {t('profile.phone')}
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="+99364726236"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {t('common.saving')}
                  </span>
                ) : (
                  t('common.save')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-action-title"
          onClick={handleActionModalOutsideClick}
        >
          <div 
            ref={actionModalRef}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                pendingAction.type === 'delete' || pendingAction.type === 'ban' ? 'bg-red-50' : 'bg-green-50'
              }`}>
                <ExclamationTriangleIcon className={`h-6 w-6 ${
                  pendingAction.type === 'delete' || pendingAction.type === 'ban' ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
              <div>
                <h2 id="user-action-title" className="text-lg font-semibold text-slate-900">
                  {pendingAction.type === 'delete'
                    ? t('common.deleteUserTitle')
                    : pendingAction.type === 'ban'
                      ? t('common.banTitle')
                      : t('common.unbanTitle')}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {pendingAction.type === 'delete'
                    ? t('common.deleteUserConfirm')
                    : pendingAction.type === 'ban'
                      ? t('common.banConfirm')
                      : t('common.unbanConfirm')}
                </p>
              </div>
            </div>

            {pendingAction.type === 'ban' && (
              <label className="mt-5 block text-sm font-medium text-slate-700">
                {t('common.banReason')}
                <input
                  value={banReason}
                  onChange={event => setBanReason(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  autoFocus
                />
              </label>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={processingAction}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmPendingAction}
                disabled={processingAction}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  pendingAction.type === 'delete' || pendingAction.type === 'ban'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {processingAction ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {t('common.loading')}
                  </span>
                ) : pendingAction.type === 'delete' ? (
                  t('common.delete')
                ) : pendingAction.type === 'ban' ? (
                  t('common.ban')
                ) : (
                  t('common.unban')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}