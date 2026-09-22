import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './ui/ErrorBoundary'
import Layout from './layout/Layout'
import { routePaths } from './router'

const Home = lazy(() => import('./features/home/Home.jsx'))
const OurStory = lazy(() => import('./features/story/OurStory.jsx'))
const MenuPage = lazy(() => import('./features/menu/MenuPage.jsx'))
const Gallery = lazy(() => import('./features/gallery/Gallery.jsx'))
const VisitContact = lazy(() => import('./features/visit/VisitContact.jsx'))
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
            <Route path={routePaths.story} element={<OurStory />} />
            <Route path="story" element={<Navigate to={`/${routePaths.story}`} replace />} />
            <Route path={routePaths.menu} element={<MenuPage />} />
            <Route path={routePaths.gallery} element={<Gallery />} />
            <Route path={routePaths.visit} element={<VisitContact />} />
            <Route path="visit" element={<Navigate to={`/${routePaths.visit}`} replace />} />
            <Route path={routePaths.privacy} element={<PrivacyPolicy />} />
            <Route path="privacy" element={<Navigate to={`/${routePaths.privacy}`} replace />} />
            <Route path={routePaths.terms} element={<TermsConditions />} />
            <Route path="terms" element={<Navigate to={`/${routePaths.terms}`} replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
