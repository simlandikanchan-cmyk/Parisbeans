import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main id="main" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: 'var(--fs-h1)', marginBottom: '1rem' }}>404</h1>
      <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>
        This page could not be found.
      </p>
      <Link to="/" className="btn btn--primary">
        Go Home
      </Link>
    </main>
  )
}
