import { Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import LandingPage from '@/features/landing/LandingPage'
import { ComingSoon } from '@/routes/ComingSoon'
import { NotFound } from '@/routes/NotFound'

const STUB_ROUTES = ['/lab', '/tutor', '/exams', '/pricing', '/login', '/dashboard']

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<LandingPage />} />
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
