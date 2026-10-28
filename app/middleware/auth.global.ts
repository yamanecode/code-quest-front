import { useAuthStore } from '~/stores/auth'
import type { Role } from '~/types/api'

// Pages for visitors only: a logged-in user who opens one goes to their home.
const PUBLIC_PATHS = ['/entrar', '/cadastro']
// Open to everyone, logged in or not (the landing page stays reachable to read it again).
const OPEN_PATHS = ['/', '/limitacoes']
// Open to any logged-in user, whatever the role.
const SHARED_PATHS = ['/ajuda']

function isProfessorPath(path: string) {
  return path === '/professor' || path.startsWith('/professor/')
}

// Where a user with this role must go instead of `path`, or null when allowed.
function redirectFor(path: string, role: Role | null): string | null {
  if (OPEN_PATHS.includes(path)) return null
  const isPublic = PUBLIC_PATHS.includes(path)
  if (!role) return isPublic ? null : '/entrar'
  const home = role === 'professor' ? '/professor' : '/inicio'
  if (isPublic) return home
  if (SHARED_PATHS.includes(path)) return null
  const allowed = role === 'professor' ? isProfessorPath(path) : !isProfessorPath(path)
  return allowed ? null : home
}

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  auth.restore()
  const target = redirectFor(to.path, auth.role)
  if (target && target !== to.path) return navigateTo(target)
})
