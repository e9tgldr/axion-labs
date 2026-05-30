import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import LandingPage from '@/features/landing/LandingPage'
import { LoginPage } from '@/routes/LoginPage'
import { DashboardPage } from '@/routes/DashboardPage'
import { RequireAuth } from '@/auth/RequireAuth'
import { ComingSoon } from '@/routes/ComingSoon'
import { NotFound } from '@/routes/NotFound'

// Lazy so the lab (and its three.js/drei dependency via SimPlayer/SimCanvas)
// stays out of the initial bundle and only loads on /lab*.
const LabCatalog = lazy(() => import('@/lab/LabCatalog').then((m) => ({ default: m.LabCatalog })))
const SimDetailPage = lazy(() => import('@/lab/SimDetailPage').then((m) => ({ default: m.SimDetailPage })))

const STUB_ROUTES = ['/tutor', '/exams', '/pricing']

export default function App() {
  const { t } = useTranslation('landing')
  return (
    <div className="min-h-screen bg-bg text-text">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-axion focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:uppercase focus:tracking-wider focus:text-bg"
      >
        {t('a11y.skip')}
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="pt-16">
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/lab" element={<LabCatalog />} />
            <Route path="/lab/:id" element={<SimDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
            {STUB_ROUTES.map((p) => (
              <Route key={p} path={p} element={<ComingSoon />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
