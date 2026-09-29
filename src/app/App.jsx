import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from '../shared/components/ErrorBoundary'
import Layout from './Layout'
import { routePaths } from './router'

const Home = lazy(() => import('../pages/home/HomePageWrapper.jsx'))
const OurStory = lazy(() => import('../pages/story/StoryPageWrapper.jsx'))
const MenuPage = lazy(() => import('../pages/menu/MenuPageWrapper.jsx'))
const Gallery = lazy(() => import('../pages/gallery/GalleryPageWrapper.jsx'))
const VisitContact = lazy(() => import('../pages/visit/VisitContactPageWrapper.jsx'))
const PrivacyPolicy = lazy(() => import('../pages/legal/PrivacyPolicyPage.jsx'))
const TermsConditions = lazy(() => import('../pages/legal/TermsConditionsPage.jsx'))
const NotFound = lazy(() => import('../pages/not-found/NotFoundPageWrapper.jsx'))

// A quiet placeholder for the moment a lazy route chunk is in flight. The site
// intro stays in Layout: as a Suspense fallback it would unmount the instant
// the chunk resolved, cutting its fixed 2300ms dwell short and making the intro
// flash past instead of playing.
function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="route-loading-bar" aria-hidden="true" />
      <span className="sr-only">Loading page</span>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoading />}>
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
