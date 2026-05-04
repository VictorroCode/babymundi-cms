'use client'

import { useAuth } from '@payloadcms/ui'

export default function LogoutButton() {
  const { logOut } = useAuth()

  const handleLogout = async () => {
    try {
      // 1) Invalidate current auth + all persisted sessions in Payload.
      await fetch('/api/users/logout?allSessions=true', {
        method: 'POST',
        credentials: 'include',
      })

      // 2) Force-clear auth cookie variants to avoid stale cookie edge cases.
      await fetch('/api/force-logout', {
        method: 'POST',
        credentials: 'include',
      })

      // 3) Clear client auth state as a final guard.
      await logOut()
    } catch {
      // Fall through to hard redirect even if one call fails.
    }

    window.location.replace('/admin/login?logout=1')
  }

  return (
    <button className="bm-logout-btn" onClick={handleLogout} type="button">
      Cerrar sesión
    </button>
  )
}
