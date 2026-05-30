import { useContext } from 'react'
import { TutorCtx, type TutorContextValue } from './TutorProvider'
export function useTutor(): TutorContextValue {
  const ctx = useContext(TutorCtx)
  if (!ctx) throw new Error('useTutor must be used within TutorProvider')
  return ctx
}
