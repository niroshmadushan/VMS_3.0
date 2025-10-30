"use client"

// Re-export functions from custom auth for backward compatibility
export { getCurrentUser, signOut as logout } from './custom-auth'

// Legacy requireAuth function for backward compatibility
export async function requireAuth() {
  const { getCurrentUser } = await import('./custom-auth')
  const user = await getCurrentUser()
  if (!user) {
    window.location.href = '/login'
    return null
  }
  return user
}
