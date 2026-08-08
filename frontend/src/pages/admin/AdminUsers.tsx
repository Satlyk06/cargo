import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
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
      toast.error(t('common.error') )
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
        toast.success(isBanned ? t('common.unbanSuccess')  : t('common.banSuccess') )
        fetchUsers()
      } else {
        toast.error(t('common.error') )
      }
    } catch (error) {
      console.error('Ban hatası:', error)
      toast.error(t('common.error'))
    }
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    const user = users.find(u => u.id === id)
    if (user?.role === 'super_admin') {
      toast.error(t('common.superAdminProtected') )
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
        toast.success(t('common.roleUpdated') )
        fetchUsers()
      } else {
        toast.error(t('common.error') )
      }
    } catch (error) {
      console.error('Rol hatası:', error)
      toast.error(t('common.error') )
    }
  }

  const handleDelete = async (id: string) => {
    const user = users.find(u => u.id === id)
    if (user?.role === 'super_admin') {
      toast.error(t('common.superAdminProtected') )
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
        toast.success(t('common.deleted') )
        fetchUsers()
      } else {
        toast.error(t('common.error') )
      }
    } catch (error) {
      console.error('Silme hatası:', error)
      toast.error(t('common.error') )
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
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => requestUserAction(user.isBanned ? 'unban' : 'ban', user)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.isBanned
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {user.isBanned ? t('common.unban') : t('common.ban')}
                          </button>
                          <button
                            onClick={() => requestUserAction('delete', user)}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200"
                          >
                            {t('common.delete')}
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

      {pendingAction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-action-title"
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                pendingAction.type === 'delete' || pendingAction.type === 'ban' ? 'bg-red-50' : 'bg-green-50'
              }`}>
                <ExclamationTriangleIcon className={`h-5 w-5 ${
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
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  autoFocus
                />
              </label>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={processingAction}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmPendingAction}
                disabled={processingAction}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  pendingAction.type === 'delete' || pendingAction.type === 'ban'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {processingAction
                  ? t('common.loading')
                  : pendingAction.type === 'delete'
                    ? t('common.delete')
                    : pendingAction.type === 'ban'
                      ? t('common.ban')
                      : t('common.unban')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
