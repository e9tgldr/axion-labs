import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

function Probe() {
  const { user, profile, signInWithGoogle, signOut } = useAuth()
  return (
    <div>
      <span data-testid="who">{user ? (profile?.displayName ?? '...') : 'anon'}</span>
      <button onClick={() => signInWithGoogle()}>in</button>
      <button onClick={() => signOut()}>out</button>
    </div>
  )
}

beforeEach(() => localStorage.clear())

describe('AuthProvider (demo client)', () => {
  it('starts anonymous, signs in, and signs out', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('who')).toHaveTextContent('anon'))
    await act(async () => {
      screen.getByText('in').click()
    })
    await waitFor(() => expect(screen.getByTestId('who')).toHaveTextContent('Demo User'))
    await act(async () => {
      screen.getByText('out').click()
    })
    await waitFor(() => expect(screen.getByTestId('who')).toHaveTextContent('anon'))
  })
})
