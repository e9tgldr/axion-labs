import { Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import LandingPage from '@/features/landing/LandingPage'
import { LabCatalog } from '@/lab/LabCatalog'
import { SimDetailPage } from '@/lab/SimDetailPage'
import { ComingSoon } from '@/routes/ComingSoon'
import { NotFound } from '@/routes/NotFound'

const STUB_ROUTES = ['/tutor', '/exams', '/pricing', '/login', '/dashboard']

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
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/lab" element={<LabCatalog />} />
          <Route path="/lab/:id" element={<SimDetailPage />} />
          {STUB_ROUTES.map((p) => (
            <Route key={p} path={p} element={<ComingSoon />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
