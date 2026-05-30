import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { TutorProvider } from './tutor/TutorProvider'
import './i18n'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TutorProvider>
          <Suspense fallback={null}>
            <App />
          </Suspense>
        </TutorProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
