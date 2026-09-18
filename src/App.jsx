import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'

const Home = lazy(() => import('./pages/Home.jsx'))
const OurStory = lazy(() => import('./pages/OurStory.jsx'))
const MenuPage = lazy(() => import('./pages/MenuPage.jsx'))
const Gallery = lazy(() => import('./pages/Gallery.jsx'))
const VisitContact = lazy(() => import('./pages/VisitContact.jsx'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy.jsx'))
const TermsConditions = lazy(() => import('./pages/TermsConditions.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

function Loading() {
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="our-story" element={<OurStory />} />
            <Route path="story" element={<Navigate to="/our-story" replace />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="visit-contact" element={<VisitContact />} />
            <Route path="visit" element={<Navigate to="/visit-contact" replace />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="privacy" element={<Navigate to="/privacy-policy" replace />} />
            <Route path="terms-and-conditions" element={<TermsConditions />} />
            <Route path="terms" element={<Navigate to="/terms-and-conditions" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
