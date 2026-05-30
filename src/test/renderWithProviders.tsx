import { type ReactElement } from 'react'
import { render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { AuthProvider } from '@/auth/AuthProvider'
import { TutorProvider } from '@/tutor/TutorProvider'

/** Render a component wrapped in i18n + auth + tutor + router providers. */
export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <TutorProvider>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </TutorProvider>
      </AuthProvider>
    </I18nextProvider>,
  )
}
