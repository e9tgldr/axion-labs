import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="min-h-[60vh]" />
  if (!user) return <Navigate to={`/login?from=${encodeURIComponent(loc.pathname)}`} replace />
  return <>{children}</>
}
