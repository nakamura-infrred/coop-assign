import { useMemo, useState, type FormEvent } from 'react'
import type { UserRole, UserStatus } from '@coop-assign/domain'
import { useUserManagement } from '../providers/UserManagementProvider'

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; description: string }> = [
  { value: 'admin', label: '管理者', description: 'すべての操作が可能' },
  { value: 'coordinator', label: '調整担当', description: '割り振りや登録は可能、権限管理は不可' },
  { value: 'viewer', label: '閲覧のみ', description: '参照専用のロール' },
]

const STATUS_LABEL: Record<UserStatus, string> = {
  active: '有効',
  invited: '招待中',
  suspended: '停止中',
}

const STATUS_CLASS: Record<UserStatus, string> = {
  active: 'user-mgmt__status--active',
  invited: 'user-mgmt__status--invited',
  suspended: 'user-mgmt__status--suspended',
}

const ROLE_ORDER: Record<UserRole, number> = {
  admin: 0,
  coordinator: 1,
  viewer: 2,
}

const STATUS_ORDER: Record<UserStatus, number> = {
  active: 0,
  invited: 1,
  suspended: 2,
}

const formatDateTime = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return '未取得'
  }
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function UserManagement() {
  const {
    profiles,
    currentProfile,
    loading,
    error,
    updateRole,
    removeUser,
    inviteUser,
  } = useUserManagement()

  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteForm, setInviteForm] = useState<{
    email: string
    displayName: string
    role: UserRole
    note: string
  }>({
    email: '',
    displayName: '',
    role: 'viewer',
    note: '',
  })

  const canManage = currentProfile?.role === 'admin'

  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => {
      const roleDiff = ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
      if (roleDiff !== 0) return roleDiff
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (statusDiff !== 0) return statusDiff
      const nameA = (a.displayName || a.email || '').toLocaleLowerCase('ja-JP')
      const nameB = (b.displayName || b.email || '').toLocaleLowerCase('ja-JP')
      return nameA.localeCompare(nameB, 'ja')
    })
  }, [profiles])

  const handleRoleChange = async (userId: string, nextRole: UserRole) => {
    if (!canManage) return
    setFeedback(null)
    setRoleUpdatingId(userId)
    try {
      await updateRole(userId, nextRole)
      setFeedback({ type: 'success', message: '権限を更新しました。' })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '権限の更新に失敗しました。'
      setFeedback({ type: 'error', message })
    } finally {
      setRoleUpdatingId(null)
    }
  }

  const handleRemove = async (userId: string, displayLabel: string) => {
    if (!canManage) return
    if (!window.confirm(`${displayLabel} をユーザー一覧から削除しますか？`)) {
      return
    }
    setFeedback(null)
    setRemovingId(userId)
    try {
      await removeUser(userId)
      setFeedback({ type: 'success', message: 'ユーザーを削除しました。' })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ユーザーの削除に失敗しました。'
      setFeedback({ type: 'error', message })
    } finally {
      setRemovingId(null)
    }
  }

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManage) return
    setFeedback(null)
    setInviteSubmitting(true)
    try {
      await inviteUser({
        email: inviteForm.email,
        displayName: inviteForm.displayName,
        role: inviteForm.role,
        note: inviteForm.note,
      })
      setInviteForm({
        email: '',
        displayName: '',
        role: 'viewer',
        note: '',
      })
      setFeedback({ type: 'success', message: 'ユーザーを招待しました。' })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'ユーザーの招待に失敗しました。'
      setFeedback({ type: 'error', message })
    } finally {
      setInviteSubmitting(false)
    }
  }

  return (
    <section className="app__section">
      <header className="app__section-header">
        <div>
          <h2>ユーザー管理</h2>
          <p className="app__muted">
            テナントに属するユーザーの権限とステータスを管理します。
          </p>
        </div>
        <div className="user-mgmt__legend">
          {ROLE_OPTIONS.map((option) => (
            <span key={option.value} className="user-mgmt__legend-item">
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </span>
          ))}
        </div>
      </header>

      {feedback && (
        <p
          className={
            feedback.type === 'error' ? 'app__alert' : 'app__notice'
          }
        >
          {feedback.message}
        </p>
      )}

      {error && <p className="app__alert">{error}</p>}

      {canManage ? (
        <form className="user-mgmt__invite" onSubmit={handleInvite}>
          <div className="user-mgmt__invite-grid">
            <label>
              メールアドレス
              <input
                type="email"
                required
                value={inviteForm.email}
                onChange={(event) =>
                  setInviteForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="sample@example.com"
              />
            </label>
            <label>
              表示名（任意）
              <input
                type="text"
                value={inviteForm.displayName}
                onChange={(event) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    displayName: event.target.value,
                  }))
                }
                placeholder="公開する名前"
              />
            </label>
            <label>
              権限
              <select
                value={inviteForm.role}
                onChange={(event) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    role: event.target.value as UserRole,
                  }))
                }
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="user-mgmt__invite-note">
              メモ（任意）
              <textarea
                value={inviteForm.note}
                onChange={(event) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    note: event.target.value,
                  }))
                }
                placeholder="招待の背景や補足情報を記入できます"
                rows={2}
              />
            </label>
          </div>
          <button
            className="app__button"
            type="submit"
            disabled={inviteSubmitting}
          >
            {inviteSubmitting ? '送信中…' : 'ユーザーを招待'}
          </button>
        </form>
      ) : (
        <p className="app__muted">
          閲覧権限のみのため、ユーザー管理操作は利用できません。
        </p>
      )}

      {loading ? (
        <p className="app__muted">読み込み中…</p>
      ) : sortedProfiles.length === 0 ? (
        <p className="app__muted">
          登録済みのユーザーがありません。ユーザーを追加すると一覧に表示されます。
        </p>
      ) : (
        <div className="user-mgmt__table-wrapper">
          <table className="user-mgmt__table">
            <thead>
              <tr>
                <th>表示名</th>
                <th>メール</th>
                <th>権限</th>
                <th>ステータス</th>
                <th>最終更新</th>
                {canManage && <th>操作</th>}
              </tr>
            </thead>
            <tbody>
              {sortedProfiles.map((profile) => {
                const displayName = profile.displayName || profile.email || '未設定'
                const isSelf = profile.id === currentProfile?.id
                return (
                  <tr key={profile.id}>
                    <td>
                      <div className="user-mgmt__name">
                        <span>{displayName}</span>
                        {isSelf && <span className="user-mgmt__badge">自分</span>}
                      </div>
                    </td>
                    <td className="user-mgmt__email">{profile.email || '未設定'}</td>
                    <td>
                      {canManage && !isSelf ? (
                        <select
                          value={profile.role}
                          disabled={roleUpdatingId === profile.id}
                          onChange={(event) => {
                            const nextRole = event.target.value as UserRole
                            if (nextRole === profile.role) return
                            void handleRoleChange(profile.id, nextRole)
                          }}
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        ROLE_OPTIONS.find((option) => option.value === profile.role)
                          ?.label ?? profile.role
                      )}
                    </td>
                    <td>
                      <span
                        className={`user-mgmt__status ${STATUS_CLASS[profile.status]}`}
                      >
                        {STATUS_LABEL[profile.status] ?? profile.status}
                      </span>
                    </td>
                    <td>{formatDateTime(profile.updatedAt)}</td>
                    {canManage && (
                      <td>
                        {!isSelf && (
                          <button
                            type="button"
                            className="app__button app__button--secondary"
                            disabled={removingId === profile.id}
                            onClick={() =>
                              void handleRemove(profile.id, displayName)
                            }
                          >
                            {removingId === profile.id ? '削除中…' : '削除'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

