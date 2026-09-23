import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    if (typeof console !== 'undefined' && import.meta?.env?.DEV) {
      console.error('ErrorBoundary caught:', error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{ padding: '4rem 2rem', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: 'var(--fs-h1, 2.5rem)', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: 'var(--color-muted, #666)', marginBottom: '2rem', maxWidth: '400px' }}>
            {this.state.error?.message || 'Please refresh the page.'}
          </p>
          <div className="error-boundary-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn btn--primary"
            >
              Refresh
            </button>
            <Link to="/" className="btn btn--outline">
              Go Home
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
